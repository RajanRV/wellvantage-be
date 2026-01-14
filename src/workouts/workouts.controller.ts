/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  Post,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWorkoutDto } from './dto/create-workout.dto';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  async listWorkouts(@CurrentUser() user: any) {
    return this.workoutsService.getWorkouts({
      gymId: user.gymId,
    });
  }

  @Post()
  async createWorkout(@Body() dto: CreateWorkoutDto, @CurrentUser() user: any) {
    return this.workoutsService.createWorkoutWithDays({
      gymId: user.gymId,
      role: user.role,
      dto,
    });
  }

  @Delete(':id')
  async deleteWorkout(
    @Param('id') workoutId: string,
    @CurrentUser() user: any,
  ) {
    return this.workoutsService.deleteWorkout({
      workoutId,
      gymId: user.gymId,
    });
  }
}
