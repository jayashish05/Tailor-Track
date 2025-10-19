'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Shield, Users, Package, DollarSign, 
  LogOut, ChevronRight, Search, Filter
} from 'lucide-react';
import axios from '@/lib/axios';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const localUser = localStorage.getItem('user');
        const isAdmin = localStorage.getItem('isAdmin');

        if (!localUser || !isAdmin) {
          router.push('/admin/login');
          return;
        }

        const userData = JSON.parse(localUser);

        // Verify with backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
        const response = await fetch(`${backendUrl}/api/auth/status`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Auth failed');

        const data = await response.json();

        if (data.authenticated && data.user && data.user.role === 'admin') {
          setUser(data.user);
          fetchStats();
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('isAdmin');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, [router]);

  const fetchStats = async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        axios.get('/orders?limit=1000'),
        axios.get('/customers?limit=1000')
      ]);

      const orders = ordersRes.data.orders || [];
      const customers = customersRes.data.customers || [];

      const pending = orders.filter(o => 
        ['received', 'measuring', 'stitching', 'qc'].includes(o.status)
      ).length;

      const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setStats({
        totalCustomers: customers.length,
        totalOrders: orders.length,
        pendingOrders: pending,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Verifying admin access...</p>
        </div>
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
              <h1 className="text-2xl font-bold text-white">
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Admin: {user?.name}</span>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-white">{stats.totalCustomers}</p>
              </div>
              <div className="bg-blue-900/50 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
              </div>
              <div className="bg-purple-900/50 p-3 rounded-full">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-orange-400">{stats.pendingOrders}</p>
              </div>
              <div className="bg-orange-900/50 p-3 rounded-full">
                <Package className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-400">₹{stats.totalRevenue}</p>
              </div>
              <div className="bg-green-900/50 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/admin/customers">
            <Card className="p-6 bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 hover:shadow-xl transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Manage Customers</h3>
                  <p className="text-blue-200">View and manage all customers</p>
                </div>
                <ChevronRight className="w-8 h-8 text-blue-300 group-hover:translate-x-2 transition" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/orders">
            <Card className="p-6 bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700 hover:shadow-xl transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Manage Orders</h3>
                  <p className="text-purple-200">Update order status and details</p>
                </div>
                <ChevronRight className="w-8 h-8 text-purple-300 group-hover:translate-x-2 transition" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/notifications">
            <Card className="p-6 bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700 hover:shadow-xl transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Send Notifications</h3>
                  <p className="text-orange-200">Broadcast messages to all customers</p>
                </div>
                <ChevronRight className="w-8 h-8 text-orange-300 group-hover:translate-x-2 transition" />
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
