/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAvailabilityDto {
  @IsDateString()
  date: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsBoolean()
  repeat?: boolean;

  @IsOptional()
  @IsDateString()
  repeatUntil?: string;

  @IsOptional()
  @IsString()
  sessionName?: string;
}
