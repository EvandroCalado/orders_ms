import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NatsModule } from 'src/transports/nats.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [NatsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}
