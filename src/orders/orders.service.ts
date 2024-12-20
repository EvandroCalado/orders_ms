import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/configs/services.constant';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChangeStatusOrderDto } from './dto/change-status-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ErrorOrderDto } from './dto/error-order.dto';
import { PaginationOrderDto } from './dto/pagination-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  private microServiceError(errorOrderDto: ErrorOrderDto) {
    throw new RpcException({
      statusCode: errorOrderDto.statusCode,
      message: errorOrderDto.message,
      error: errorOrderDto.error,
    });
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productsIds = createOrderDto.items.map((item) => item.productId);

      const products: any[] = await firstValueFrom(
        this.client.send('validate_products', productsIds),
      );

      const totalAmount = createOrderDto.items.reduce((acc, item) => {
        const price = products.find(
          (product) => product.id === item.productId,
        ).price;

        return price * item.quantity + acc;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, item) => {
        return item.quantity + acc;
      }, 0);

      const order = await this.prismaService.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItems: {
            createMany: {
              data: createOrderDto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find((product) => product.id === item.productId)
                  .price,
              })),
            },
          },
        },
        include: {
          OrderItems: {
            select: {
              productId: true,
              quantity: true,
              price: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItems: order.OrderItems.map((item) => ({
          name: products.find((product) => product.id === item.productId).name,
          ...item,
        })),
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(paginationOrderDto: PaginationOrderDto) {
    const { page, limit, status } = paginationOrderDto;

    const total = await this.prismaService.order.count({
      where: {
        status,
      },
    });
    const totalPages = Math.ceil(total / limit);

    return {
      data: await this.prismaService.order.findMany({
        where: {
          status,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      meta: {
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          perPage: limit,
          totalItems: total,
        },
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prismaService.order.findUnique({
      where: {
        id,
      },
      include: {
        OrderItems: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!order) {
      this.microServiceError({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Order not found',
        error: 'Not Found',
      });
    }

    const productsIds = order.OrderItems.map((item) => item.productId);

    const products: any[] = await firstValueFrom(
      this.client.send('validate_products', productsIds),
    );

    return {
      ...order,
      OrderItems: order.OrderItems.map((item) => ({
        name: products.find((product) => product.id === item.productId).name,
        ...item,
      })),
    };
  }

  async changeStatus(changeStatusOrderDto: ChangeStatusOrderDto) {
    await this.findOne(changeStatusOrderDto.id);

    return this.prismaService.order.update({
      where: {
        id: changeStatusOrderDto.id,
      },
      data: {
        status: changeStatusOrderDto.status,
      },
    });
  }
}
