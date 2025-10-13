'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Shield, Users, Search, Phone, Mail, Package, DollarSign } from 'lucide-react';
import axios from '@/lib/axios';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const isAdmin = localStorage.getItem('isAdmin');
      if (!isAdmin) {
        router.push('/admin/login');
        return;
      }
      await fetchCustomers();
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers?limit=1000');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
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
              <h1 className="text-2xl font-bold text-white">Customer Management</h1>
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
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Customers List */}
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <Card className="p-12 bg-gray-800 border-gray-700">
              <div className="text-center text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl">No customers found</p>
              </div>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer._id} className="p-6 bg-gray-800 border-gray-700 hover:border-gray-600 transition">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{customer.name}</h3>
                    <div className="space-y-1 text-sm text-gray-400">
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-blue-400 mb-1">
                        <Package className="w-4 h-4" />
                        <span className="text-xl font-bold">{customer.totalOrders || 0}</span>
                      </div>
                      <p className="text-xs text-gray-500">Orders</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center gap-1 text-green-400 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xl font-bold">₹{customer.totalSpent || 0}</span>
                      </div>
                      <p className="text-xs text-gray-500">Spent</p>
                    </div>
                  </div>

                  <Link href={`/admin/customers/${customer._id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
