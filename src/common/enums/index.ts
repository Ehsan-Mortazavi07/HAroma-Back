export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIP = 'vip',
  USER = 'user',
}

export { UserRole as Role };

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  ONLINE = 'online',
  COD = 'cod',
  INSTALLMENT = 'installment',
}
