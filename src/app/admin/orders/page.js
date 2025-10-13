'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, Package, Search, Clock, CheckCircle, 
  Edit, Save, X, DollarSign 
} from 'lucide-react';
import axios from '@/lib/axios';

const STATUS_OPTIONS = [
  { value: 'received', label: 'Order Received', color: 'bg-blue-100 text-blue-700' },
  { value: 'measuring', label: 'Taking Measurements', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'stitching', label: 'Stitching In Progress', color: 'bg-orange-100 text-orange-700' },
  { value: 'qc', label: 'Quality Check', color: 'bg-purple-100 text-purple-700' },
  { value: 'ready', label: 'Ready to Pickup', color: 'bg-green-100 text-green-700' },
  { value: 'delivered', label: 'Picked Up', color: 'bg-gray-100 text-gray-700' },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isAdmin = localStorage.getItem('isAdmin');
      if (!isAdmin) {
        router.push('/admin/login');
        return;
      }
      await fetchOrders();
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders?limit=1000');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, notes = '') => {
    setUpdatingStatus(true);
    try {
      await axios.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        notes: notes || `Status updated to ${newStatus} by admin`,
      });
      
      alert('Order status updated successfully!');
      setEditingOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriceUpdate = async (orderId, itemIndex, newPrice) => {
    try {
      const order = orders.find(o => o._id === orderId);
      const updatedItems = [...order.items];
      updatedItems[itemIndex].price = parseFloat(newPrice) || 0;

      await axios.put(`/orders/${orderId}`, {
        items: updatedItems,
      });

      alert('Price updated successfully!');
      await fetchOrders();
    } catch (error) {
      console.error('Failed to update price:', error);
      alert('Failed to update price');
    }
  };

  const getStatusBadge = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption || STATUS_OPTIONS[0];
  };

  const filteredOrders = orders.filter(order =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.barcode?.includes(searchTerm) ||
    order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-white">Order Management</h1>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by order number, barcode, or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="p-12 bg-gray-800 border-gray-700">
              <div className="text-center text-gray-400">
                <Package className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl">No orders found</p>
              </div>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const isEditing = editingOrder === order._id;

              return (
                <Card key={order._id} className="p-6 bg-gray-800 border-gray-700">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Order #{order.orderNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Customer: {order.customer?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-400">
                        Phone: {order.customer?.phone || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-400">
                        Created: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Barcode</p>
                      <p className="font-mono text-sm font-semibold text-white">{order.barcode}</p>
                      <p className="text-xl font-bold text-green-400 mt-2">₹{order.totalAmount || 0}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-gray-700 pt-4 mb-4">
                    <h4 className="font-semibold text-gray-300 mb-3">Items:</h4>
                    <div className="space-y-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => {
                          const measurementText = typeof item.measurements === 'object' 
                            ? (item.measurements?.notes || item.description) 
                            : item.measurements;

                          return (
                            <div key={index} className="bg-gray-700/50 p-3 rounded flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-white capitalize">
                                  {item.itemType || item.type} (Qty: {item.quantity || 1})
                                </p>
                                {measurementText && (
                                  <p className="text-sm text-gray-400 mt-1">{measurementText}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  defaultValue={item.price || 0}
                                  onBlur={(e) => {
                                    if (e.target.value !== String(item.price)) {
                                      handlePriceUpdate(order._id, index, e.target.value);
                                    }
                                  }}
                                  className="w-24 bg-gray-700 border-gray-600 text-white"
                                  placeholder="Price"
                                />
                                <span className="text-gray-400">₹</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 text-sm">No items</p>
                      )}
                    </div>
                  </div>

                  {/* Status Update Section */}
                  <div className="border-t border-gray-700 pt-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Label className="text-gray-300">Update Status:</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {STATUS_OPTIONS.map((statusOption) => (
                            <Button
                              key={statusOption.value}
                              onClick={() => handleStatusUpdate(order._id, statusOption.value)}
                              disabled={updatingStatus}
                              className={`${
                                order.status === statusOption.value
                                  ? 'bg-blue-600 hover:bg-blue-700'
                                  : 'bg-gray-700 hover:bg-gray-600'
                              } text-white`}
                            >
                              {statusOption.label}
                            </Button>
                          ))}
                        </div>
                        <Button
                          onClick={() => setEditingOrder(null)}
                          variant="outline"
                          className="w-full border-gray-600 text-gray-300"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setEditingOrder(order._id)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Order Status
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
