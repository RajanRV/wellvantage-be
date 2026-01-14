/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
