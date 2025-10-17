'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from '@/lib/axios';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp,
  Shirt,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    let mounted = true; // Prevent state updates if component unmounts
    
    // Check authentication with backend
    const checkAuth = async () => {
      try {
        // Check if user data is in URL (from Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const userParam = urlParams.get('user');
        
        if (userParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userParam));
            console.log('✅ User data received from OAuth redirect:', userData);
            if (mounted) {
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              setLoading(false);
            }
            // Clean up URL
            window.history.replaceState({}, document.title, '/dashboard');
            return; // Exit early - we have the user data
          } catch (e) {
            console.error('Failed to parse user data from URL:', e);
          }
        }

        // First check localStorage
        const localUser = localStorage.getItem('user');
        if (localUser) {
          try {
            const userData = JSON.parse(localUser);
            console.log('✅ User data loaded from localStorage:', userData);
            if (mounted) {
              setUser(userData);
              setLoading(false);
            }
            return; // Exit early - we have the user data
          } catch (e) {
            console.error('Failed to parse localStorage user:', e);
            localStorage.removeItem('user'); // Clear corrupted data
          }
        }

        // Then check session (for Google OAuth) - only if no localStorage data
        console.log('🔍 Checking backend session...');
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
        const response = await fetch(`${backendUrl}/api/auth/status`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Auth check failed');
        }
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          console.log('✅ User authenticated via backend session:', data.user);
          if (mounted) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            setLoading(false);
          }
        } else {
          console.log('❌ Not authenticated, redirecting to login');
          if (mounted) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Only redirect if we truly have no user data
        const localUser = localStorage.getItem('user');
        if (!localUser) {
          console.log('❌ No user data found, redirecting to login');
          if (mounted) {
            router.push('/login');
          }
        } else {
          // Try to use the localStorage data as fallback
          try {
            const userData = JSON.parse(localUser);
            console.log('⚠️ Using localStorage as fallback:', userData);
            if (mounted) {
              setUser(userData);
              setLoading(false);
            }
          } catch (e) {
            console.error('Failed to parse localStorage user:', e);
            if (mounted) {
              router.push('/login');
            }
          }
        }
      }
    };

    checkAuth();
    
    return () => {
      mounted = false; // Cleanup function
    };
  }, []); // Empty dependency array - only run once on mount

  // Fetch orders and calculate stats
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const response = await axios.get('/orders');
        
        if (response.data) {
          const orders = response.data.orders || [];
          
          // Calculate stats
          const total = orders.length;
          const inProgress = orders.filter(o => 
            ['received', 'measuring', 'stitching', 'qc'].includes(o.status)
          ).length;
          const readyToPickup = orders.filter(o => o.status === 'ready').length;
          
          setStats({
            totalOrders: total,
            pendingOrders: inProgress,
            completedOrders: readyToPickup,
          });

          // Set recent orders (last 3)
          setRecentOrders(orders.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };
    
    fetchOrders();
  }, [user]);

  const getStatusBadge = (status) => {
    const badges = {
      received: { text: 'Order Received', className: 'bg-blue-100 text-blue-700' },
      measuring: { text: 'Measuring', className: 'bg-yellow-100 text-yellow-700' },
      stitching: { text: 'Stitching', className: 'bg-orange-100 text-orange-700' },
      qc: { text: 'Quality Check', className: 'bg-purple-100 text-purple-700' },
      ready: { text: 'Ready', className: 'bg-green-100 text-green-700' },
      delivered: { text: 'Picked Up', className: 'bg-gray-100 text-gray-700' },
    };
    return badges[status] || badges.received;
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Clear localStorage and redirect
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <h1 className="text-2xl font-bold cursor-pointer">
                Tailor<span className="text-blue-600">Track</span>
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}!</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>

          {/* Stats Grid - Customer Focused */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ready to Pickup</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Action Buttons - Give & Take Clothes */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/give-clothes">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer h-64 flex flex-col items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="mb-6"
                  >
                    <Shirt className="w-20 h-20 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-3">Give Clothes</h2>
                  <p className="text-blue-100 text-center">
                    Drop off clothes for tailoring
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/take-clothes">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer h-64 flex flex-col items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="mb-6"
                  >
                    <Package className="w-20 h-20 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-3">Take Clothes</h2>
                  <p className="text-purple-100 text-center">
                    View and pickup your orders
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* My Recent Orders */}
          <h3 className="text-xl font-semibold text-gray-900 mb-4">My Recent Orders</h3>
          <Card className="p-6">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No orders yet. Drop off your first order to get started!</p>
                <Link href="/give-clothes">
                  <Button className="mt-4">Give Clothes</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  return (
                    <div key={order._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-gray-900">Order #{order.orderNumber}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{order.totalAmount || 0}</p>
                        <Link href="/take-clothes">
                          <Button variant="outline" size="sm" className="mt-2">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
                <Link href="/take-clothes">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
