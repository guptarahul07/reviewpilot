import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function ConnectGoogle() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [error, setError] = useState('');

  // Check connection status on load
  useEffect(() => {
    checkConnectionStatus();
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

  const handleConnect = () => {
    // Redirect to Google OAuth
    window.location.href = `${API_URL}/api/auth/google?uid=${user.uid}`;
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Google Business Profile? You will need to reconnect to manage reviews.')) {
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

      // Refresh status
      await checkConnectionStatus();
      alert('Google Business Profile disconnected successfully!');
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = () => {
    // Same as connect
    handleConnect();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking connection status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Business Profile
          </h1>
          <p className="text-gray-600">
            Connect your Google Business Profile to manage reviews with AI
          </p>
        </div>

        {/* Connection Status Card */}
        {connectionStatus?.connected ? (
          // CONNECTED STATE
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ✅ Connected!
              </h2>
              <p className="text-gray-600">
                Your Google Business Profile is connected and active
              </p>
            </div>

            {/* Connection Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Connection Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium text-gray-900">
                    {connectionStatus.accountName || 'Connected'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">
                    {connectionStatus.locationName || 'Verified'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Active
                  </span>
                </div>
                
                {connectionStatus.connectedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Connected on:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(connectionStatus.connectedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/reviews'}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Go to Reviews Dashboard →
              </button>
              
              <button
                onClick={handleReconnect}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                🔄 Reconnect Account
              </button>
              
              <button
                onClick={handleDisconnect}
                className="w-full bg-white border-2 border-red-200 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-50 transition"
              >
                Disconnect Google Business
              </button>
            </div>

            {/* Info Note */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <span className="text-blue-600">ℹ️</span>
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Need to reconnect?</p>
                  <p className="mt-1">
                    Click "Reconnect Account" if you're experiencing issues or want to connect a different Google Business Profile.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // NOT CONNECTED STATE
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Google Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-4">
                <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Your Google Business Profile
              </h2>
              <p className="text-gray-600">
                Start managing your reviews with AI-powered responses
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Fetch Your Reviews Automatically</p>
                  <p className="text-sm text-gray-600">All your Google reviews in one dashboard</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI-Generated Replies</p>
                  <p className="text-sm text-gray-600">Smart, personalized responses in seconds</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Post Replies Directly</p>
                  <p className="text-sm text-gray-600">Respond to customers without leaving the app</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Professional Insights</p>
                  <p className="text-sm text-gray-600">Understand customer sentiment and trends</p>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect with Google
            </button>

            {/* Security Note */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex gap-2">
                <span className="text-gray-500">🔒</span>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">Secure & Private</p>
                  <p className="mt-1">
                    We only access your business reviews. Your data is encrypted and never shared with third parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
