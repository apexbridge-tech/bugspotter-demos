'use client';

import { useEffect, useState, useCallback } from 'react';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';

interface DemoSession {
  subdomain: string;
  company: string;
  createdAt: number;
  expiresAt: number;
  events: number;
  bugs: number;
}

interface BugEvent {
  id: string;
  subdomain: string;
  timestamp: number;
  errorMessage: string;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  elementId?: string;
  demo: 'kazbank' | 'talentflow' | 'quickmart';
  userAgent?: string;
}

interface BugStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byDemo: {
    kazbank: number;
    talentflow: number;
    quickmart: number;
  };
}

export default function AdminPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [requiresTOTP, setRequiresTOTP] = useState(false);
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [bugs, setBugs] = useState<BugEvent[]>([]);
  const [bugStats, setBugStats] = useState<BugStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'bugs' | 'injector' | '2fa'>('sessions');
  const [error, setError] = useState('');
  const [showCreateBug, setShowCreateBug] = useState(false);
  const [useCustomSubdomain, setUseCustomSubdomain] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);

  // Create Bug Form
  const [newBug, setNewBug] = useState({
    subdomain: '',
    errorMessage: '',
    stackTrace: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    elementId: '',
    demo: 'kazbank' as 'kazbank' | 'talentflow' | 'quickmart',
  });

  // BugInjector Configuration
  const [injectorProbability, setInjectorProbability] = useState(30);
  const [injectorEnabled, setInjectorEnabled] = useState(true);
  const [injectorLoading, setInjectorLoading] = useState(false);
  const [injectorSaved, setInjectorSaved] = useState(false);

  // Create Session Form
  const [newSessionCompany, setNewSessionCompany] = useState('');
  const [sessionCreating, setSessionCreating] = useState(false);

  // 2FA Setup
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

  const isAuthenticated = !!sessionToken;

  // Helper function to generate proper demo URLs
  const getDemoUrl = (demo: string, sessionId: string, path: string = '') => {
    const fullSubdomain = `${demo}-${sessionId}`;
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return `/${fullSubdomain}${path}`;
    }
    return `https://${fullSubdomain}.demo.bugspotter.io${path}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totpToken }),
      });

      const data = await response.json();

      if (data.requiresTOTP) {
        setRequiresTOTP(true);
        return;
      }

      if (data.success) {
        setSessionToken(data.sessionToken);
        localStorage.setItem('admin-session', data.sessionToken);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('An error occurred during login');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', {
        method: 'DELETE',
        headers: { 'x-session-token': sessionToken || '' },
      });
    } catch (err: unknown) {
      console.error('Logout error:', err);
    }

    setSessionToken(null);
    localStorage.removeItem('admin-session');
    setEmail('');
    setPassword('');
    setTotpToken('');
    setRequiresTOTP(false);
  };

  const setup2FA = async () => {
    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'x-session-token': sessionToken || '' },
      });

      const data = await response.json();
      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShow2FASetup(true);
      }
    } catch {
      setError('Failed to setup 2FA');
    }
  };

  const enable2FA = async () => {
    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'PUT',
        headers: {
          'x-session-token': sessionToken || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verifyToken }),
      });

      const data = await response.json();
      if (data.success) {
        alert('2FA enabled successfully!');
        setShow2FASetup(false);
        setVerifyToken('');
      } else {
        setError(data.error || 'Failed to enable 2FA');
      }
    } catch {
      setError('Failed to enable 2FA');
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) return;

    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'DELETE',
        headers: { 'x-session-token': sessionToken || '' },
      });

      const data = await response.json();
      if (data.success) {
        alert('2FA disabled successfully');
      }
    } catch {
      setError('Failed to disable 2FA');
    }
  };

  const fetchSessions = useCallback(async () => {
    if (!sessionToken) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/sessions', {
        headers: { 'x-session-token': sessionToken },
      });

      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  const fetchBugs = useCallback(async () => {
    if (!sessionToken) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/bugs', {
        headers: { 'x-session-token': sessionToken },
      });

      const data = await response.json();
      if (data.success) {
        setBugs(data.bugs);
        setBugStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching bugs:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  const deleteSession = async (subdomain: string) => {
    if (!confirm(`Delete session ${subdomain}?`)) return;

    try {
      const response = await fetch(`/api/admin/sessions?subdomain=${subdomain}`, {
        method: 'DELETE',
        headers: { 'x-session-token': sessionToken || '' },
      });

      const data = await response.json();
      if (data.success) {
        await fetchSessions();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const createBug = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newBug,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Bug created successfully!');
        setShowCreateBug(false);
        setUseCustomSubdomain(false);
        setNewBug({
          subdomain: '',
          errorMessage: '',
          stackTrace: '',
          severity: 'medium',
          elementId: '',
          demo: 'kazbank',
        });
        if (activeTab === 'bugs') {
          await fetchBugs();
        }
      } else {
        setError(data.error || 'Failed to create bug');
      }
    } catch (err) {
      setError('Failed to create bug');
      console.error('Create bug error:', err);
    }
  };

  const fetchInjectorConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/injector/config');
      const data = await response.json();
      
      if (data.success && data.config) {
        setInjectorEnabled(data.config.enabled);
        setInjectorProbability(data.config.probability);
      }
    } catch (error) {
      console.error('Error fetching injector config:', error);
    }
  }, []);

  const saveInjectorConfig = async () => {
    if (!sessionToken) return;
    
    setInjectorLoading(true);
    setInjectorSaved(false);
    
    try {
      const response = await fetch('/api/injector/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({
          enabled: injectorEnabled,
          probability: injectorProbability,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setInjectorSaved(true);
        setTimeout(() => setInjectorSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
      console.error('Save injector config error:', err);
    } finally {
      setInjectorLoading(false);
    }
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSessionCreating(true);

    try {
      const response = await fetch('/api/demo/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company: newSessionCompany }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Session created successfully!\nSubdomain: ${data.session.subdomain}\nCompany: ${data.session.company}`);
        setShowCreateSession(false);
        setNewSessionCompany('');
        if (activeTab === 'sessions') {
          await fetchSessions();
        }
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (err) {
      setError('Failed to create session');
      console.error('Create session error:', err);
    } finally {
      setSessionCreating(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('admin-session');
    if (saved) {
      setSessionToken(saved);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'sessions') {
        fetchSessions();
      } else if (activeTab === 'bugs') {
        fetchBugs();
      } else if (activeTab === 'injector') {
        fetchInjectorConfig();
      }
    }
  }, [isAuthenticated, activeTab, fetchSessions, fetchBugs, fetchInjectorConfig]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600 mt-2">BugSpotter Demo System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="admin@example.com"
                required
                disabled={requiresTOTP}
              />
            </div>

            {!requiresTOTP && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {requiresTOTP && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2FA Token</label>
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {requiresTOTP ? 'Verify 2FA' : 'Login'}
            </button>

            {requiresTOTP && (
              <button
                type="button"
                onClick={() => setRequiresTOTP(false)}
                className="w-full text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back to login
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900',
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">BugSpotter Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{email}</span>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'sessions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Sessions ({sessions.length})
              </button>
              <button
                onClick={() => setActiveTab('bugs')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'bugs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                All Bugs ({bugs.length})
              </button>
              <button
                onClick={() => setActiveTab('injector')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'injector'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Bug Injector
              </button>
              <button
                onClick={() => setActiveTab('2fa')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === '2fa'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Security (2FA)
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'injector' ? (
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">Bug Injector Configuration</h2>
                  <p className="text-gray-600">
                    Configure how bugs are automatically triggered in your demo applications. The BugInjector
                    runs on the client-side in KazBank, TalentFlow, and QuickMart demos.
                  </p>
                </div>

                {/* Global Settings */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    Global Settings
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Bug Injection Enabled
                          </label>
                          <p className="text-xs text-gray-500">
                            Enable or disable automatic bug triggering across all demos
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={injectorEnabled}
                            onChange={(e) => setInjectorEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Trigger Probability: {injectorProbability}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={injectorProbability}
                        onChange={(e) => setInjectorProbability(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0% (Never)</span>
                        <span>50% (Half the time)</span>
                        <span>100% (Always)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {injectorProbability === 0 && '❌ Bugs will never trigger automatically'}
                        {injectorProbability > 0 && injectorProbability <= 20 && '🟢 Low frequency - Rare bug occurrence'}
                        {injectorProbability > 20 && injectorProbability <= 40 && '🟡 Medium frequency - Occasional bugs'}
                        {injectorProbability > 40 && injectorProbability <= 70 && '🟠 High frequency - Frequent bugs'}
                        {injectorProbability > 70 && '🔴 Very high frequency - Almost every click'}
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> For sales demos, 30-40% probability works well to show bugs
                        without overwhelming prospects. For testing, use 100%.
                      </p>
                    </div>

                    <button
                      onClick={saveInjectorConfig}
                      disabled={injectorLoading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {injectorLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : injectorSaved ? (
                        <>
                          ✓ Saved Successfully!
                        </>
                      ) : (
                        <>
                          💾 Save Configuration
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Demo-Specific Configuration */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 mb-4">Demo Applications</h3>

                  {/* KazBank */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🏦</span>
                      <div>
                        <h4 className="font-bold text-gray-800">KazBank - Banking Demo</h4>
                        <p className="text-sm text-gray-600">Financial services application</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Active Bug Types:</span>
                        <span className="font-medium">Network errors, Timeouts, Calculation errors</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Configured Elements:</span>
                        <span className="font-medium">Transfer buttons, Login forms, Balance checks</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Status:</span>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TalentFlow */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">👔</span>
                      <div>
                        <h4 className="font-bold text-gray-800">TalentFlow - HR Platform</h4>
                        <p className="text-sm text-gray-600">Recruitment and applicant tracking</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Active Bug Types:</span>
                        <span className="font-medium">Validation errors, Timeouts, Upload failures</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Configured Elements:</span>
                        <span className="font-medium">Apply buttons, Resume uploads, Application forms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Status:</span>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QuickMart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🛒</span>
                      <div>
                        <h4 className="font-bold text-gray-800">QuickMart - E-commerce</h4>
                        <p className="text-sm text-gray-600">Online shopping platform</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Active Bug Types:</span>
                        <span className="font-medium">Cart errors, Payment failures, Search crashes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Configured Elements:</span>
                        <span className="font-medium">Add to cart, Checkout, Search bar</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Status:</span>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="text-2xl">📝</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-1">How BugInjector Works</h4>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Automatically attaches to interactive elements in demo apps</li>
                        <li>Triggers bugs based on the probability you set above</li>
                        <li>Generates realistic error messages and stack traces</li>
                        <li>Reports all bugs to the API automatically</li>
                        <li>Shows visual feedback (color flashes) when bugs occur</li>
                        <li>Critical/High severity bugs display error overlays to prospects</li>
                      </ul>
                      <p className="text-sm text-yellow-800 mt-3">
                        <strong>Note:</strong> These settings affect the client-side behavior. Changes take effect
                        when prospects load a new demo session.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === '2fa' ? (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Two-Factor Authentication</h2>

                {!show2FASetup ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Add an extra layer of security to your account by enabling two-factor
                      authentication.
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={setup2FA}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Setup 2FA
                      </button>
                      <button
                        onClick={disable2FA}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Disable 2FA
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="font-bold text-blue-900 mb-4">Step 1: Scan QR Code</h3>
                      <p className="text-blue-800 mb-4">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy,
                        etc.)
                      </p>
                      {qrCode && (
                        <div className="bg-white p-4 rounded-lg inline-block">
                          <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
                        </div>
                      )}
                      <p className="text-sm text-blue-700 mt-4">
                        Or enter this code manually:{' '}
                        <code className="bg-white px-2 py-1 rounded">{secret}</code>
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h3 className="font-bold text-gray-900 mb-4">Step 2: Verify Setup</h3>
                      <p className="text-gray-700 mb-4">
                        Enter the 6-digit code from your authenticator app to complete setup
                      </p>
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={verifyToken}
                          onChange={(e) => setVerifyToken(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center text-2xl tracking-widest"
                          placeholder="000000"
                          maxLength={6}
                        />
                        <button
                          onClick={enable2FA}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Verify & Enable
                        </button>
                      </div>
                      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                    </div>

                    <button
                      onClick={() => {
                        setShow2FASetup(false);
                        setVerifyToken('');
                        setError('');
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      ← Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading...</p>
              </div>
            ) : activeTab === 'sessions' ? (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Active Sessions</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCreateSession(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      + Create Session
                    </button>
                    <button
                      onClick={fetchSessions}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {sessions.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No active sessions</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Subdomain
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Company
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Bugs
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Events
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Created
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Expires
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sessions.map((session) => (
                          <tr key={session.subdomain} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-700">{session.subdomain}</div>
                                <div className="flex gap-2 text-xs">
                                  <a
                                    href={getDemoUrl('kazbank', session.subdomain)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    KazBank
                                  </a>
                                  <span className="text-gray-400">•</span>
                                  <a
                                    href={getDemoUrl('talentflow', session.subdomain)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:underline"
                                  >
                                    TalentFlow
                                  </a>
                                  <span className="text-gray-400">•</span>
                                  <a
                                    href={getDemoUrl('quickmart', session.subdomain)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-600 hover:underline"
                                  >
                                    QuickMart
                                  </a>
                                  <span className="text-gray-400">•</span>
                                  <a
                                    href={getDemoUrl('kazbank', session.subdomain, '/dashboard')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:underline"
                                  >
                                    Dashboard
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{session.company}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                                {session.bugs}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{session.events}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatTime(session.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatTime(session.expiresAt)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => deleteSession(session.subdomain)}
                                className="text-red-600 hover:text-red-700 font-medium"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">All Bugs</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCreateBug(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      + Create Bug
                    </button>
                    <button
                      onClick={fetchBugs}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {bugStats && (
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Bugs</p>
                      <p className="text-2xl font-bold text-gray-800">{bugStats.total}</p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-4">
                      <p className="text-sm text-red-700">Critical</p>
                      <p className="text-2xl font-bold text-red-800">{bugStats.critical}</p>
                    </div>
                    <div className="bg-orange-100 rounded-lg p-4">
                      <p className="text-sm text-orange-700">High</p>
                      <p className="text-2xl font-bold text-orange-800">{bugStats.high}</p>
                    </div>
                    <div className="bg-yellow-100 rounded-lg p-4">
                      <p className="text-sm text-yellow-700">Medium/Low</p>
                      <p className="text-2xl font-bold text-yellow-800">
                        {bugStats.medium + bugStats.low}
                      </p>
                    </div>
                  </div>
                )}

                {bugs.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No bugs captured yet</p>
                ) : (
                  <div className="space-y-3">
                    {bugs.map((bug) => (
                      <div
                        key={bug.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(
                                  bug.severity
                                )}`}
                              >
                                {bug.severity.toUpperCase()}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                {bug.demo.toUpperCase()}
                              </span>
                              <Link
                                href={`/${bug.subdomain}/dashboard`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {bug.subdomain}
                              </Link>
                            </div>
                            <p className="font-medium text-gray-800 mb-1">{bug.errorMessage}</p>
                            {bug.elementId && (
                              <p className="text-sm text-gray-600">Element: #{bug.elementId}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{formatTime(bug.timestamp)}</span>
                        </div>
                        {bug.stackTrace && (
                          <details className="mt-2">
                            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                              View Stack Trace
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                              {bug.stackTrace}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Bug Modal */}
      {showCreateBug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Create New Bug</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manually inject a bug into a demo session for testing purposes
              </p>
            </div>

            <form onSubmit={createBug} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subdomain <span className="text-red-500">*</span>
                </label>
                
                {!useCustomSubdomain && sessions.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={newBug.subdomain}
                      onChange={(e) => setNewBug({ ...newBug, subdomain: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="">Select a session...</option>
                      {sessions.map((session) => (
                        <option key={session.subdomain} value={session.subdomain}>
                          {session.subdomain} ({session.company})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setUseCustomSubdomain(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Use custom subdomain instead
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newBug.subdomain}
                      onChange={(e) => setNewBug({ ...newBug, subdomain: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., acme-demo"
                      required
                    />
                    {sessions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomSubdomain(false);
                          setNewBug({ ...newBug, subdomain: '' });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        ← Select from existing sessions
                      </button>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  The session subdomain where this bug should appear
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Demo Site <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newBug.demo}
                    onChange={(e) =>
                      setNewBug({
                        ...newBug,
                        demo: e.target.value as 'kazbank' | 'talentflow' | 'quickmart',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="kazbank">KazBank (Banking)</option>
                    <option value="talentflow">TalentFlow (HR)</option>
                    <option value="quickmart">QuickMart (E-commerce)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newBug.severity}
                    onChange={(e) =>
                      setNewBug({
                        ...newBug,
                        severity: e.target.value as 'low' | 'medium' | 'high' | 'critical',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Message <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBug.errorMessage}
                  onChange={(e) => setNewBug({ ...newBug, errorMessage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Payment processing failed - Card declined"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Element ID (optional)
                </label>
                <input
                  type="text"
                  value={newBug.elementId}
                  onChange={(e) => setNewBug({ ...newBug, elementId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., checkout-btn"
                />
                <p className="text-xs text-gray-500 mt-1">The HTML element ID that triggered the bug</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stack Trace (optional)
                </label>
                <textarea
                  value={newBug.stackTrace}
                  onChange={(e) => setNewBug({ ...newBug, stackTrace: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  placeholder="Error: Payment declined&#10;    at processPayment (payment.ts:45)&#10;    at handleCheckout (checkout.ts:123)"
                  rows={4}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Bug
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateBug(false);
                    setUseCustomSubdomain(false);
                    setError('');
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Create New Session</h2>
              <p className="text-sm text-gray-600 mt-1">
                Create a new demo session for a company
              </p>
            </div>

            <form onSubmit={createSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSessionCompany}
                  onChange={(e) => setNewSessionCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., ACME Corp"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  A subdomain will be generated automatically
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={sessionCreating}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {sessionCreating ? 'Creating...' : 'Create Session'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateSession(false);
                    setNewSessionCompany('');
                    setError('');
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
