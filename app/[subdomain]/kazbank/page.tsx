'use client';

import { useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { BugInjector } from '@/lib/bug-injector';

export default function KazBankDemo() {
  useEffect(() => {
    // Fetch injector configuration and initialize
    const initializeInjector = async () => {
      try {
        const response = await fetch('/api/injector/config');
        const data = await response.json();
        
        const config = data.success && data.config ? data.config : { enabled: true, probability: 30 };
        
        // Don't initialize if disabled
        if (!config.enabled) {
          console.log('[BugInjector] Disabled by admin');
          return;
        }
        
        const injector = new BugInjector(config.probability / 100);

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
      } catch (error) {
        console.error('[BugInjector] Failed to load config:', error);
      }
    };
    
    initializeInjector();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-green-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center font-bold text-2xl text-white">
                  БЦК
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">KazBank</h1>
                  <p className="text-xs text-gray-500">Your Trusted Banking Partner</p>
                </div>
              </div>
            </div>
            <button
              id="mobile-menu-toggle"
              className="lg:hidden px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Menu
            </button>
            <nav className="hidden lg:flex gap-6">
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
                Счета
              </a>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
                Переводы
              </a>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
                Карты
              </a>
              <a href="#" className="text-gray-700 hover:text-green-600 transition-colors font-medium">
                Кредиты
              </a>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                Выход
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Overview */}
            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-600">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Мои счета</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white shadow-lg">
                  <p className="text-green-100 text-sm mb-2">Текущий счет</p>
                  <p className="text-3xl font-bold">₸ 4,589,320</p>
                  <p className="text-green-200 text-sm mt-2">KZ12 3456 7890 1234</p>
                  <div className="mt-4 flex gap-2">
                    <div className="text-xs bg-green-800 bg-opacity-50 px-2 py-1 rounded">VISA</div>
                    <div className="text-xs bg-green-800 bg-opacity-50 px-2 py-1 rounded">Активна</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg p-6 text-white shadow-lg">
                  <p className="text-gray-300 text-sm mb-2">Сберегательный счет</p>
                  <p className="text-3xl font-bold">₸ 8,230,180</p>
                  <p className="text-gray-300 text-sm mt-2">KZ98 7654 3210 5678</p>
                  <div className="mt-4 flex gap-2">
                    <div className="text-xs bg-gray-800 bg-opacity-50 px-2 py-1 rounded">7.5% годовых</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Transfer */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-green-600">💸</span>
                Быстрый перевод
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Счет получателя
                  </label>
                  <input
                    type="text"
                    placeholder="KZ__ ____ ____ ____"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Сумма</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₸</span>
                  </div>
                </div>
                <button
                  id="transfer-btn"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Перевести
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Последние операции</h2>
                <button
                  id="download-statement"
                  className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                >
                  <span>📄</span>
                  Выписка
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Kaspi.kz', amount: '-₸ 28,900', date: '25 окт' },
                  { name: 'Зарплата', amount: '+₸ 520,000', date: '24 окт' },
                  { name: 'Magnum', amount: '-₸ 12,340', date: '23 окт' },
                  { name: 'Алматы Энерго', amount: '-₸ 8,500', date: '22 окт' },
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
            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-600">
              <h3 className="font-bold text-gray-800 mb-4">Конвертер валют</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Из</label>
                  <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all">
                    <option>USD - Доллар США</option>
                    <option>EUR - Евро</option>
                    <option>KZT - Тенге</option>
                    <option>RUB - Рубль</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">В</label>
                  <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all">
                    <option>KZT - Тенге</option>
                    <option>EUR - Евро</option>
                    <option>USD - Доллар США</option>
                    <option>RUB - Рубль</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Сумма</label>
                  <input
                    type="number"
                    placeholder="1000"
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <button
                  id="convert-currency"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
                >
                  Конвертировать
                </button>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600">Курс обмена</div>
                  <div className="text-lg font-bold text-gray-800">1 USD = 475.50 ₸</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Быстрые действия</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors border-2 border-gray-100 hover:border-green-200">
                  <div className="font-medium text-gray-800">💳 Оплата услуг</div>
                  <div className="text-xs text-gray-500">Коммунальные, интернет, ТВ</div>
                </button>
                <button id="login-submit" className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors border-2 border-gray-100 hover:border-green-200">
                  <div className="font-medium text-gray-800">🔐 Настройки карт</div>
                  <div className="text-xs text-gray-500">Управление картами</div>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors border-2 border-gray-100 hover:border-green-200">
                  <div className="font-medium text-gray-800">📞 Поддержка 24/7</div>
                  <div className="text-xs text-gray-500">Онлайн консультация</div>
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
