import { IsNumber, IsPositive, IsString } from 'class-validator';

export class ErrorOrderDto {
  @IsNumber()
  @IsPositive()
  statusCode: number;

  @IsString()
  message: string;

  @IsString()
  error: string;
}
