'use client';

import { useEffect } from 'react';
import { BugInjector } from '@/lib/bug-injector';

export default function KazBankDemo() {
  useEffect(() => {
    // Initialize bug injector
    const injector = new BugInjector(0.3); // 30% probability

    // Register bugs
    injector.registerBug({
      type: 'timeout',
      elementId: 'transfer-btn',
      message: 'Transaction timeout: Unable to complete transfer after 5 seconds',
      severity: 'high',
      demo: 'kazbank',
      delay: 5000, // 5 second delay
    });

    injector.registerBug({
      type: 'corruption',
      elementId: 'download-statement',
      message: 'PDF generation failed: File corruption detected in statement export',
      severity: 'medium',
      demo: 'kazbank',
      delay: 2000,
    });

    injector.registerBug({
      type: 'calculation-error',
      elementId: 'convert-currency',
      message: 'Exchange rate calculation error: Invalid result for amount 1234.56',
      severity: 'critical',
      demo: 'kazbank',
    });

    injector.registerBug({
      type: 'validation-error',
      elementId: 'login-submit',
      message: '2FA validation failed: OTP verification service unavailable',
      severity: 'high',
      demo: 'kazbank',
    });

    injector.registerBug({
      type: 'layout-break',
      elementId: 'mobile-menu-toggle',
      message: 'Navigation render error: Mobile menu overflow causing layout collapse',
      severity: 'medium',
      demo: 'kazbank',
    });

    injector.initialize();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
                K
              </div>
              <h1 className="text-2xl font-bold">KazBank</h1>
            </div>
            <button
              id="mobile-menu-toggle"
              className="lg:hidden px-4 py-2 bg-blue-800 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Menu
            </button>
            <nav className="hidden lg:flex gap-6">
              <a href="#" className="hover:text-blue-300 transition-colors">
                Accounts
              </a>
              <a href="#" className="hover:text-blue-300 transition-colors">
                Transfers
              </a>
              <a href="#" className="hover:text-blue-300 transition-colors">
                Cards
              </a>
              <a href="#" className="hover:text-blue-300 transition-colors">
                Loans
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Overview */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Account Overview</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white">
                  <p className="text-blue-100 text-sm mb-2">Checking Account</p>
                  <p className="text-3xl font-bold">$24,589.32</p>
                  <p className="text-blue-200 text-sm mt-2">****1234</p>
                </div>
                <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg p-6 text-white">
                  <p className="text-gray-300 text-sm mb-2">Savings Account</p>
                  <p className="text-3xl font-bold">$45,230.18</p>
                  <p className="text-gray-300 text-sm mt-2">****5678</p>
                </div>
              </div>
            </div>

            {/* Quick Transfer */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Transfer</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Account
                  </label>
                  <input
                    type="text"
                    placeholder="Enter account number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <button
                  id="transfer-btn"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Transfer Funds
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
                <button
                  id="download-statement"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Download Statement
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Amazon.com', amount: '-$89.99', date: 'Oct 25' },
                  { name: 'Salary Deposit', amount: '+$5,200.00', date: 'Oct 24' },
                  { name: 'Netflix', amount: '-$15.99', date: 'Oct 23' },
                  { name: 'Starbucks', amount: '-$6.45', date: 'Oct 22' },
                ].map((tx, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{tx.name}</p>
                      <p className="text-sm text-gray-500">{tx.date}</p>
                    </div>
                    <span
                      className={`font-semibold ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-gray-700'}`}
                    >
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Currency Converter */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Currency Converter</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option>EUR</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Amount</label>
                  <input
                    type="number"
                    placeholder="1234.56"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  id="convert-currency"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Convert
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                  <div className="font-medium text-gray-800">Pay Bills</div>
                  <div className="text-xs text-gray-500">Manage your payments</div>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                  <div className="font-medium text-gray-800">Card Settings</div>
                  <div className="text-xs text-gray-500">Manage your cards</div>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                  <div className="font-medium text-gray-800">Support</div>
                  <div className="text-xs text-gray-500">Get help</div>
                </button>
              </div>
            </div>

            {/* Login Form (for 2FA bug) */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Security Test</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="2FA Code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  id="login-submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Verify 2FA
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
