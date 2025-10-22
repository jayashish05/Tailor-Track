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
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    clothType: 'shirt',
    measurements: {},
    amount: '',
    advanceAmount: '',
    deliveryDate: '',
    notes: ''
  });

  // Update measurements when cloth type changes
  useEffect(() => {
    const fields = MEASUREMENT_FIELDS[formData.clothType] || [];
    const newMeasurements = {};
    fields.forEach(field => {
      newMeasurements[field] = formData.measurements[field] || '';
    });
    setFormData(prev => ({ ...prev, measurements: newMeasurements }));
  }, [formData.clothType]);

  // Check authentication
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMeasurementChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value
      }
    }));
  };

  const calculateBalance = () => {
    const amount = parseFloat(formData.amount) || 0;
    const advance = parseFloat(formData.advanceAmount) || 0;
    return amount - advance;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate phone number
      if (!/^\d{10}$/.test(formData.customerPhone)) {
        throw new Error('Phone number must be 10 digits');
      }

      // Validate amounts
      const amount = parseFloat(formData.amount);
      const advance = parseFloat(formData.advanceAmount) || 0;
      
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      if (advance > amount) {
        throw new Error('Advance amount cannot be greater than total amount');
      }

      // Prepare order data
      const orderData = {
        customerName: formData.customerName.trim(),
        phoneNumber: formData.customerPhone.trim(),
        address: formData.customerAddress.trim(),
        clothType: formData.clothType,
        measurements: formData.measurements,
        specialInstructions: formData.notes.trim() || undefined,
        expectedDeliveryDate: formData.deliveryDate || undefined,
        amount: amount,
        advancePayment: advance
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders`,
        orderData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(`Order created successfully! Barcode: ${response.data.order.barcode}`);
        
        // Reset form
        setTimeout(() => {
          router.push('/admin/orders');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const formatFieldName = (field) => {
    return field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
                className="flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
                <p className="text-sm text-gray-600">Fill in customer and order details</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                    placeholder="10 digit number"
                    pattern="\d{10}"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  placeholder="Customer address (optional)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Select cloth type and enter measurements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clothType">Cloth Type *</Label>
                <select
                  id="clothType"
                  name="clothType"
                  value={formData.clothType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {CLOTH_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Measurements */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Measurements (in inches)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {MEASUREMENT_FIELDS[formData.clothType]?.map(field => (
                    <div key={field}>
                      <Label htmlFor={field}>{formatFieldName(field)}</Label>
                      <Input
                        id={field}
                        type="number"
                        step="0.5"
                        value={formData.measurements[field] || ''}
                        onChange={(e) => handleMeasurementChange(field, e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes / Special Instructions</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any special instructions or notes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Enter amount and delivery information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Total Amount (₹) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="advanceAmount">Advance Amount (₹)</Label>
                  <Input
                    id="advanceAmount"
                    name="advanceAmount"
                    type="number"
                    step="0.01"
                    value={formData.advanceAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Balance Amount (₹)</Label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 font-medium">
                    ₹{calculateBalance().toFixed(2)}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryDate">Expected Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  name="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Order...
                </span>
              ) : (
                'Create Order'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
