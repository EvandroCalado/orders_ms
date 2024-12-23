import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChangeStatusOrderDto } from './dto/change-status-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationOrderDto } from './dto/pagination-order.dto';
import { OrderStatus } from './enum/status.enum';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('create_order')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);
    const mappedOrder = {
      ...order,
      status: order.status as OrderStatus,
    };

    const paymentSession =
      await this.ordersService.createPaymentSession(mappedOrder);

    return {
      order,
      paymentSession,
    };
  }

  @MessagePattern('find_all_orders')
  findAll(@Payload() paginationOrderDto: PaginationOrderDto) {
    return this.ordersService.findAll(paginationOrderDto);
  }

  @MessagePattern('find_one_order')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('change_status_order')
  changeStatus(@Payload() changeStatusOrderDto: ChangeStatusOrderDto) {
    return this.ordersService.changeStatus(changeStatusOrderDto);
  }
}
