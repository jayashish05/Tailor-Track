'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Shirt, Plus, Minus } from 'lucide-react';
import axios from '@/lib/axios';

export default function GiveClothesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    items: [
      { type: '', quantity: 1, measurements: '', instructions: '' }
    ],
    deliveryDate: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          setUser(userData);
          setFormData(prev => ({
            ...prev,
            customerName: userData.name || '',
            customerEmail: userData.email || '',
          }));
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
          setFormData(prev => ({
            ...prev,
            customerName: data.user.name || '',
            customerEmail: data.user.email || '',
          }));
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { type: '', quantity: 1, measurements: '', instructions: '' }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!formData.customerPhone || formData.customerPhone.trim() === '') {
      setError('Phone number is required');
      return;
    }

    if (formData.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    // Validate all items have type and quantity
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.type || item.type === '') {
        setError(`Please select type for item ${i + 1}`);
        return;
      }
      if (!item.quantity || item.quantity < 1) {
        setError(`Please enter valid quantity for item ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      // Format data according to backend expectations
      const orderData = {
        customerName: formData.customerName || user.name,
        customerPhone: formData.customerPhone,
        items: formData.items.map(item => ({
          type: item.type,
          quantity: parseInt(item.quantity) || 1,
          measurements: item.measurements || '',
          instructions: item.instructions || ''
        })),
        deliveryDate: formData.deliveryDate,
        instructions: formData.items.map(item => item.instructions).filter(Boolean).join('; ')
      };

      console.log('Submitting order:', orderData);
      
      const response = await axios.post('/orders', orderData);

      if (response.data) {
        setSuccess('Order created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create order. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shirt className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Give Clothes</h2>
          </div>
          <p className="text-gray-600">Drop off your clothes for tailoring</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Your Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    placeholder="+91 1234567890"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Clothing Items</h3>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {formData.items.map((item, index) => (
                <Card key={index} className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-700">Item {index + 1}</h4>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeItem(index)}
                          variant="ghost"
                          size="sm"
                        >
                          <Minus className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Item Type *</Label>
                        <select
                          className="w-full px-3 py-2 border rounded-md"
                          value={item.type}
                          onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                          required
                        >
                          <option value="">Select type</option>
                          <option value="shirt">Shirt</option>
                          <option value="pants">Pants</option>
                          <option value="suit">Suit</option>
                          <option value="dress">Dress</option>
                          <option value="kurta">Kurta</option>
                          <option value="blouse">Blouse</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Measurements</Label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md"
                        rows="2"
                        placeholder="e.g., Chest: 40in, Length: 28in"
                        value={item.measurements}
                        onChange={(e) => handleItemChange(index, 'measurements', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Special Instructions</Label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md"
                        rows="2"
                        placeholder="Any special requirements or modifications"
                        value={item.instructions}
                        onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Delivery Date */}
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Expected Delivery Date *</Label>
              <Input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.deliveryDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Submitting...' : 'Submit Order'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
