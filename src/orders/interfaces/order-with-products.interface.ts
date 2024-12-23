import { OrderStatus } from '../enum/status.enum';

export interface OrderWithProducts {
  OrderItems: {
    productId: number;
    quantity: number;
    price: number;
    name: any;
  }[];
  id: string;
  totalAmount: number;
  totalItems: number;
  paid: boolean;
  paidAt: Date | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
