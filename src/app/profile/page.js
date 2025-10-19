'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Calendar, Edit2, Save, X, ArrowLeft } from 'lucide-react';
import axios from '@/lib/axios';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          setUser(userData);
          await fetchCustomerData(userData);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchCustomerData = async (userData) => {
    try {
      const response = await axios.get('/customers/me');
      const myCustomer = response.data.customer;
      
      if (myCustomer) {
        setCustomer(myCustomer);
        setFormData({
          name: myCustomer.name || '',
          age: myCustomer.age || '',
          phone: myCustomer.phone || '',
          email: myCustomer.email || userData.email || '',
          address: {
            street: myCustomer.address?.street || '',
            city: myCustomer.address?.city || '',
            state: myCustomer.address?.state || '',
            zipCode: myCustomer.address?.zipCode || '',
            country: myCustomer.address?.country || '',
          },
        });
      }
    } catch (error) {
      console.error('Fetch customer error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (customer) {
        await axios.put('/customers/me', formData);
        setSuccess('Profile updated successfully!');
        setEditing(false);
        await fetchCustomerData(user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
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
        {/* Back to Dashboard Button */}
        <div className="mb-4">
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your personal information</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            {!editing ? (
              <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                    if (customer) {
                      setFormData({
                        name: customer.name || '',
                        age: customer.age || '',
                        phone: customer.phone || '',
                        email: customer.email || '',
                        address: customer.address || {},
                      });
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="age" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Age
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Enter your age"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address.street">Street Address</Label>
                <Input
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <Label htmlFor="address.city">City</Label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter city"
                />
              </div>

              <div>
                <Label htmlFor="address.state">State</Label>
                <Input
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter state"
                />
              </div>

              <div>
                <Label htmlFor="address.zipCode">ZIP Code</Label>
                <Input
                  id="address.zipCode"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter ZIP code"
                />
              </div>

              <div>
                <Label htmlFor="address.country">Country</Label>
                <Input
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Measurements Section */}
        {customer?.measurements && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Measurements</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {customer.measurements.shirtLength && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Shirt Length</p>
                  <p className="text-lg font-semibold">{customer.measurements.shirtLength} cm</p>
                </div>
              )}
              {customer.measurements.chest && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Chest</p>
                  <p className="text-lg font-semibold">{customer.measurements.chest} cm</p>
                </div>
              )}
              {customer.measurements.shoulder && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Shoulder</p>
                  <p className="text-lg font-semibold">{customer.measurements.shoulder} cm</p>
                </div>
              )}
              {customer.measurements.waist && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Waist</p>
                  <p className="text-lg font-semibold">{customer.measurements.waist} cm</p>
                </div>
              )}
              {customer.measurements.hip && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Hip</p>
                  <p className="text-lg font-semibold">{customer.measurements.hip} cm</p>
                </div>
              )}
              {customer.measurements.inseam && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Inseam</p>
                  <p className="text-lg font-semibold">{customer.measurements.inseam} cm</p>
                </div>
              )}
            </div>

            {/* Measurements History */}
            {customer.measurementsHistory && customer.measurementsHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Measurement History</h3>
                <div className="space-y-3">
                  {customer.measurementsHistory.map((history, index) => (
                    <div key={index} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">
                        Updated on {new Date(history.updatedAt).toLocaleDateString()}
                      </p>
                      {history.notes && (
                        <p className="text-sm text-gray-700 mt-1">Note: {history.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Account Stats */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-blue-700">{customer?.totalOrders || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Spent</p>
              <p className="text-2xl font-bold text-green-700">₹{customer?.totalSpent || 0}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Member Since</p>
              <p className="text-2xl font-bold text-purple-700">
                {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
