'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'measurement-taken', label: 'Measurement Taken' },
  { value: 'cutting-done', label: 'Cutting Done' },
  { value: 'stitching-in-progress', label: 'Stitching in Progress' },
  { value: 'ready-for-trial', label: 'Ready for Trial' },
  { value: 'trial-done', label: 'Trial Done' },
  { value: 'ready-for-delivery', label: 'Ready for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const CLOTH_TYPES = [
  { value: 'shirt', label: 'Shirt' },
  { value: 'pants', label: 'Pants' },
  { value: 'kurta', label: 'Kurta' },
  { value: 'suit', label: 'Suit' },
  { value: 'dress', label: 'Dress' },
  { value: 'blouse', label: 'Blouse' },
  { value: 'other', label: 'Other' }
];

const STATUS_COLORS = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'measurement-taken': 'bg-blue-100 text-blue-800',
  'cutting-done': 'bg-purple-100 text-purple-800',
  'stitching-in-progress': 'bg-indigo-100 text-indigo-800',
  'ready-for-trial': 'bg-orange-100 text-orange-800',
  'trial-done': 'bg-pink-100 text-pink-800',
  'ready-for-delivery': 'bg-green-100 text-green-800',
  'delivered': 'bg-green-600 text-white',
  'cancelled': 'bg-red-100 text-red-800'
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    address: '',
    clothType: '',
    measurements: {},
    specialInstructions: '',
    expectedDeliveryDate: '',
    amount: 0,
    advancePayment: 0,
    status: 'pending'
  });

  useEffect(() => {
    checkAuth();
    fetchOrder();
  }, [orderId]);

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

  const fetchOrder = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const orderData = response.data.order;
        setOrder(orderData);
        setFormData({
          customerName: orderData.customerName,
          phoneNumber: orderData.phoneNumber,
          address: orderData.address || '',
          clothType: orderData.clothType || '',
          measurements: orderData.measurements || {},
          specialInstructions: orderData.specialInstructions || '',
          expectedDeliveryDate: orderData.expectedDeliveryDate ? new Date(orderData.expectedDeliveryDate).toISOString().split('T')[0] : '',
          amount: orderData.amount,
          advancePayment: orderData.advancePayment,
          status: orderData.status,
          items: orderData.items || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
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

  const handleStatusUpdate = async (newStatus) => {
    try {
      setSaving(true);
      setError('');
      
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess('Status updated successfully! Use "Copy Link" to send the tracking link to customer.');
        fetchOrder(); // Refresh order data
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updateData = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        clothType: formData.clothType,
        measurements: formData.measurements,
        specialInstructions: formData.specialInstructions,
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
        amount: parseFloat(formData.amount),
        advancePayment: parseFloat(formData.advancePayment)
      };

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}`,
        updateData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess('Order updated successfully!');
        setEditMode(false);
        fetchOrder();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (order?.trackingLink) {
      navigator.clipboard.writeText(order.trackingLink).then(() => {
        setSuccess('Tracking link copied! You can now send it to the customer via WhatsApp or SMS manually.');
        setTimeout(() => setSuccess(''), 4000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        setError('Failed to copy link');
        setTimeout(() => setError(''), 3000);
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatStatus = (status) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const calculateBalance = () => {
    return parseFloat(formData.amount || 0) - parseFloat(formData.advancePayment || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">Order not found</p>
            <Button onClick={() => router.push('/admin/orders')}>
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/orders')}
                variant="outline"
                className="flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Orders
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-sm text-gray-600">Barcode: {order.barcode}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!editMode ? (
                <>
                  <Button
                    onClick={() => setEditMode(true)}
                    variant="outline"
                    className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                  >
                    Edit Order
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    disabled
                    className="text-gray-400 border-gray-300 cursor-not-allowed"
                    title="SMS feature requires Twilio account upgrade"
                  >
                    Send SMS
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(false);
                      fetchOrder();
                    }}
                    variant="outline"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name</Label>
                    {editMode ? (
                      <Input
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900 font-medium">{order.customerName}</p>
                    )}
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    {editMode ? (
                      <Input
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900 font-medium">{order.phoneNumber}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  {editMode ? (
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{order.address || 'Not provided'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show Items for multi-item orders */}
                {order.items && order.items.length > 0 ? (
                  <div>
                    <Label className="text-lg">Order Items</Label>
                    <div className="mt-2 space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-gray-900 capitalize">{item.clothType}</p>
                              {item.notes && (
                                <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                              )}
                            </div>
                            <p className="font-semibold text-gray-900">₹{item.price}</p>
                          </div>
                          {item.measurements && Object.keys(item.measurements).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-600 mb-1">Measurements:</p>
                              <div className="grid grid-cols-3 gap-2">
                                {Object.entries(item.measurements).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}: </span>
                                    <span className="font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Legacy single-item display */
                  <div>
                    <Label>Cloth Type</Label>
                    {editMode ? (
                      <select
                        name="clothType"
                        value={formData.clothType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {CLOTH_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900 font-medium capitalize">{order.clothType || 'N/A'}</p>
                    )}
                  </div>
                )}

                {/* Measurements - only show for legacy single-item orders */}
                {(!order.items || order.items.length === 0) && formData.measurements && Object.keys(formData.measurements).length > 0 && (
                  <div>
                    <Label className="text-lg">Measurements</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(formData.measurements || {}).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-2 rounded">
                          <Label className="text-xs text-gray-600 capitalize">{key.replace(/_/g, ' ')}</Label>
                          {editMode ? (
                            <Input
                              type="number"
                              step="0.5"
                              value={value}
                              onChange={(e) => handleMeasurementChange(key, e.target.value)}
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 font-medium">{value || 'N/A'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Special Instructions</Label>
                  {editMode ? (
                    <textarea
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{order.specialInstructions || 'None'}</p>
                  )}
                </div>

                <div>
                  <Label>Expected Delivery Date</Label>
                  {editMode ? (
                    <Input
                      type="date"
                      name="expectedDeliveryDate"
                      value={formData.expectedDeliveryDate}
                      onChange={handleChange}
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'Not set'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show breakdown for multi-item orders */}
                {order.items && order.items.length > 0 && order.subtotal && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">₹{order.subtotal}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>- ₹{order.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                      <span>Total:</span>
                      <span>₹{order.amount}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Total Amount</Label>
                    {editMode && (!order.items || order.items.length === 0) ? (
                      <Input
                        type="number"
                        step="0.01"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="mt-1 text-xl font-bold text-gray-900">₹{order.amount}</p>
                    )}
                  </div>
                  <div>
                    <Label>Advance Paid</Label>
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        name="advancePayment"
                        value={formData.advancePayment}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="mt-1 text-xl font-bold text-green-600">₹{order.advancePayment}</p>
                    )}
                  </div>
                  <div>
                    <Label>Balance Due</Label>
                    <p className="mt-1 text-xl font-bold text-orange-600">
                      ₹{editMode ? calculateBalance().toFixed(2) : order.balanceAmount}
                    </p>
                  </div>
                </div>
                {order.items && order.items.length > 0 && editMode && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
                    <p className="font-semibold">Note:</p>
                    <p>For multi-item orders, amounts are calculated automatically from items. To modify, please contact support or create a new order.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status & Timeline */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className={`px-3 py-2 inline-flex text-sm font-semibold rounded-full ${STATUS_COLORS[order.status]}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <Label>Update Status</Label>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={saving}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Status will be updated. Use "Copy Link" to notify customer.
                </p>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs text-gray-600">Barcode</Label>
                  <p className="font-mono font-bold text-indigo-600">{order.barcode}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Created</Label>
                  <p>{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Last Updated</Label>
                  <p>{formatDate(order.updatedAt)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Created By</Label>
                  <p>{order.createdBy}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Tracking Link</Label>
                  <a 
                    href={order.trackingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-xs break-all"
                  >
                    {order.trackingLink}
                  </a>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">SMS Status</Label>
                  <p className={order.smsSent ? 'text-green-600' : 'text-gray-600'}>
                    {order.smsSent ? `✓ Sent at ${formatDate(order.smsSentAt)}` : 'Not sent'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    order.statusHistory.slice().reverse().map((history, index) => (
                      <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
                        <div className="w-2 h-2 mt-2 rounded-full bg-indigo-600"></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm capitalize">{formatStatus(history.status)}</p>
                          <p className="text-xs text-gray-500">{formatDate(history.timestamp)}</p>
                          {history.updatedBy && (
                            <p className="text-xs text-gray-400">by {history.updatedBy}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No status updates yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
