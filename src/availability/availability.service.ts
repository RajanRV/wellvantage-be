import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async setAvailability(params: {
    trainerId: string;
    dto: CreateAvailabilityDto;
  }) {
    const { trainerId, dto } = params;

    const date = new Date(dto.date);
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // 1️⃣ Validate time range
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate repeat rules
    if (dto.repeat && !dto.repeatUntil) {
      throw new BadRequestException(
        'repeatUntil is required when repeat is true',
      );
    }

    if (dto.repeat && dto.repeatUntil) {
      const repeatUntil = new Date(dto.repeatUntil);
      if (repeatUntil <= date) {
        throw new BadRequestException('repeatUntil must be after date');
      }
    }

    // Save ONE availability record
    return this.prisma.trainerAvailability.create({
      data: {
        trainerId,
        date,
        startTime,
        endTime,
        repeat: dto.repeat ?? false,
        repeatUntil: dto.repeatUntil ? new Date(dto.repeatUntil) : null,
        sessionName: dto.sessionName,
      },
    });
  }
}
