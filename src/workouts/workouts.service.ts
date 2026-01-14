/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, WorkoutType } from '../../generated/prisma/client';
import { CreateWorkoutDto } from './dto/create-workout.dto';

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

  async createWorkoutWithDays(params: {
    gymId: string;
    role: UserRole;
    dto: CreateWorkoutDto;
  }) {
    const { gymId, role, dto } = params;

    // Authorization
    if (![UserRole.GYM_OWNER, UserRole.TRAINER].includes(role)) {
      throw new ForbiddenException();
    }

    return this.prisma.workout.create({
      data: {
        gymId,
        name: dto.name,
        type: dto.type,
        notes: dto.notes,

        days: {
          create: dto.days.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,

            exercises: {
              create: day.exercises.map((ex) => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rest: ex.rest,
                orderIndex: ex.orderIndex,
              })),
            },
          })),
        },
      },
      include: {
        days: {
          include: {
            exercises: true,
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
