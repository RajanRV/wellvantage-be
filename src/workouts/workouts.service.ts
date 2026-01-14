/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkoutType } from '../../generated/prisma/client';

interface GetWorkoutsParams {
  gymId: string;
  type?: WorkoutType;
  published?: boolean;
}

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  async getWorkouts(params: GetWorkoutsParams) {
    const { gymId } = params;
    return this.prisma.workout.findMany({
      where: {
        gymId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });
  }
}
