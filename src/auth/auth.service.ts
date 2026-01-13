import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../../generated/prisma/client';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async loginWithGoogle(token: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException();

    const { sub, email, name, picture } = payload;

    let user = await this.prisma.user.findUnique({
      where: { googleId: sub },
      include: { gym: true },
    });

    // If user is not found in db, create a user and a gym linked to that user. 
    if (!user) {
      const gym = await this.prisma.gym.create({
        data: {
          name: `${name}'s Gym`,
        },
      });

      user = await this.prisma.user.create({
        data: {
          googleId: sub,
          email: email || '',
          name,
          avatarUrl: picture,
          role: UserRole.GYM_OWNER,
          gymId: gym.id,
        },
        include: { gym: true },
      });
    }

    const jwtPayload = {
      userId: user.id,
      gymId: user.gymId,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(jwtPayload),
      user,
    };
  }
}