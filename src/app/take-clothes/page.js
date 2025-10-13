'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import axios from '@/lib/axios';

export default function TakeClothesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          setUser(JSON.parse(localUser));
          fetchOrders();
          setLoading(false);
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
        const response = await fetch(`${backendUrl}/api/auth/status`, {
          credentials: 'include',
        });
        
        if (!response.ok) throw new Error('Auth check failed');
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          fetchOrders();
        } else {
          router.push('/login');
        }
      } catch (error) {
        if (!localStorage.getItem('user')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      received: {
        icon: Clock,
        text: 'Order Received',
        className: 'bg-blue-100 text-blue-700',
      },
      measuring: {
        icon: Clock,
        text: 'Taking Measurements',
        className: 'bg-yellow-100 text-yellow-700',
      },
      stitching: {
        icon: Clock,
        text: 'Stitching In Progress',
        className: 'bg-orange-100 text-orange-700',
      },
      qc: {
        icon: Clock,
        text: 'Quality Check',
        className: 'bg-purple-100 text-purple-700',
      },
      ready: {
        icon: CheckCircle,
        text: 'Ready to Pickup',
        className: 'bg-green-100 text-green-700',
      },
      delivered: {
        icon: CheckCircle,
        text: 'Picked Up',
        className: 'bg-gray-100 text-gray-700',
      },
    };

    const badge = badges[status] || badges.received;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (order) => {
    if (!order.totalAmount || order.totalAmount === 0) {
      alert('Order amount not set yet. Please contact admin.');
      return;
    }

    if (order.paymentStatus === 'paid') {
      // Already paid, just pickup
      handlePickup(order._id);
      return;
    }

    // Load Razorpay script
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Please check your connection.');
      return;
    }

    try {
      // Create Razorpay order on backend
      const orderResponse = await axios.post('/payments/create-order', {
        orderId: order._id,
        amount: order.totalAmount,
      });

      const { razorpayOrderId, amount, currency } = orderResponse.data;

      // Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID', // Replace with your key
        amount: amount,
        currency: currency,
        name: 'TailorTrack',
        description: `Payment for Order #${order.orderNumber}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await axios.post('/payments/verify', {
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              alert('Payment successful! You can now pickup your order.');
              await handlePickup(order._id);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: order.customer?.phone || '',
        },
        theme: {
          color: '#8B5CF6',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.error || 'Payment failed. Please try again.');
    }
  };

  const handlePickup = async (orderId) => {
    try {
      const response = await axios.patch(`/orders/${orderId}/pickup`);
      alert(response.data.message || 'Order marked as picked up!');
      fetchOrders(); // Refresh orders
      return true;
    } catch (error) {
      console.error('Pickup error:', error);
      alert(error.response?.data?.error || 'Failed to mark order as picked up');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold cursor-pointer">
                Tailor<span className="text-blue-600">Track</span>
              </h1>
            </Link>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">Take Clothes</h2>
          </div>
          <p className="text-gray-600">View and pickup your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
              <p className="mb-6">You don't have any orders yet.</p>
              <Link href="/give-clothes">
                <Button>Drop Off Clothes</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id || order.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber || order._id?.slice(-6)}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                    {order.deliveryDate && (
                      <p className="text-sm text-gray-600">
                        Expected Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  {order.barcode && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Barcode</p>
                      <p className="font-mono text-sm font-semibold">{order.barcode}</p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Items:</h4>
                  <div className="space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => {
                        // Handle measurements - could be string or object
                        let measurementText = '';
                        if (item.measurements) {
                          if (typeof item.measurements === 'string') {
                            measurementText = item.measurements;
                          } else if (typeof item.measurements === 'object') {
                            measurementText = item.measurements.notes || item.description || '';
                          }
                        }
                        
                        return (
                          <div key={index} className="flex justify-between items-start bg-gray-50 p-3 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 capitalize">
                                {item.itemType || item.type || 'Item'}
                              </p>
                              {measurementText && (
                                <p className="text-sm text-gray-600 mt-1">{measurementText}</p>
                              )}
                              {item.description && item.description !== measurementText && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-700 ml-4">Qty: {item.quantity || 1}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">No items listed</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-4 mt-4 flex flex-col gap-3">
                  {order.status === 'ready' && (
                    <>
                      {order.totalAmount > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Amount:</p>
                          <p className="text-2xl font-bold text-blue-600">₹{order.totalAmount}</p>
                          {order.paymentStatus === 'paid' && (
                            <span className="text-xs text-green-600 font-semibold">✓ Paid</span>
                          )}
                        </div>
                      )}
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handlePayment(order)}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {order.totalAmount > 0 && order.paymentStatus !== 'paid' 
                          ? `Pay ₹${order.totalAmount} & Pickup` 
                          : 'Confirm Pickup'}
                      </Button>
                    </>
                  )}
                  {order.status === 'delivered' && (
                    <span className="text-green-600 font-semibold flex items-center gap-2 justify-center">
                      <CheckCircle className="w-5 h-5" />
                      Order Picked Up
                    </span>
                  )}
                  {['received', 'measuring', 'stitching', 'qc'].includes(order.status) && (
                    <span className="text-orange-600 font-semibold flex items-center gap-2 justify-center">
                      <Clock className="w-5 h-5" />
                      Stitching In Progress
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
