export type OrderStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  date: string;
  items: OrderItem[];
}