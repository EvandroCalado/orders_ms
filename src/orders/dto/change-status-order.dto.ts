import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatus } from '../enum/status.enum';

export class ChangeStatusOrderDto {
  @IsUUID()
  id: string;

  @IsEnum(OrderStatus, { each: true })
  status: OrderStatus;
}
