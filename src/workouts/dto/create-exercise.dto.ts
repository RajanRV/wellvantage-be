/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  sets?: number;

  @IsOptional()
  @IsString()
  reps?: string;

  @IsOptional()
  @IsString()
  rest?: string;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}
