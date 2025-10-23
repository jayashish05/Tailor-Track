'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Measurement fields for different cloth types
const MEASUREMENT_FIELDS = {
  shirt: ['length', 'chest', 'shoulder', 'sleeve', 'neck', 'waist'],
  pants: ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom'],
  kurta: ['length', 'chest', 'shoulder', 'sleeve', 'neck'],
  suit: ['jacket_length', 'chest', 'shoulder', 'sleeve', 'pants_length', 'waist'],
  dress: ['length', 'chest', 'waist', 'hip', 'shoulder', 'sleeve'],
  blouse: ['length', 'chest', 'shoulder', 'sleeve', 'neck', 'waist'],
  other: ['length', 'chest', 'waist', 'shoulder']
};

const CLOTH_TYPES = [
  { value: 'shirt', label: 'Shirt' },
  { value: 'pants', label: 'Pants' },
  { value: 'kurta', label: 'Kurta' },
  { value: 'suit', label: 'Suit' },
  { value: 'dress', label: 'Dress' },
  { value: 'blouse', label: 'Blouse' },
  { value: 'other', label: 'Other' }
];

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  
  // Order items
  const [items, setItems] = useState([{
    id: 1,
    clothType: 'shirt',
    measurements: {},
    price: '',
    notes: ''
  }]);

  // Pricing
  const [discount, setDiscount] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/status`,
        { withCredentials: true }
      );
      if (!response.data.authenticated) {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  // Add new item
  const handleAddItem = () => {
    setItems([...items, {
      id: Date.now(),
      clothType: 'shirt',
      measurements: {},
      price: '',
      notes: ''
    }]);
  };

  // Remove item
  const handleRemoveItem = (itemId) => {
    if (items.length === 1) {
      alert('At least one item is required');
      return;
    }
    setItems(items.filter(item => item.id !== itemId));
  };

  // Update item field
  const updateItem = (itemId, field, value) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Update item measurement
  const updateItemMeasurement = (itemId, key, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          measurements: { ...item.measurements, [key]: value }
        };
      }
      return item;
    }));
  };

  // Copy measurements from another item
  const handleCopyMeasurements = (targetItemId, sourceItemId) => {
    const sourceItem = items.find(item => item.id === parseInt(sourceItemId));
    if (sourceItem) {
      setItems(items.map(item => 
        item.id === targetItemId 
          ? { ...item, measurements: { ...sourceItem.measurements } }
          : item
      ));
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - (parseFloat(discount) || 0));
  };

  const calculateBalance = () => {
    return Math.max(0, calculateTotal() - (parseFloat(advancePayment) || 0));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    // Validate items
    for (let item of items) {
      if (!item.price || parseFloat(item.price) < 0) {
        setError(`Please enter a valid price for ${item.clothType}`);
        return;
      }
    }

    try {
      setLoading(true);

      const orderData = {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        items: items.map(item => ({
          clothType: item.clothType,
          measurements: item.measurements,
          price: parseFloat(item.price) || 0,
          notes: item.notes.trim()
        })),
        specialInstructions: specialInstructions.trim(),
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        discount: parseFloat(discount) || 0,
        advancePayment: parseFloat(advancePayment) || 0
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders`,
        orderData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(`Order created successfully! Barcode: ${response.data.order.barcode}`);
        setTimeout(() => {
          router.push('/admin/orders');
        }, 2000);
      }
    } catch (error) {
      console.error('Order creation error:', error);
      setError(error.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/admin/orders')} variant="outline">
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Enter customer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91" required />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>Add clothes and measurements</CardDescription>
                </div>
                <Button type="button" onClick={handleAddItem} className="bg-indigo-600 hover:bg-indigo-700">
                  + Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Item #{index + 1}</h3>
                    {items.length > 1 && (
                      <Button type="button" onClick={() => handleRemoveItem(item.id)} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" size="sm">
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Cloth Type *</Label>
                        <select value={item.clothType} onChange={(e) => updateItem(item.id, 'clothType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
                          {CLOTH_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Price (₹) *</Label>
                        <Input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} required />
                      </div>
                    </div>

                    {index > 0 && (
                      <div>
                        <Label>Use Same Measurements As:</Label>
                        <select onChange={(e) => e.target.value && handleCopyMeasurements(item.id, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="">-- Select to copy measurements --</option>
                          {items.slice(0, index).map((prevItem, prevIndex) => (
                            <option key={prevItem.id} value={prevItem.id}>
                              Item #{prevIndex + 1} ({prevItem.clothType})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <Label className="mb-2">Measurements (inches)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {MEASUREMENT_FIELDS[item.clothType].map((field) => (
                          <div key={field}>
                            <Label className="text-xs capitalize">{field.replace(/_/g, ' ')}</Label>
                            <Input type="number" step="0.5" value={item.measurements[field] || ''} onChange={(e) => updateItemMeasurement(item.id, field, e.target.value)} placeholder="0.0" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Item Notes</Label>
                      <textarea value={item.notes} onChange={(e) => updateItem(item.id, 'notes', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Specific instructions for this item..." />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="specialInstructions">Special Instructions (Order-level)</Label>
                <textarea id="specialInstructions" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="General instructions for entire order..." />
              </div>
              <div>
                <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                <Input id="expectedDeliveryDate" type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label>Discount (₹):</Label>
                  <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-32" placeholder="0.00" />
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total Amount:</span>
                  <span className="text-indigo-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label>Advance Payment (₹):</Label>
                  <Input type="number" step="0.01" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} className="w-32" placeholder="0.00" />
                </div>
                <div className="flex justify-between text-lg text-orange-600 font-semibold">
                  <span>Balance Due:</span>
                  <span>₹{calculateBalance().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" onClick={() => router.push('/admin/orders')} variant="outline" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
              {loading ? 'Creating Order...' : 'Create Order'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
