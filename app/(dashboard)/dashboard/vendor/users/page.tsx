'use client'

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Download, Users, ShoppingBag, Star, UserCheck, MapPin, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
interface VendorCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: string;
  lastOrder: string;
  rating: number;
  status: 'Active' | 'Returning' | 'New' | 'Inactive';
}
const mockCustomers: VendorCustomer[] = [
  { id: 'CUS-001', name: 'Alice Johnson', email: 'alice@example.com', phone: '+254-76890-3245', location: 'Dagoretti', totalOrders: 12, totalSpent: '$179.88', lastOrder: 'Jun 8, 2024', rating: 5, status: 'Active' },
  { id: 'CUS-002', name: 'Bob Smith', email: 'bob@example.com', phone: '+254-79084-5654', location: 'Umoja', totalOrders: 8, totalSpent: '$103.92', lastOrder: 'Jun 7, 2024', rating: 4, status: 'Returning' },
  { id: 'CUS-003', name: 'Eva Martinez', email: 'eva@example.com', phone: '+254-76573-8907', location: 'Kilimani', totalOrders: 15, totalSpent: '$224.85', lastOrder: 'Jun 6, 2024', rating: 5, status: 'Active' },
  { id: 'CUS-004', name: 'Grace Kim', email: 'grace@example.com', phone: '+254-76895-6980', location: 'Imbo', totalOrders: 3, totalSpent: '$44.97', lastOrder: 'Jun 5, 2024', rating: 5, status: 'New' },
  { id: 'CUS-005', name: 'Henry Davis', email: 'henry@example.com', phone: '+254-74578-8903', location: 'Roysambu', totalOrders: 1, totalSpent: '$14.99', lastOrder: 'May 20, 2024', rating: 4, status: 'New' },
  { id: 'CUS-006', name: 'Frank Lee', email: 'frank@example.com', phone: '+254-76784-9870', location: 'Kiambu', totalOrders: 6, totalSpent: '$89.94', lastOrder: 'Apr 15, 2024', rating: 3, status: 'Inactive' },
  { id: 'CUS-007', name: 'Carol White', email: 'carol@example.com', phone: '+254-09872-2341', location: 'Githurai', totalOrders: 9, totalSpent: '$134.91', lastOrder: 'Jun 4, 2024', rating: 5, status: 'Returning' },
  { id: 'CUS-008', name: 'David Brown', email: 'david@example.com', phone: '+254-78651-4358', location: 'Imara Daima', totalOrders: 4, totalSpent: '$59.96', lastOrder: 'May 30, 2024', rating: 4, status: 'Returning' },
];
const customerStatusStyles: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Returning: 'bg-blue-50 text-blue-700',
  New: 'bg-purple-50 text-purple-700',
  Inactive: 'bg-gray-100 text-gray-500',
};
export default function VendorUsersPage () {
  const [customers] = useState<VendorCustomer[]>(mockCustomers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState<VendorCustomer | null>(null);
  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const activeCount = customers.filter((c) => c.status === 'Active').length;
  const returningCount = customers.filter((c) => c.status === 'Returning').length;
  const newCount = customers.filter((c) => c.status === 'New').length;
  const avgRating = customers.length > 0
    ? (customers.reduce((acc, c) => acc + c.rating, 0) / customers.length).toFixed(1)
    : '0';
  const stats = [
    { label: 'Total Customers', value: customers.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active', value: activeCount, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'New This Month', value: newCount, icon: ShoppingBag, color: 'bg-purple-50 text-purple-600' },
    { label: 'Avg Rating', value: avgRating, icon: Star, color: 'bg-amber-50 text-amber-600' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Customers"
        subtitle="View customers who have ordered from your store."
        action={
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <Download size={15} /> Export
          </button>
        }
      />
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{s.label}</p>
              <div className={`p-1.5 rounded-lg ${s.color}`}>
                <s.icon size={15} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>
      {/* Customer Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active', count: activeCount, color: 'emerald' },
          { label: 'Returning', count: returningCount, color: 'blue' },
          { label: 'New', count: newCount, color: 'purple' },
          { label: 'Inactive', count: customers.filter((c) => c.status === 'Inactive').length, color: 'gray' },
        ].map((seg) => {
          const pct = customers.length > 0 ? (seg.count / customers.length) * 100 : 0;
          const barColorMap: Record<string, string> = {
            emerald: 'bg-emerald-500',
            blue: 'bg-blue-500',
            purple: 'bg-purple-500',
            gray: 'bg-gray-300',
          };
          return (
            <div key={seg.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{seg.label}</span>
                <span className="text-xs text-gray-500">{seg.count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${barColorMap[seg.color]}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Active', 'Returning', 'New', 'Inactive'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Total Spent</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Last Order</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer, i) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{customer.location}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{customer.totalOrders}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{customer.totalSpent}</td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                      <Star size={13} fill="currentColor" /> {customer.rating}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{customer.lastOrder}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${customerStatusStyles[customer.status]}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setSelected(customer)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No customers found.</div>
        )}
      </div>
      {/* View Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Customer Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                {selected.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.email}</p>
                <span className={`mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${customerStatusStyles[selected.status]}`}>
                  {selected.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
              {([
                ['Customer ID', selected.id],
                ['Phone', selected.phone],
                ['Location', selected.location],
                ['Total Orders', String(selected.totalOrders)],
                ['Total Spent', selected.totalSpent],
                ['Last Order', selected.lastOrder],
                ['Rating', `${selected.rating} / 5`],
                ['Status', selected.status],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="text-sm font-medium text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition">
                <ShoppingBag size={15} /> View Orders
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                <Star size={15} /> View Reviews
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}