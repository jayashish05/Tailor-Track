'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TrackOrderPortal() {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedBarcode = barcode.trim().toUpperCase();

    if (!trimmedBarcode) {
      setError('Please enter a barcode');
      return;
    }

    if (trimmedBarcode.length < 5) {
      setError('Please enter a valid barcode');
      return;
    }

    // Navigate to tracking page
    router.push(`/track/${trimmedBarcode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white px-8 py-4 rounded-2xl shadow-lg border-2 border-gray-200 mb-6">
            <h1 className="text-4xl font-bold text-gray-900">
              Tailor Track
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Track Your Order Status</p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center">
              <span className="text-3xl mr-3">🔍</span>
              Track Your Order
            </CardTitle>
            <CardDescription className="text-gray-200">
              Enter your order barcode to view status
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="barcode" className="block text-sm font-semibold text-gray-700 mb-2">
                  Order Barcode
                </label>
                <Input
                  id="barcode"
                  type="text"
                  placeholder="Enter your barcode (e.g., TT12345678)"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                  className="text-lg py-6 text-center font-mono font-bold tracking-wider"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  You can find this barcode on your order receipt
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-lg font-semibold"
              >
                Track Order 🔍
              </Button>
            </form>

            {/* Help Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-xl mr-2">💡</span>
                Need Help?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Your barcode is printed on your order receipt</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Barcode format: TT followed by 8-10 characters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>If you received an SMS, click the link directly</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Contact us if you can't find your barcode</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2025 Tailor Track. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
