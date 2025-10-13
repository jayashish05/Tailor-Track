'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Package, Plus } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          setUser(JSON.parse(localUser));
          setLoading(false);
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
        const response = await fetch(`${backendUrl}/api/auth/status`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Auth check failed');
        }
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading || !user) {
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
          <Link href="/orders/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>

        <Card className="p-6">
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
            <p className="mb-6">Start by creating your first order</p>
            <Link href="/orders/new">
              <Button>Create New Order</Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
