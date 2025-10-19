'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Users, Search, Phone, Mail, Package, DollarSign, Ruler, X } from 'lucide-react';
import axios from '@/lib/axios';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [measurements, setMeasurements] = useState({
    shirt: {
      shirtLength: '',
      chest: '',
      shoulder: '',
      sleeveLength: '',
      neck: ''
    },
    pants: {
      waist: '',
      hip: '',
      inseam: '',
      outseam: '',
      thigh: ''
    },
    suit: {
      jacketLength: '',
      chest: '',
      shoulder: '',
      sleeveLength: '',
      waist: '',
      pantsWaist: '',
      pantsLength: ''
    },
    dress: {
      length: '',
      bust: '',
      waist: '',
      hip: '',
      shoulder: '',
      sleeveLength: ''
    },
    kurta: {
      length: '',
      chest: '',
      shoulder: '',
      sleeveLength: '',
      neck: ''
    },
    blouse: {
      length: '',
      bust: '',
      shoulder: '',
      sleeveLength: '',
      neck: ''
    },
    other: {
      measurement1: '',
      measurement2: '',
      measurement3: '',
      notes: ''
    }
  });
  const [savingMeasurements, setSavingMeasurements] = useState(false);

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

  const openMeasurementsModal = (customer) => {
    setSelectedCustomer(customer);
    setMeasurements({
      shirt: {
        shirtLength: customer.measurements?.shirt?.shirtLength || '',
        chest: customer.measurements?.shirt?.chest || '',
        shoulder: customer.measurements?.shirt?.shoulder || '',
        sleeveLength: customer.measurements?.shirt?.sleeveLength || '',
        neck: customer.measurements?.shirt?.neck || ''
      },
      pants: {
        waist: customer.measurements?.pants?.waist || '',
        hip: customer.measurements?.pants?.hip || '',
        inseam: customer.measurements?.pants?.inseam || '',
        outseam: customer.measurements?.pants?.outseam || '',
        thigh: customer.measurements?.pants?.thigh || ''
      },
      suit: {
        jacketLength: customer.measurements?.suit?.jacketLength || '',
        chest: customer.measurements?.suit?.chest || '',
        shoulder: customer.measurements?.suit?.shoulder || '',
        sleeveLength: customer.measurements?.suit?.sleeveLength || '',
        waist: customer.measurements?.suit?.waist || '',
        pantsWaist: customer.measurements?.suit?.pantsWaist || '',
        pantsLength: customer.measurements?.suit?.pantsLength || ''
      },
      dress: {
        length: customer.measurements?.dress?.length || '',
        bust: customer.measurements?.dress?.bust || '',
        waist: customer.measurements?.dress?.waist || '',
        hip: customer.measurements?.dress?.hip || '',
        shoulder: customer.measurements?.dress?.shoulder || '',
        sleeveLength: customer.measurements?.dress?.sleeveLength || ''
      },
      kurta: {
        length: customer.measurements?.kurta?.length || '',
        chest: customer.measurements?.kurta?.chest || '',
        shoulder: customer.measurements?.kurta?.shoulder || '',
        sleeveLength: customer.measurements?.kurta?.sleeveLength || '',
        neck: customer.measurements?.kurta?.neck || ''
      },
      blouse: {
        length: customer.measurements?.blouse?.length || '',
        bust: customer.measurements?.blouse?.bust || '',
        shoulder: customer.measurements?.blouse?.shoulder || '',
        sleeveLength: customer.measurements?.blouse?.sleeveLength || '',
        neck: customer.measurements?.blouse?.neck || ''
      },
      other: {
        measurement1: customer.measurements?.other?.measurement1 || '',
        measurement2: customer.measurements?.other?.measurement2 || '',
        measurement3: customer.measurements?.other?.measurement3 || '',
        notes: customer.measurements?.other?.notes || ''
      }
    });
    setShowMeasurementsModal(true);
  };

  const handleMeasurementChange = (category, field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const saveMeasurements = async () => {
    setSavingMeasurements(true);
    try {
      await axios.patch(`/customers/${selectedCustomer._id}/measurements`, {
        measurements
      });
      
      // Refresh customers list
      await fetchCustomers();
      setShowMeasurementsModal(false);
      alert('Measurements updated successfully!');
    } catch (error) {
      console.error('Failed to save measurements:', error);
      alert('Failed to save measurements. Please try again.');
    } finally {
      setSavingMeasurements(false);
    }
  };

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

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => openMeasurementsModal(customer)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Ruler className="w-4 h-4 mr-2" />
                      Measurements
                    </Button>
                    <Link href={`/admin/customers/${customer._id}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Measurements Modal */}
        {showMeasurementsModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Edit Measurements - {selectedCustomer.name}
                  </h2>
                  <button
                    onClick={() => setShowMeasurementsModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Shirt Measurements */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-blue-400" />
                      Shirt Measurements
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Shirt Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.shirt.shirtLength}
                          onChange={(e) => handleMeasurementChange('shirt', 'shirtLength', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 28"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Chest (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.shirt.chest}
                          onChange={(e) => handleMeasurementChange('shirt', 'chest', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 40"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Shoulder (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.shirt.shoulder}
                          onChange={(e) => handleMeasurementChange('shirt', 'shoulder', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 17"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Sleeve Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.shirt.sleeveLength}
                          onChange={(e) => handleMeasurementChange('shirt', 'sleeveLength', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 24"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Neck (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.shirt.neck}
                          onChange={(e) => handleMeasurementChange('shirt', 'neck', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 15"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pants Measurements */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-purple-400" />
                      Pants Measurements
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Waist (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.pants.waist}
                          onChange={(e) => handleMeasurementChange('pants', 'waist', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 32"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Hip (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.pants.hip}
                          onChange={(e) => handleMeasurementChange('pants', 'hip', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 38"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Inseam (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.pants.inseam}
                          onChange={(e) => handleMeasurementChange('pants', 'inseam', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 30"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Outseam (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.pants.outseam}
                          onChange={(e) => handleMeasurementChange('pants', 'outseam', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 42"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Thigh (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.pants.thigh}
                          onChange={(e) => handleMeasurementChange('pants', 'thigh', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 22"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Suit Measurements */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-amber-400" />
                      Suit Measurements
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Jacket Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.suit.jacketLength}
                          onChange={(e) => handleMeasurementChange('suit', 'jacketLength', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 30"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Chest (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.suit.chest}
                          onChange={(e) => handleMeasurementChange('suit', 'chest', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 42"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Shoulder (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.suit.shoulder}
                          onChange={(e) => handleMeasurementChange('suit', 'shoulder', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 18"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Sleeve Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.suit.sleeveLength}
                          onChange={(e) => handleMeasurementChange('suit', 'sleeveLength', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 25"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Jacket Waist (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.suit.waist}
                          onChange={(e) => handleMeasurementChange('suit', 'waist', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 36"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Pants Waist (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.suit.pantsWaist}
                          onChange={(e) => handleMeasurementChange('suit', 'pantsWaist', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 34"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Pants Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.suit.pantsLength}
                          onChange={(e) => handleMeasurementChange('suit', 'pantsLength', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 42"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dress Measurements */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-pink-400" />
                      Dress Measurements
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.dress.length}
                          onChange={(e) => handleMeasurementChange('dress', 'length', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 38"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Bust (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.dress.bust}
                          onChange={(e) => handleMeasurementChange('dress', 'bust', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 36"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Waist (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.dress.waist}
                          onChange={(e) => handleMeasurementChange('dress', 'waist', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 30"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Hip (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.dress.hip}
                          onChange={(e) => handleMeasurementChange('dress', 'hip', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 38"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Shoulder (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.dress.shoulder}
                          onChange={(e) => handleMeasurementChange('dress', 'shoulder', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 15"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Sleeve Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.dress.sleeveLength}
                          onChange={(e) => handleMeasurementChange('dress', 'sleeveLength', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 22"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kurta Measurements */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-orange-400" />
                      Kurta Measurements
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.kurta.length}
                          onChange={(e) => handleMeasurementChange('kurta', 'length', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 40"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Chest (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.kurta.chest}
                          onChange={(e) => handleMeasurementChange('kurta', 'chest', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 42"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Shoulder (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.kurta.shoulder}
                          onChange={(e) => handleMeasurementChange('kurta', 'shoulder', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 17"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Sleeve Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.kurta.sleeveLength}
                          onChange={(e) => handleMeasurementChange('kurta', 'sleeveLength', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 24"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Neck (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.kurta.neck}
                          onChange={(e) => handleMeasurementChange('kurta', 'neck', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 16"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Blouse Measurements */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-rose-400" />
                      Blouse Measurements
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.blouse.length}
                          onChange={(e) => handleMeasurementChange('blouse', 'length', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 16"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Bust (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.blouse.bust}
                          onChange={(e) => handleMeasurementChange('blouse', 'bust', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 36"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Shoulder (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.blouse.shoulder}
                          onChange={(e) => handleMeasurementChange('blouse', 'shoulder', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 14"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Sleeve Length (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.blouse.sleeveLength}
                          onChange={(e) => handleMeasurementChange('blouse', 'sleeveLength', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 12"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Neck (inches)</Label>
                        <Input
                          type="number"
                          value={measurements.blouse.neck}
                          onChange={(e) => handleMeasurementChange('blouse', 'neck', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="e.g., 13"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Other Measurements */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-gray-400" />
                      Other Measurements
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Measurement 1</Label>
                        <Input
                          type="text"
                          value={measurements.other.measurement1}
                          onChange={(e) => handleMeasurementChange('other', 'measurement1', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Custom measurement"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Measurement 2</Label>
                        <Input
                          type="text"
                          value={measurements.other.measurement2}
                          onChange={(e) => handleMeasurementChange('other', 'measurement2', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Custom measurement"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Measurement 3</Label>
                        <Input
                          type="text"
                          value={measurements.other.measurement3}
                          onChange={(e) => handleMeasurementChange('other', 'measurement3', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Custom measurement"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-gray-300">Notes</Label>
                        <textarea
                          value={measurements.other.notes}
                          onChange={(e) => handleMeasurementChange('other', 'notes', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
                          rows="3"
                          placeholder="Additional notes or special measurements"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    onClick={() => setShowMeasurementsModal(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={savingMeasurements}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveMeasurements}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={savingMeasurements}
                  >
                    {savingMeasurements ? 'Saving...' : 'Save Measurements'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
