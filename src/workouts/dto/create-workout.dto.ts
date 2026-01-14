/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { WorkoutType } from '../../../generated/prisma/client';
import { Type } from 'class-transformer';
import { CreateWorkoutDayDto } from './create-workout-day.dto';

export class CreateWorkoutDto {
  @IsString()
  name: string;

  @IsEnum(WorkoutType)
  type: WorkoutType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutDayDto)
  days: CreateWorkoutDayDto[];
}
