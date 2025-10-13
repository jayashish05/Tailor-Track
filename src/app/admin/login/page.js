'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import axios from '@/lib/axios';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.user) {
        // Check if user is admin
        if (response.data.user.role !== 'admin') {
          setError('Access Denied: Admin privileges required');
          await axios.post('/auth/logout');
          setLoading(false);
          return;
        }

        // Store admin user
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isAdmin', 'true');
        
        // Redirect to admin dashboard
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.error || 'Invalid credentials or access denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-2xl border-gray-700 bg-gray-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-400">Authorized Personnel Only</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-200">Admin Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="admin@tailortrack.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-200">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </Button>
          </form>

          {/* Back to Customer Login */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
              ← Back to Customer Login
            </Link>
          </div>
        </Card>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-gray-500 text-sm"
        >
          <p>⚠️ Unauthorized access attempts are logged and monitored</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
