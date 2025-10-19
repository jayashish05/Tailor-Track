'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shirt, Users, TrendingUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">TailorTrack</span>
          </h1>
          <p className="text-lg text-gray-500 mb-12">
            Made By Hasini Boutique
          </p>
          <p className="text-xl text-gray-600 max-w-xl mx-auto mb-8">
            Your Complete Tailoring Management Solution
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Track orders, manage customers, and streamline your tailoring business
          </p>

          {/* Main CTA Buttons */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-6">
              <Link href="/login">
                <Button size="lg" className="text-xl px-10 py-5 h-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="text-xl px-10 py-5 h-auto">
                  Sign Up
                </Button>
              </Link>
            </div>
            {/* Admin Login Link */}
            <Link href="/admin/login">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-sm text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                🔒 Admin Login
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16"
        >
          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shirt className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Order Management</h3>
            <p className="text-sm text-gray-600">
              Track every order from start to finish
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
            <p className="text-sm text-gray-600">
              Keep track of all your customers
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Integration</h3>
            <p className="text-sm text-gray-600">
              Secure payments with Razorpay
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-sm text-gray-600">
              Get insights and track revenue
            </p>
          </div>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Sign Up</h3>
              <p className="text-gray-600">
                Create your account in seconds
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Add Orders</h3>
              <p className="text-gray-600">
                Start tracking your tailoring orders
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Grow Your Business</h3>
              <p className="text-gray-600">
                Manage everything from one dashboard
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
