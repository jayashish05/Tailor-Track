'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Send, Users, ArrowLeft } from 'lucide-react';
import axios from '@/lib/axios';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerCount, setCustomerCount] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          if (userData.role !== 'admin' && userData.role !== 'staff') {
            router.push('/dashboard');
            return;
          }
          setUser(userData);
          await fetchCustomerCount();
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchCustomerCount = async () => {
    try {
      const response = await axios.get('/customers');
      const customers = response.data.customers || [];
      setCustomerCount(customers.length);
    } catch (error) {
      console.error('Fetch customer count error:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSending(true);

    try {
      const response = await axios.post('/notifications/broadcast', {
        title: formData.title,
        message: formData.message,
      });

      setSuccess(`Notification sent successfully to ${response.data.count} customers!`);
      setFormData({ title: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Send Notification to Customers
          </h1>
          <p className="text-gray-600 mt-1">
            Broadcast a notification to all registered customers
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <Send className="h-5 w-5" />
            {success}
          </div>
        )}

        <Card className="p-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Total Recipients</p>
              <p className="text-2xl font-bold text-blue-600">{customerCount} customers</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-base font-semibold mb-2 block">
                Notification Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., New Collection Available!"
                required
                className="text-lg"
              />
              <p className="text-sm text-gray-600 mt-1">
                This will be the headline of your notification
              </p>
            </div>

            <div>
              <Label htmlFor="message" className="text-base font-semibold mb-2 block">
                Message *
              </Label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="e.g., Check out our latest collection of wedding dresses. Special discount of 20% this week only!"
                required
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-sm text-gray-600 mt-1">
                {formData.message.length}/500 characters
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This notification will be sent to all {customerCount} registered customers and will appear in their notifications page.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 py-6 text-lg"
              >
                <Send className="h-5 w-5" />
                {sending ? 'Sending...' : `Send to ${customerCount} Customers`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ title: '', message: '' })}
                className="py-6"
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>

        {/* Examples */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Example Notifications</h3>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
              <p className="font-semibold text-blue-900">New Collection Alert 🎉</p>
              <p className="text-sm text-blue-800 mt-1">
                Our latest summer collection is now available! Visit us to explore premium fabrics and exclusive designs.
              </p>
            </div>
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
              <p className="font-semibold text-green-900">Special Offer - 25% OFF ✨</p>
              <p className="text-sm text-green-800 mt-1">
                Get 25% off on all tailoring services this weekend. Book your appointment now!
              </p>
            </div>
            <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded">
              <p className="font-semibold text-purple-900">Holiday Hours Update 📅</p>
              <p className="text-sm text-purple-800 mt-1">
                We'll be closed on Dec 25-26 for the holidays. Please plan your orders accordingly. Happy holidays!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
