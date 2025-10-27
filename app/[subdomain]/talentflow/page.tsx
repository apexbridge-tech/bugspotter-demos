'use client';

import { useEffect, useState } from 'react';
import { BugInjector } from '@/lib/bug-injector';

export default function TalentFlowDemo() {
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Initialize bug injector
    const injector = new BugInjector(0.3);

    // Register bugs
    injector.registerBug({
      type: 'crash',
      elementId: 'search-candidates',
      message: 'Search query parser error: Unexpected token "senior" at position 0',
      severity: 'high',
      demo: 'talentflow',
    });

    injector.registerBug({
      type: 'freeze',
      elementId: 'upload-resume',
      message: 'File upload stalled: Progress frozen at 99% for resume.pdf',
      severity: 'critical',
      demo: 'talentflow',
      delay: 3000,
    });

    injector.registerBug({
      type: 'calculation-error',
      elementId: 'schedule-interview',
      message: 'Timezone conversion failed: Invalid offset calculation for PST to EST',
      severity: 'high',
      demo: 'talentflow',
    });

    injector.registerBug({
      type: 'duplicate',
      elementId: 'send-bulk-email',
      message: 'Email queue race condition: Duplicate messages sent to 47 candidates',
      severity: 'critical',
      demo: 'talentflow',
    });

    injector.registerBug({
      type: 'corruption',
      elementId: 'export-excel',
      message: 'Excel export corrupted: Invalid cell format in candidate data export',
      severity: 'medium',
      demo: 'talentflow',
    });

    injector.initialize();
  }, []);

  const handleUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 99) {
          clearInterval(interval);
          return 99; // Stuck at 99%
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center font-bold text-white text-xl">
                T
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                TalentFlow
              </h1>
            </div>
            <nav className="hidden md:flex gap-6">
              <a
                href="#"
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                Candidates
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                Jobs
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                Analytics
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <p className="text-gray-600 text-sm mb-1">Active Candidates</p>
                <p className="text-3xl font-bold text-gray-800">342</p>
                <p className="text-green-600 text-sm mt-1">↑ 12% this week</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <p className="text-gray-600 text-sm mb-1">Open Positions</p>
                <p className="text-3xl font-bold text-gray-800">28</p>
                <p className="text-gray-500 text-sm mt-1">Across 5 departments</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <p className="text-gray-600 text-sm mb-1">Interviews Today</p>
                <p className="text-3xl font-bold text-gray-800">9</p>
                <p className="text-purple-600 text-sm mt-1">3 pending confirmation</p>
              </div>
            </div>

            {/* Candidate Search */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Search Candidates</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Try searching for 'senior' to trigger bug..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <button
                    id="search-candidates"
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Search
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    JavaScript
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    React
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    Senior
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    Remote
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Candidates */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Candidates</h2>
              <div className="space-y-4">
                {[
                  {
                    name: 'Sarah Johnson',
                    role: 'Senior Frontend Developer',
                    status: 'Interview Scheduled',
                    avatar: 'SJ',
                  },
                  {
                    name: 'Michael Chen',
                    role: 'UX Designer',
                    status: 'Under Review',
                    avatar: 'MC',
                  },
                  {
                    name: 'Emily Rodriguez',
                    role: 'Product Manager',
                    status: 'Phone Screen',
                    avatar: 'ER',
                  },
                  {
                    name: 'David Kim',
                    role: 'Backend Engineer',
                    status: 'New Application',
                    avatar: 'DK',
                  },
                ].map((candidate, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {candidate.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{candidate.name}</p>
                        <p className="text-sm text-gray-600">{candidate.role}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {candidate.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Bulk Actions</h2>
              <div className="space-y-3">
                <button
                  id="send-bulk-email"
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-left flex items-center justify-between"
                >
                  <span>Send Assessment Email to Selected Candidates</span>
                  <span className="text-sm bg-purple-500 px-2 py-1 rounded">47 selected</span>
                </button>
                <button
                  id="export-excel"
                  className="w-full px-4 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold rounded-lg transition-colors"
                >
                  Export Candidates to Excel
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resume Upload */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Upload Resume</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">Drop files or click to browse</p>
                </div>
                <button
                  id="upload-resume"
                  onClick={handleUpload}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Upload Resume
                </button>
                {uploadProgress > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Uploading...</span>
                      <span className="text-purple-600 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interview Scheduler */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Schedule Interview</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Candidate</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500">
                    <option>Sarah Johnson</option>
                    <option>Michael Chen</option>
                    <option>Emily Rodriguez</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Timezone</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500">
                    <option>PST (Pacific)</option>
                    <option>EST (Eastern)</option>
                    <option>CST (Central)</option>
                  </select>
                </div>
                <button
                  id="schedule-interview"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Schedule Interview
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md p-6 text-white">
              <h3 className="font-bold mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-100">Applications</span>
                  <span className="font-bold">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Interviews</span>
                  <span className="font-bold">42</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Offers Sent</span>
                  <span className="font-bold">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Hires</span>
                  <span className="font-bold">5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
