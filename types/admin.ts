export type UserStatus = 'Active' | 'Inactive' | 'Suspended' | 'Archived';
export type VendorStatus = 'Active' | 'Pending' | 'Suspended' | 'Archived';
export type MealStatus = 'Available' | 'Unavailable' | 'Archived';
export type OrderStatus = 'Completed' | 'Pending' | 'Processing' | 'Cancelled';
export type TransactionStatus = 'Successful' | 'Pending' | 'Failed' | 'Refunded';
export type UserRole = 'admin' | 'vendor' | 'user';
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Customer';
  status: UserStatus;
  joinedAt: string;
  orders: number;
}
export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  status: VendorStatus;
  joinedAt: string;
  totalOrders: number;
  revenue: string;
  rating: number;
}
export interface Meal {
  id: string;
  name: string;
  vendor: string;
  vendorId: string;
  category: string;
  price: string;
  description: string;
  status: MealStatus;
  createdAt: string;
}
export interface Order {
  id: string;
  customer: string;
  vendor: string;
  items: number;
  amount: string;
  paymentMethod: string;
  date: string;
  status: OrderStatus;
}
export interface Transaction {
  id: string;
  orderId: string;
  customer: string;
  vendor: string;
  amount: string;
  method: string;
  date: string;
  status: TransactionStatus;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}