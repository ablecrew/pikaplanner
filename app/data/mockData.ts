import type { User, Vendor, Meal, Order, Transaction, Notification } from '@/types/admin';
export const mockUsers: User[] = [
  { id: 'USR-001', name: 'Alice Johnson', email: 'alice@example.com', phone: '+2547 4564-6789', role: 'Customer', status: 'Active', joinedAt: 'Jan 15, 2024', orders: 24 },
  { id: 'USR-002', name: 'Bob Smith', email: 'bob@example.com', phone: '+2547 9805-4536', role: 'Customer', status: 'Active', joinedAt: 'Feb 3, 2024', orders: 18 },
  { id: 'USR-003', name: 'Carol White', email: 'carol@example.com', phone: '+2547 8769-0978', role: 'Admin', status: 'Active', joinedAt: 'Dec 20, 2023', orders: 0 },
  { id: 'USR-004', name: 'David Brown', email: 'david@example.com', phone: '+2547 8970-7643', role: 'Customer', status: 'Suspended', joinedAt: 'Mar 10, 2024', orders: 5 },
  { id: 'USR-005', name: 'Eva Martinez', email: 'eva@example.com', phone: '+2547 8769-0965', role: 'Customer', status: 'Active', joinedAt: 'Apr 22, 2024', orders: 31 },
  { id: 'USR-006', name: 'Frank Lee', email: 'frank@example.com', phone: '+2547 6734-0976', role: 'Customer', status: 'Archived', joinedAt: 'Nov 5, 2023', orders: 12 },
  { id: 'USR-007', name: 'Grace Kim', email: 'grace@example.com', phone: '+2547 6754-8970', role: 'Customer', status: 'Active', joinedAt: 'May 18, 2024', orders: 8 },
  { id: 'USR-008', name: 'Henry Davis', email: 'henry@example.com', phone: '+2547 6748-8907', role: 'Customer', status: 'Inactive', joinedAt: 'Jun 1, 2024', orders: 2 },
];
export const mockVendors: Vendor[] = [
  { id: 'VND-001', name: 'Green Bowl Kitchen', email: 'greenbowl@vendor.com', phone: '+2547 6759-6098', category: 'Healthy', location: 'New York, NY', status: 'Active', joinedAt: 'Jan 10, 2024', totalOrders: 342, revenue: '$12,450', rating: 4.8 },
  { id: 'VND-002', name: 'Pizza Palace', email: 'pizzapalace@vendor.com', phone: '+2547 8345-1243', category: 'Italian', location: 'Chicago, IL', status: 'Active', joinedAt: 'Feb 15, 2024', totalOrders: 521, revenue: '$15,600', rating: 4.6 },
  { id: 'VND-003', name: 'Burger Barn', email: 'burgerbarn@vendor.com', phone: '+2547 2341-5632', category: 'Burgers', location: 'Los Angeles, CA', status: 'Active', joinedAt: 'Mar 20, 2024', totalOrders: 489, revenue: '$12,300', rating: 4.5 },
  { id: 'VND-004', name: 'Sushi Express', email: 'sushiexpress@vendor.com', phone: '+2547 6754-9076', category: 'Japanese', location: 'San Francisco, CA', status: 'Pending', joinedAt: 'Apr 5, 2024', totalOrders: 0, revenue: '$0', rating: 0 },
  { id: 'VND-005', name: 'Spice Route', email: 'spiceroute@vendor.com', phone: '+2547 6784-9870', category: 'Indian', location: 'Houston, TX', status: 'Active', joinedAt: 'Jan 25, 2024', totalOrders: 267, revenue: '$5,200', rating: 4.3 },
  { id: 'VND-006', name: 'Taco Fiesta', email: 'tacofiesta@vendor.com', phone: '+2547 8954-8976', category: 'Mexican', location: 'Austin, TX', status: 'Suspended', joinedAt: 'May 1, 2024', totalOrders: 89, revenue: '$2,100', rating: 3.9 },
  { id: 'VND-007', name: 'Noodle House', email: 'noodlehouse@vendor.com', phone: '+2547 9807-3421', category: 'Asian', location: 'Seattle, WA', status: 'Active', joinedAt: 'Feb 28, 2024', totalOrders: 312, revenue: '$8,400', rating: 4.7 },
  { id: 'VND-008', name: 'Fresh Salads Co', email: 'freshsalads@vendor.com', phone: '+2547 8964-2345', category: 'Salads', location: 'Portland, OR', status: 'Archived', joinedAt: 'Dec 1, 2023', totalOrders: 156, revenue: '$3,800', rating: 4.1 },
];
export const mockMeals: Meal[] = [
  { id: 'MEL-001', name: 'Avocado Power Bowl', vendor: 'Green Bowl Kitchen', vendorId: 'VND-001', category: 'Healthy', price: '$14.99', description: 'Fresh avocado, quinoa, roasted chickpeas, and tahini dressing.', status: 'Available', createdAt: 'Jan 12, 2024' },
  { id: 'MEL-002', name: 'Margherita Pizza', vendor: 'Pizza Palace', vendorId: 'VND-002', category: 'Italian', price: '$12.99', description: 'Classic tomato sauce, mozzarella, and fresh basil.', status: 'Available', createdAt: 'Feb 18, 2024' },
  { id: 'MEL-003', name: 'Double Smash Burger', vendor: 'Burger Barn', vendorId: 'VND-003', category: 'Burgers', price: '$11.99', description: 'Two smashed beef patties, cheddar, pickles, special sauce.', status: 'Available', createdAt: 'Mar 22, 2024' },
  { id: 'MEL-004', name: 'Salmon Sashimi Platter', vendor: 'Sushi Express', vendorId: 'VND-004', category: 'Japanese', price: '$18.99', description: 'Premium salmon sashimi with wasabi and pickled ginger.', status: 'Unavailable', createdAt: 'Apr 8, 2024' },
  { id: 'MEL-005', name: 'Butter Chicken', vendor: 'Spice Route', vendorId: 'VND-005', category: 'Indian', price: '$13.99', description: 'Creamy tomato curry with tender chicken pieces.', status: 'Available', createdAt: 'Jan 28, 2024' },
  { id: 'MEL-006', name: 'Caesar Salad', vendor: 'Fresh Salads Co', vendorId: 'VND-008', category: 'Salads', price: '$9.99', description: 'Romaine lettuce, croutons, parmesan, caesar dressing.', status: 'Archived', createdAt: 'Dec 5, 2023' },
  { id: 'MEL-007', name: 'Pad Thai', vendor: 'Noodle House', vendorId: 'VND-007', category: 'Asian', price: '$12.49', description: 'Stir-fried rice noodles with shrimp, peanuts, and lime.', status: 'Available', createdAt: 'Mar 2, 2024' },
  { id: 'MEL-008', name: 'Baja Fish Tacos', vendor: 'Taco Fiesta', vendorId: 'VND-006', category: 'Mexican', price: '$10.99', description: 'Crispy fish, cabbage slaw, chipotle mayo, corn tortillas.', status: 'Unavailable', createdAt: 'May 5, 2024' },
];
export const mockOrders: Order[] = [
  { id: 'ORD-001', customer: 'Alice Johnson', vendor: 'Green Bowl Kitchen', items: 2, amount: '$29.98', paymentMethod: 'Credit Card', date: ' May 10, 2026', status: 'Completed' },
  { id: 'ORD-002', customer: 'Bob Smith', vendor: 'Pizza Palace', items: 1, amount: '$12.99', paymentMethod: 'PayPal', date: 'May 10, 2026', status: 'Completed' },
  { id: 'ORD-003', customer: 'Eva Martinez', vendor: 'Burger Barn', items: 3, amount: '$35.97', paymentMethod: 'Credit Card', date: 'May11, 2026', status: 'Pending' },
  { id: 'ORD-004', customer: 'Grace Kim', vendor: 'Spice Route', items: 2, amount: '$27.98', paymentMethod: 'M-Pesa', date: 'May 11, 2026', status: 'Processing' },
  { id: 'ORD-005', customer: 'Henry Davis', vendor: 'Noodle House', items: 1, amount: '$12.49', paymentMethod: 'Credit Card', date: 'Mayy 11, 2026', status: 'Cancelled' },
  { id: 'ORD-006', customer: 'Alice Johnson', vendor: 'Pizza Palace', items: 4, amount: '$51.96', paymentMethod: 'PayPal', date: 'May 12, 2026', status: 'Completed' },
  { id: 'ORD-007', customer: 'Bob Smith', vendor: 'Green Bowl Kitchen', items: 2, amount: '$24.98', paymentMethod: 'Credit Card', date: 'May 12, 2026', status: 'Pending' },
  { id: 'ORD-008', customer: 'Eva Martinez', vendor: 'Taco Fiesta', items: 3, amount: '$32.97', paymentMethod: 'M-Pesa', date: 'May 12, 2026', status: 'Completed' },
];
export const mockTransactions: Transaction[] = [
  { id: 'TXN-001', orderId: 'ORD-001', customer: 'Alice Johnson', vendor: 'Green Bowl Kitchen', amount: '$29.98', method: 'Credit Card', date: 'May 10, 2026', status: 'Successful' },
  { id: 'TXN-002', orderId: 'ORD-002', customer: 'Bob Smith', vendor: 'Pizza Palace', amount: '$12.99', method: 'PayPal', date: 'May 11, 2026', status: 'Successful' },
  { id: 'TXN-003', orderId: 'ORD-003', customer: 'Eva Martinez', vendor: 'Burger Barn', amount: '$35.97', method: 'Credit Card', date: 'May 11, 2026', status: 'Pending' },
  { id: 'TXN-004', orderId: 'ORD-004', customer: 'Grace Kim', vendor: 'Spice Route', amount: '$27.98', method: 'M-Pesa', date: 'May 11, 2026', status: 'Successful' },
  { id: 'TXN-005', orderId: 'ORD-005', customer: 'Henry Davis', vendor: 'Noodle House', amount: '$12.49', method: 'Credit Card', date: 'May 11, 2026', status: 'Failed' },
  { id: 'TXN-006', orderId: 'ORD-006', customer: 'Alice Johnson', vendor: 'Pizza Palace', amount: '$51.96', method: 'PayPal', date: 'May 12, 2026', status: 'Successful' },
  { id: 'TXN-007', orderId: 'ORD-007', customer: 'Bob Smith', vendor: 'Green Bowl Kitchen', amount: '$24.98', method: 'Credit Card', date: 'May 12, 2026', status: 'Refunded' },
  { id: 'TXN-008', orderId: 'ORD-008', customer: 'Eva Martinez', vendor: 'Taco Fiesta', amount: '$32.97', method: 'M-Pesa', date: 'May 12, 2026', status: 'Successful' },
];
export const mockNotifications: Notification[] = [
  { id: 'NOT-001', title: 'New Vendor Application', message: 'Sushi Express has applied to become a vendor. Review their application.', type: 'info', read: false, createdAt: 'Jun 8, 2024, 10:30 AM' },
  { id: 'NOT-002', title: 'Payment Failed', message: 'Transaction TXN-005 for order ORD-005 has failed. Customer has been notified.', type: 'error', read: false, createdAt: 'Jun 7, 2024, 3:15 PM' },
  { id: 'NOT-003', title: 'New User Registration', message: '15 new users registered today. Total users now at 12,450.', type: 'success', read: true, createdAt: 'Jun 6, 2024, 9:00 AM' },
  { id: 'NOT-004', title: 'Vendor Suspended', message: 'Taco Fiesta has been suspended due to policy violations.', type: 'warning', read: true, createdAt: 'Jun 5, 2024, 2:45 PM' },
  { id: 'NOT-005', title: 'System Maintenance', message: 'Scheduled maintenance on June 10 from 2:00 AM to 4:00 AM UTC.', type: 'warning', read: false, createdAt: 'Jun 4, 2024, 11:00 AM' },
  { id: 'NOT-006', title: 'Revenue Milestone', message: 'Monthly revenue has exceeded $40,000 for the first time!', type: 'success', read: true, createdAt: 'Jun 3, 2024, 5:30 PM' },
];