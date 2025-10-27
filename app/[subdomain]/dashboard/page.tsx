'use client';

import { useEffect, useState, useCallback } from 'react';

export const dynamic = 'force-dynamic';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Bug {
  id: string;
  timestamp: number;
  errorMessage: string;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  elementId?: string;
  demo: 'kazbank' | 'talentflow' | 'quickmart';
  userAgent?: string;
  screenshot?: string;
}

export default function DashboardPage() {
  const params = useParams();
  const subdomain = params.subdomain as string;
  
  // Extract session ID from subdomain (format: {demo}-{session} or just {session})
  const sessionId = subdomain.match(/^(?:kazbank|talentflow|quickmart)-(.+)$/)?.[1] || subdomain;
  
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);

  const fetchBugs = useCallback(async () => {
    try {
      const response = await fetch(`/api/bugs?subdomain=${sessionId}`);
      const data = await response.json();
      if (data.success) {
        setBugs(data.bugs);
      }
    } catch (error) {
      console.error('Error fetching bugs:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchBugs();
    // Poll for new bugs every 5 seconds
    const interval = setInterval(fetchBugs, 5000);
    return () => clearInterval(interval);
  }, [fetchBugs]);

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      medium: 'bg-orange-100 text-orange-800 border-orange-300',
      high: 'bg-red-100 text-red-800 border-red-300',
      critical: 'bg-red-200 text-red-900 border-red-400',
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const getDemoColor = (demo: string) => {
    const colors = {
      kazbank: 'bg-blue-100 text-blue-800',
      talentflow: 'bg-purple-100 text-purple-800',
      quickmart: 'bg-orange-100 text-orange-800',
    };
    return colors[demo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const groupByDemo = () => {
    const grouped: Record<string, Bug[]> = {
      kazbank: [],
      talentflow: [],
      quickmart: [],
    };
    bugs.forEach((bug) => {
      if (grouped[bug.demo]) {
        grouped[bug.demo].push(bug);
      }
    });
    return grouped;
  };

  const groupedBugs = groupByDemo();

  const getDemoUrl = (demo: string) => {
    const fullSubdomain = `${demo}-${sessionId}`;
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return `/${fullSubdomain}`;
    }
    return `https://${fullSubdomain}.demo.bugspotter.io`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bug reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">BugSpotter Dashboard</h1>
              <p className="text-sm text-gray-600">Session: {subdomain}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Bugs Captured</p>
                <p className="text-2xl font-bold text-red-600">{bugs.length}</p>
              </div>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600 text-sm mb-1">Total Bugs</p>
            <p className="text-3xl font-bold text-gray-800">{bugs.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600 text-sm mb-1">Critical</p>
            <p className="text-3xl font-bold text-red-600">
              {bugs.filter((b) => b.severity === 'critical').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600 text-sm mb-1">High Priority</p>
            <p className="text-3xl font-bold text-orange-600">
              {bugs.filter((b) => b.severity === 'high').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-600 text-sm mb-1">Medium/Low</p>
            <p className="text-3xl font-bold text-yellow-600">
              {bugs.filter((b) => b.severity === 'medium' || b.severity === 'low').length}
            </p>
          </div>
        </div>

        {/* Demo Links */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Demo Sites</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href={getDemoUrl('kazbank')}
              className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-blue-800">KazBank</h3>
                <span className="text-sm font-medium text-gray-600">
                  {groupedBugs.kazbank.length} bugs
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Banking demo with transfer, statement, and currency bugs
              </p>
            </a>
            <a
              href={getDemoUrl('talentflow')}
              className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-purple-800">TalentFlow</h3>
                <span className="text-sm font-medium text-gray-600">
                  {groupedBugs.talentflow.length} bugs
                </span>
              </div>
              <p className="text-sm text-gray-600">
                HR demo with search, upload, and scheduling bugs
              </p>
            </a>
            <a
              href={getDemoUrl('quickmart')}
              className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-orange-800">QuickMart</h3>
                <span className="text-sm font-medium text-gray-600">
                  {groupedBugs.quickmart.length} bugs
                </span>
              </div>
              <p className="text-sm text-gray-600">
                E-commerce demo with cart, checkout, and promo bugs
              </p>
            </a>
          </div>
        </div>

        {/* Bug List */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Captured Bugs</h2>
          </div>

          {bugs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🐛</div>
              <p className="text-gray-600 mb-2">No bugs captured yet</p>
              <p className="text-sm text-gray-500">
                Visit one of the demo sites above to trigger bugs
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bugs.map((bug) => (
                <div
                  key={bug.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedBug(bug)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getDemoColor(bug.demo)}`}
                        >
                          {bug.demo.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(bug.severity)}`}
                        >
                          {bug.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{formatTime(bug.timestamp)}</span>
                      </div>
                      <p className="font-medium text-gray-800 mb-1">{bug.errorMessage}</p>
                      {bug.elementId && (
                        <p className="text-sm text-gray-600">Element: #{bug.elementId}</p>
                      )}
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bug Detail Modal */}
      {selectedBug && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedBug(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Bug Details</h3>
              <button
                onClick={() => setSelectedBug(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Error Message</label>
                <p className="mt-1 text-gray-800 font-mono text-sm bg-red-50 p-3 rounded border border-red-200">
                  {selectedBug.errorMessage}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Severity</label>
                  <p
                    className={`mt-1 inline-block px-3 py-1 rounded text-sm font-semibold border ${getSeverityColor(selectedBug.severity)}`}
                  >
                    {selectedBug.severity.toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Demo Site</label>
                  <p
                    className={`mt-1 inline-block px-3 py-1 rounded text-sm font-semibold ${getDemoColor(selectedBug.demo)}`}
                  >
                    {selectedBug.demo.toUpperCase()}
                  </p>
                </div>
              </div>
              {selectedBug.elementId && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Element ID</label>
                  <p className="mt-1 text-gray-800 font-mono text-sm">#{selectedBug.elementId}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Timestamp</label>
                <p className="mt-1 text-gray-800">
                  {new Date(selectedBug.timestamp).toLocaleString()}
                </p>
              </div>
              {selectedBug.stackTrace && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Stack Trace</label>
                  <pre className="mt-1 text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                    {selectedBug.stackTrace}
                  </pre>
                </div>
              )}
              {selectedBug.userAgent && (
                <div>
                  <label className="text-sm font-medium text-gray-600">User Agent</label>
                  <p className="mt-1 text-xs text-gray-600 break-all">{selectedBug.userAgent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
