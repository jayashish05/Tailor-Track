'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_COLORS = {
  'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'arya-work-in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
  'arya-work-completed': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'measurement-taken': 'bg-blue-100 text-blue-800 border-blue-300',
  'cutting-done': 'bg-purple-100 text-purple-800 border-purple-300',
  'stitching-in-progress': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'ready-for-trial': 'bg-orange-100 text-orange-800 border-orange-300',
  'trial-done': 'bg-pink-100 text-pink-800 border-pink-300',
  'ready-for-delivery': 'bg-green-100 text-green-800 border-green-300',
  'delivered': 'bg-green-600 text-white border-green-700',
  'cancelled': 'bg-red-100 text-red-800 border-red-300'
};

const STATUS_ICONS = {
  'pending': '⏳',
  'arya-work-in-progress': '👨‍💼',
  'arya-work-completed': '✔️',
  'measurement-taken': '📏',
  'cutting-done': '✂️',
  'stitching-in-progress': '🧵',
  'ready-for-trial': '👔',
  'trial-done': '✅',
  'ready-for-delivery': '📦',
  'delivered': '🎉',
  'cancelled': '❌'
};

export default function TrackOrderPage() {
  const params = useParams();
  const barcode = params.barcode;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderByBarcode();
  }, [barcode]);

  const fetchOrderByBarcode = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/track/${barcode}`
      );
      
      if (response.data.success) {
        console.log('Order data received:', response.data.order);
        console.log('Items in order:', response.data.order.items);
        setOrder(response.data.order);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      if (error.response?.status === 404) {
        setError('Order not found. Please check your barcode and try again.');
      } else {
        setError('Failed to load order details. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFirstName = (fullName) => {
    return fullName.split(' ')[0];
  };

  const getProgressPercentage = (status) => {
    const statusOrder = [
      'pending',
      'arya-work-in-progress',
      'arya-work-completed',
      'measurement-taken',
      'cutting-done',
      'stitching-in-progress',
      'ready-for-trial',
      'trial-done',
      'ready-for-delivery',
      'delivered'
    ];
    
    if (status === 'cancelled') return 0;
    
    const currentIndex = statusOrder.indexOf(status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full shadow-lg border">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'Unable to find this order'}</p>
            <div className="bg-gray-100 p-4 rounded-lg border">
              <p className="text-sm text-gray-700 mb-2">Searched for barcode:</p>
              <p className="font-mono font-bold text-gray-900 text-lg">{barcode}</p>
            </div>
            <p className="text-xs text-gray-500 mt-6">
              If you believe this is an error, please contact us with your order details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage(order.status);

  // Determine if this is a multi-item order or legacy single-item order
  const isMultiItem = order.items && order.items.length > 0;
  console.log('isMultiItem:', isMultiItem, 'items:', order.items);
  const orderDescription = isMultiItem 
    ? `Your Order (${order.items.length} item${order.items.length > 1 ? 's' : ''})`
    : order.clothType 
      ? `Your ${order.clothType.charAt(0).toUpperCase() + order.clothType.slice(1)} Order`
      : 'Your Order';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white px-6 py-3 rounded-lg shadow-sm border mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Tailor Track
            </h1>
          </div>
          <p className="text-gray-600">Track Your Order Status</p>
        </div>

        {/* Main Order Card */}
        <Card className="shadow-lg border mb-6">
          <CardHeader className="bg-white border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-2 text-gray-900">
                  Hello, {getFirstName(order.customerName)}! 👋
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {orderDescription}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Order Barcode</p>
                <p className="font-mono font-bold text-xl text-gray-900">{order.barcode}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Current Status Badge */}
            <div className="text-center mb-8">
              <p className="text-sm text-gray-600 mb-3">Current Status</p>
              <div className={`inline-flex items-center px-6 py-3 text-lg font-bold rounded-lg border-2 ${STATUS_COLORS[order.status]}`}>
                <span className="text-2xl mr-2">{STATUS_ICONS[order.status]}</span>
                {formatStatus(order.status)}
              </div>
            </div>

            {/* Progress Bar */}
            {order.status !== 'cancelled' && (
              <div className="mb-8">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Order Items - Display items if they exist */}
            {order.items && order.items.length > 0 ? (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">📦</span>
                  <p className="text-lg font-bold text-gray-800">Your Order Items</p>
                </div>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="text-xl mr-2">
                              {item.clothType === 'shirt' ? '👔' : 
                               item.clothType === 'pants' ? '👖' : 
                               item.clothType === 'kurta' ? '🥻' : 
                               item.clothType === 'suit' ? '🤵' : 
                               item.clothType === 'dress' ? '👗' : 
                               item.clothType === 'blouse' ? '👚' : '👕'}
                            </span>
                            <p className="font-bold text-gray-900 text-lg capitalize">
                              {item.clothType}
                            </p>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded border border-gray-200">
                              <span className="font-semibold">Note: </span>{item.notes}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm text-gray-600">Price</p>
                          <p className="font-bold text-gray-900 text-xl">₹{item.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total Summary for multiple items */}
                  {order.items.length > 1 && (
                    <div className="bg-gray-900 text-white p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Items: {order.items.length}</span>
                        <span className="text-xl font-bold">₹{order.items.reduce((sum, item) => sum + (item.price || 0), 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : order.clothType ? (
              /* Legacy single-item display - only show if no items array */
              <div className="mb-6">
                <div className="bg-gray-100 p-4 rounded-lg border">
                  <p className="text-xs text-gray-600 mb-1">Cloth Type</p>
                  <p className="font-semibold text-gray-900 capitalize text-lg">{order.clothType}</p>
                </div>
              </div>
            ) : null}

            {/* Order Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded-lg border">
                <p className="text-xs text-gray-600 mb-1">Expected Delivery</p>
                <p className="font-semibold text-gray-900">
                  {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'To be confirmed'}
                </p>
              </div>
            </div>

            {/* Balance Payment Info */}
            {order.balanceAmount > 0 && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Balance Payment Due</p>
                    <p className="text-2xl font-bold text-orange-700">₹{order.balanceAmount}</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-600 mb-2 flex items-center">
                  <span className="mr-2">📝</span>
                  Special Instructions
                </p>
                <p className="text-sm text-gray-900">{order.specialInstructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status History Timeline */}
        <Card className="shadow-lg border">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-xl text-gray-900 flex items-center">
              <span className="mr-2">📋</span>
              Order History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {order.statusHistory && order.statusHistory.length > 0 ? (
              <div className="space-y-4">
                {order.statusHistory.slice().reverse().map((history, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start space-x-4 pb-4 ${index !== order.statusHistory.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${STATUS_COLORS[history.status]}`}>
                      {STATUS_ICONS[history.status]}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900 capitalize">
                        {formatStatus(history.status)}
                      </p>
                      <p className="text-sm text-gray-600">{formatDateTime(history.timestamp)}</p>
                    </div>
                    {index === 0 && (
                      <div className="flex-shrink-0">
                        <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                          Current
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No status updates yet</p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p className="mb-2">Need help? Contact us for assistance.</p>
          <p className="text-xs text-gray-500">
            Order created on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
