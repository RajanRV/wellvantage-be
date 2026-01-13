import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../../generated/prisma/client';

// Mock google-auth-library OAuth2Client used inside AuthService
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn(),
    })),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    gym: { create: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };

  const mockGooglePayload = {
    sub: 'google-sub-id',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'http://example.com/avatar.png',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      gym: {
        create: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw UnauthorizedException when google payload is missing', async () => {
    const { OAuth2Client } = jest.requireMock('google-auth-library');
    const mockInstance = (OAuth2Client as jest.Mock).mock.results[0].value;
    mockInstance.verifyIdToken.mockResolvedValue({
      getPayload: () => null,
    });

    await expect(service.loginWithGoogle('invalid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(mockInstance.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'invalid-token',
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  });

  it('should login existing user and return jwt token', async () => {
    const existingUser = {
      id: 'user-id',
      gymId: 'gym-id',
      role: UserRole.GYM_OWNER,
      gym: { id: 'gym-id', name: "Test User's Gym" },
    };

    const { OAuth2Client } = jest.requireMock('google-auth-library');
    const mockInstance = (OAuth2Client as jest.Mock).mock.results[0].value;
    mockInstance.verifyIdToken.mockResolvedValue({
      getPayload: () => mockGooglePayload,
    });

    prisma.user.findUnique.mockResolvedValue(existingUser);

    const result = await service.loginWithGoogle('valid-token');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { googleId: mockGooglePayload.sub },
      include: { gym: true },
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: existingUser.id,
      gymId: existingUser.gymId,
      role: existingUser.role,
    });
    expect(result).toEqual({
      accessToken: 'signed-jwt-token',
      user: existingUser,
    });
  });

  it('should create new gym and user when not found and return jwt token', async () => {
    const createdGym = { id: 'new-gym-id', name: "Test User's Gym" };
    const createdUser = {
      id: 'new-user-id',
      gymId: createdGym.id,
      role: UserRole.GYM_OWNER,
      gym: createdGym,
    };

    const { OAuth2Client } = jest.requireMock('google-auth-library');
    const mockInstance = (OAuth2Client as jest.Mock).mock.results[0].value;
    mockInstance.verifyIdToken.mockResolvedValue({
      getPayload: () => mockGooglePayload,
    });

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.gym.create.mockResolvedValue(createdGym);
    prisma.user.create.mockResolvedValue(createdUser);

    const result = await service.loginWithGoogle('new-user-token');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { googleId: mockGooglePayload.sub },
      include: { gym: true },
    });
    expect(prisma.gym.create).toHaveBeenCalledWith({
      data: {
        name: `${mockGooglePayload.name}'s Gym`,
      },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        googleId: mockGooglePayload.sub,
        email: mockGooglePayload.email,
        name: mockGooglePayload.name,
        avatarUrl: mockGooglePayload.picture,
        role: UserRole.GYM_OWNER,
        gymId: createdGym.id,
      },
      include: { gym: true },
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: createdUser.id,
      gymId: createdUser.gymId,
      role: createdUser.role,
    });

    expect(result).toEqual({
      accessToken: 'signed-jwt-token',
      user: createdUser,
    });
  });
});
