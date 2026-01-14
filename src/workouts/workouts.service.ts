import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async deleteWorkout(params: { workoutId: string; gymId: string }) {
    const { workoutId, gymId } = params;

    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
    });

    if (!workout || workout.deletedAt) {
      throw new NotFoundException('Workout not found');
    }

    if (workout.gymId !== gymId) {
      throw new ForbiddenException(
        'You are not allowed to delete this workout',
      );
    }

    await this.prisma.workout.update({
      where: { id: workoutId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
