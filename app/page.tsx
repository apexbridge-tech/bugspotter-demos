'use client';

import { useState } from 'react';

export default function Home() {
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/demo/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the demo subdomain
        const { subdomain } = data.session;

        // Use path format: /kazbank-{session}
        const demoPath = `kazbank-${subdomain}`;

        // Always use path-based routing
        window.location.href = `/${demoPath}/dashboard`;
      } else {
        setError(data.error || 'Failed to create demo session');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error creating demo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🐛</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BugSpotter
            </h1>
          </div>
          <p className="text-2xl text-gray-700 mb-4">Experience Real-Time Bug Tracking in Action</p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Try our interactive demo environments with intentional bugs to see how BugSpotter
            captures, tracks, and reports issues in real-time.
          </p>
        </div>

        {/* Demo Creation Form */}
        <div className="max-w-md mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Create Your Demo Session
            </h2>
            <form onSubmit={handleCreateDemo} className="space-y-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter your company name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Demo...
                  </span>
                ) : (
                  'Start Interactive Demo'
                )}
              </button>
            </form>
            <p className="text-xs text-gray-500 text-center mt-4">
              Your demo session will expire after 2 hours
            </p>
          </div>
        </div>

        {/* Demo Previews */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Explore Interactive Demo Environments
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* KazBank */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-2">🏦</div>
                  <h3 className="text-2xl font-bold">KazBank</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Professional banking interface with intentional bugs in transfers, statements, and
                  currency conversion.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Transfer timeout errors
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    PDF corruption bugs
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Calculation errors
                  </div>
                </div>
              </div>
            </div>

            {/* TalentFlow */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-2">👥</div>
                  <h3 className="text-2xl font-bold">TalentFlow</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Modern HR platform with bugs in candidate search, file uploads, and interview
                  scheduling.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Search query crashes
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Upload progress freeze
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Email duplicates
                  </div>
                </div>
              </div>
            </div>

            {/* QuickMart */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-2">🛒</div>
                  <h3 className="text-2xl font-bold">QuickMart</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  E-commerce platform with cart bugs, checkout issues, and promo code failures.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Double-add cart bug
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    Payment freeze
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Promo code errors
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            What You'll Experience
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Real-Time Bug Capture</h3>
                <p className="text-gray-600">
                  See bugs captured instantly as they occur, with detailed error messages and stack
                  traces.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Comprehensive Dashboard</h3>
                <p className="text-gray-600">
                  View all captured bugs with severity levels, timestamps, and detailed information.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Element Tracking</h3>
                <p className="text-gray-600">
                  Every bug is linked to the specific UI element that triggered it for easy
                  debugging.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Isolated Sessions</h3>
                <p className="text-gray-600">
                  Each demo creates an isolated session with its own subdomain and data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-20">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2025 BugSpotter. Interactive demo system with intentional bugs.</p>
        </div>
      </footer>
    </div>
  );
}
