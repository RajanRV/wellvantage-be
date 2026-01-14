/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('slots')
@UseGuards(JwtAuthGuard)
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  async getSlots(@Query('date') date: string, @CurrentUser() user: any) {
    return this.slotsService.getSlotsForDate({
      trainerId: user.userId,
      date,
    });
  }
}
