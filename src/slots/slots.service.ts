import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrainerAvailability } from '../../generated/prisma/client';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async getSlotsForDate(params: { trainerId: string; date: string }) {
    const { trainerId, date } = params;

    if (!date) {
      throw new BadRequestException('date is required');
    }

    const requestedDate = new Date(date);
    requestedDate.setHours(0, 0, 0, 0);

    const requestedEndDate = new Date(date);
    requestedEndDate.setHours(23, 59, 59, 0)

    // Fetch availability records that MAY apply
    const availabilities = await this.prisma.trainerAvailability.findMany({
      where: {
        trainerId,
        OR: [
          { date: { gte: requestedDate, lte: requestedEndDate } },
          {
            repeat: true,
            repeatUntil: { gte: requestedDate },
          },
        ],
      },
    });

    // Filter + map to slots
    const slots = availabilities
      .filter((availability) => this.appliesToDate(availability, requestedDate))
      .map((availability) => ({
        availabilityId: availability.id,
        trainerId,
        date: requestedDate.toISOString().split('T')[0],
        startTime: availability.startTime.toISOString(),
        endTime: availability.endTime.toISOString(),
        sessionName: availability.sessionName,
      }));

    return slots;
  }

  private appliesToDate(
    availability: TrainerAvailability,
    requestedDate: Date,
  ): boolean {
    const baseDate = new Date(availability.date);
    baseDate.setHours(0, 0, 0, 0);

    if (!availability.repeat) {
      return baseDate.getTime() === requestedDate.getTime();
    }

    const repeatUntil = availability.repeatUntil
      ? new Date(availability.repeatUntil)
      : null;

    return (
      requestedDate >= baseDate &&
      (!repeatUntil || requestedDate <= repeatUntil)
    );
  }
}
