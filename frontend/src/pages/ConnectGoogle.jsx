import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function ConnectGoogle() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      checkConnectionStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/api/auth/google/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setConnectionStatus(data);
    } catch (err) {
      console.error('Error checking status:', err);
      setConnectionStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) {
      alert('Please login first!');
      window.location.href = '/login';
      return;
    }

    try {
      // Get the OAuth URL from backend
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/auth/google/connect`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        setError('Failed to get authorization URL');
      }
    } catch (err) {
      console.error('Error connecting:', err);
      setError('Failed to connect. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google Business Profile?')) {
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      await fetch(`${API_URL}/api/auth/google/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      await checkConnectionStatus();
      alert('Disconnected successfully!');
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {connectionStatus?.connected ? (
          // ========== CONNECTED STATE - SUPER COMPACT ==========
          <div className="bg-white rounded-lg shadow p-5">
            
            {/* Header - One Line */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900">Connected</h2>
                <p className="text-xs text-gray-500">Google Business Profile</p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                Active
              </span>
            </div>

            {/* Details - Compact */}
            <div className="bg-gray-50 rounded p-3 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Account:</span>
                <span className="font-medium text-gray-900 truncate ml-2">
                  {connectionStatus.accountName || 'Connected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location:</span>
                <span className="font-medium text-gray-900 truncate ml-2">
                  {connectionStatus.locationName || 'Verified'}
                </span>
              </div>
            </div>

            {/* Buttons - Compact */}
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/reviews'}
                className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition text-sm"
              >
                Go to Dashboard →
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={handleConnect}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded font-medium hover:bg-gray-200 transition text-xs"
                >
                  🔄 Reconnect
                </button>
                
                <button
                  onClick={handleDisconnect}
                  className="flex-1 border border-red-300 text-red-600 py-2 rounded font-medium hover:bg-red-50 transition text-xs"
                >
                  Disconnect
                </button>
              </div>
            </div>

          </div>
        ) : (
          // ========== NOT CONNECTED STATE - SUPER COMPACT ==========
          <div className="bg-white rounded-lg shadow p-5">
            
            {/* Header */}
            <div className="text-center mb-4">
              <div className="inline-flex w-14 h-14 bg-blue-50 rounded-full items-center justify-center mb-3">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Connect Google Business
              </h2>
              <p className="text-xs text-gray-600">
                Manage reviews with AI
              </p>
            </div>

            {/* Benefits - Super Compact */}
            <div className="space-y-2 mb-4">
              {['Auto-fetch reviews', 'AI-powered replies', 'Post directly', 'Sentiment insights'].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              className="w-full bg-blue-600 text-white py-2.5 rounded font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              </svg>
              <span className="text-sm">Connect with Google</span>
            </button>

            {/* Security Note */}
            <p className="mt-3 text-center text-xs text-gray-500">
              🔒 Secure & Private
            </p>

          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded p-2">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
