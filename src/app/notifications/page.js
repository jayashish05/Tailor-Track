'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, CheckCheck, Trash2, Package, AlertCircle, Gift, ArrowLeft } from 'lucide-react';
import axios from '@/lib/axios';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          setUser(userData);
          await fetchNotifications();
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching notifications...');
      const response = await axios.get('/notifications');
      console.log('✅ Notifications response:', response.data);
      console.log('📊 Total notifications:', response.data.notifications?.length);
      console.log('🔔 Unread count:', response.data.unreadCount);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('❌ Fetch notifications error:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/notifications/mark-all-read');
      await fetchNotifications();
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/notifications/${id}`);
      await fetchNotifications();
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_confirmation':
        return <Package className="h-5 w-5 text-green-600" />;
      case 'status_update':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'ready_for_pickup':
        return <Gift className="h-5 w-5 text-purple-600" />;
      case 'admin_broadcast':
        return <Bell className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBg = (type, isRead) => {
    if (isRead) return 'bg-gray-50 border-gray-200';
    
    switch (type) {
      case 'order_confirmation':
        return 'bg-green-50 border-green-200';
      case 'status_update':
        return 'bg-blue-50 border-blue-200';
      case 'ready_for_pickup':
        return 'bg-purple-50 border-purple-200';
      case 'admin_broadcast':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    return true;
  });

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
        {/* Back to Dashboard Button */}
        <div className="mb-4">
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} className="flex items-center gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className="flex-1"
          >
            All ({notifications.length})
          </Button>
          <Button
            onClick={() => setFilter('unread')}
            variant={filter === 'unread' ? 'default' : 'outline'}
            className="flex-1"
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center">
            <BellOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification._id}
                className={`p-4 border-l-4 transition-all ${getNotificationBg(notification.type, notification.isRead)}`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    
                    {notification.order && (
                      <p className="text-sm text-gray-600">
                        Order: {notification.order.orderNumber} - {notification.order.status}
                      </p>
                    )}

                    <div className="flex gap-2 mt-3">
                      {!notification.isRead && (
                        <Button
                          onClick={() => markAsRead(notification._id)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Mark as Read
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => deleteNotification(notification._id)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
