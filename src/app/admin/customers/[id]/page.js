'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Shield, ArrowLeft, User, Phone, Mail, MapPin, 
  Package, DollarSign, Ruler, Calendar, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from '@/lib/axios';

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showAllOrders, setShowAllOrders] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const isAdmin = localStorage.getItem('isAdmin');
      if (!isAdmin) {
        router.push('/admin/login');
        return;
      }
      await fetchCustomerDetails();
      setLoading(false);
    };

    checkAuth();
  }, [router, customerId]);

  const fetchCustomerDetails = async () => {
    try {
      // Fetch customer details
      const customerResponse = await axios.get(`/customers/${customerId}`);
      setCustomer(customerResponse.data.customer || customerResponse.data);

      // Fetch customer orders
      const ordersResponse = await axios.get(`/orders?limit=1000`);
      const allOrders = ordersResponse.data.orders || [];
      
      // Filter orders for this customer
      const customerOrders = allOrders.filter(
        order => order.customer?._id === customerId || order.customer === customerId
      );
      setOrders(customerOrders);
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
      alert('Failed to load customer details');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      received: { text: 'Order Received', className: 'bg-blue-100 text-blue-700' },
      measuring: { text: 'Taking Measurements', className: 'bg-yellow-100 text-yellow-700' },
      stitching: { text: 'Stitching', className: 'bg-orange-100 text-orange-700' },
      qc: { text: 'Quality Check', className: 'bg-purple-100 text-purple-700' },
      ready: { text: 'Ready', className: 'bg-green-100 text-green-700' },
      delivered: { text: 'Delivered', className: 'bg-gray-100 text-gray-700' },
    };
    return badges[status] || badges.received;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-8 bg-gray-800 border-gray-700 text-center">
          <p className="text-white text-xl mb-4">Customer not found</p>
          <Link href="/admin/customers">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Back to Customers
            </Button>
          </Link>
        </Card>
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
              <h1 className="text-2xl font-bold text-white">Customer Details</h1>
            </div>
            <Link href="/admin/customers">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info Card */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-blue-900/50 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{customer.name}</h2>
                  <p className="text-gray-400 text-sm">Customer ID: {customer._id?.slice(-8)}</p>
                </div>
              </div>

              <div className="space-y-4">
                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-white">{customer.email}</p>
                    </div>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-white">{customer.phone}</p>
                    </div>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-white text-sm">
                        {customer.address.street && `${customer.address.street}, `}
                        {customer.address.city && `${customer.address.city}, `}
                        {customer.address.state && `${customer.address.state} `}
                        {customer.address.zipCode && customer.address.zipCode}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Customer Since</p>
                    <p className="text-white">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Card */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-400">Total Orders</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {customer.totalOrders || orders.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-gray-400">Total Spent</span>
                  </div>
                  <span className="text-2xl font-bold text-green-400">
                    ₹{customer.totalSpent || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Measurements Card */}
            {customer.measurements && Object.keys(customer.measurements).length > 0 && (
              <Card className="p-6 bg-gray-800 border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Ruler className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Measurements</h3>
                </div>
                <div className="space-y-3">
                  {/* Shirt Measurements */}
                  {(customer.measurements.shirtLength || customer.measurements.chest || 
                    customer.measurements.shoulder || customer.measurements.sleeveLength || 
                    customer.measurements.neck) && (
                    <div>
                      <p className="text-sm font-semibold text-blue-400 mb-2">Shirt</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {customer.measurements.shirtLength && (
                          <div>
                            <span className="text-gray-500">Length:</span>
                            <span className="text-white ml-2">{customer.measurements.shirtLength}"</span>
                          </div>
                        )}
                        {customer.measurements.chest && (
                          <div>
                            <span className="text-gray-500">Chest:</span>
                            <span className="text-white ml-2">{customer.measurements.chest}"</span>
                          </div>
                        )}
                        {customer.measurements.shoulder && (
                          <div>
                            <span className="text-gray-500">Shoulder:</span>
                            <span className="text-white ml-2">{customer.measurements.shoulder}"</span>
                          </div>
                        )}
                        {customer.measurements.sleeveLength && (
                          <div>
                            <span className="text-gray-500">Sleeve:</span>
                            <span className="text-white ml-2">{customer.measurements.sleeveLength}"</span>
                          </div>
                        )}
                        {customer.measurements.neck && (
                          <div>
                            <span className="text-gray-500">Neck:</span>
                            <span className="text-white ml-2">{customer.measurements.neck}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pants Measurements */}
                  {(customer.measurements.waist || customer.measurements.hip || 
                    customer.measurements.inseam || customer.measurements.outseam || 
                    customer.measurements.thigh) && (
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-sm font-semibold text-purple-400 mb-2">Pants</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {customer.measurements.waist && (
                          <div>
                            <span className="text-gray-500">Waist:</span>
                            <span className="text-white ml-2">{customer.measurements.waist}"</span>
                          </div>
                        )}
                        {customer.measurements.hip && (
                          <div>
                            <span className="text-gray-500">Hip:</span>
                            <span className="text-white ml-2">{customer.measurements.hip}"</span>
                          </div>
                        )}
                        {customer.measurements.inseam && (
                          <div>
                            <span className="text-gray-500">Inseam:</span>
                            <span className="text-white ml-2">{customer.measurements.inseam}"</span>
                          </div>
                        )}
                        {customer.measurements.outseam && (
                          <div>
                            <span className="text-gray-500">Outseam:</span>
                            <span className="text-white ml-2">{customer.measurements.outseam}"</span>
                          </div>
                        )}
                        {customer.measurements.thigh && (
                          <div>
                            <span className="text-gray-500">Thigh:</span>
                            <span className="text-white ml-2">{customer.measurements.thigh}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Measurements */}
                  {customer.measurements.custom && (
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-sm font-semibold text-orange-400 mb-2">Custom</p>
                      <pre className="text-sm text-white bg-gray-900 p-2 rounded">
                        {JSON.stringify(customer.measurements.custom, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Notes Card */}
            {customer.notes && (
              <Card className="p-6 bg-gray-800 border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Notes</h3>
                </div>
                <p className="text-gray-300 text-sm">{customer.notes}</p>
              </Card>
            )}
          </div>

          {/* Orders List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Order History</h3>
                {orders.length > 3 && (
                  <Button
                    onClick={() => setShowAllOrders(!showAllOrders)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    {showAllOrders ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        View All ({orders.length} orders)
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(showAllOrders ? orders : orders.slice(0, 3)).map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    return (
                      <Card key={order._id} className="p-4 bg-gray-700/50 border-gray-600">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-white">
                                Order #{order.orderNumber}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                                {statusBadge.text}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-400">
                              ₹{order.totalAmount || 0}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.barcode}
                            </p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="border-t border-gray-600 pt-3 mt-3">
                          <p className="text-sm text-gray-400 mb-2">Items:</p>
                          <div className="space-y-1">
                            {order.items && order.items.map((item, idx) => (
                              <div key={idx} className="text-sm flex justify-between">
                                <span className="text-white capitalize">
                                  {item.itemType || item.type} (x{item.quantity || 1})
                                </span>
                                <span className="text-gray-400">₹{item.price || 0}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.notes && (
                          <div className="border-t border-gray-600 pt-3 mt-3">
                            <p className="text-xs text-gray-500">Notes:</p>
                            <p className="text-sm text-gray-300">{order.notes}</p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
