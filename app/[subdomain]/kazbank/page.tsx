'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { BugInjector } from '@/lib/bug-injector';
import { initializeBugSpotter, fetchDemoApiKey } from '@/lib/sdk-config';
import { BugSpotterSDK } from '@/types/bug';

type Language = 'en' | 'kk' | 'ru';

const translations = {
  en: {
    tagline: 'Your Trusted Banking Partner',
    menu: 'Menu',
    accounts: 'Accounts',
    transfers: 'Transfers',
    cards: 'Cards',
    loans: 'Loans',
    logout: 'Logout',
    myAccounts: 'My Accounts',
    currentAccount: 'Current Account',
    active: 'Active',
    savingsAccount: 'Savings Account',
    perAnnum: 'per annum',
    quickTransfer: 'Quick Transfer',
    recipientAccount: 'Recipient Account',
    amount: 'Amount',
    transfer: 'Transfer',
    recentTransactions: 'Recent Transactions',
    statement: 'Statement',
    salary: 'Salary',
    currencyConverter: 'Currency Converter',
    from: 'From',
    to: 'To',
    convert: 'Convert',
    exchangeRate: 'Exchange Rate',
    quickActions: 'Quick Actions',
    payBills: 'Pay Bills',
    utilities: 'Utilities, Internet, TV',
    cardSettings: 'Card Settings',
    manageCards: 'Manage Cards',
    support: '24/7 Support',
    onlineConsultation: 'Online Consultation',
    securityTest: 'Security Test',
    twoFACode: '2FA Code',
    verify2FA: 'Verify 2FA',
    usd: 'USD - US Dollar',
    eur: 'EUR - Euro',
    kzt: 'KZT - Tenge',
    rub: 'RUB - Ruble',
  },
  kk: {
    tagline: 'Сенімді банктік серіктесіңіз',
    menu: 'Мәзір',
    accounts: 'Шоттар',
    transfers: 'Аударымдар',
    cards: 'Карталар',
    loans: 'Несиелер',
    logout: 'Шығу',
    myAccounts: 'Менің шоттарым',
    currentAccount: 'Ағымдағы шот',
    active: 'Белсенді',
    savingsAccount: 'Жинақ шоты',
    perAnnum: 'жылына',
    quickTransfer: 'Жылдам аударым',
    recipientAccount: 'Алушы шоты',
    amount: 'Сома',
    transfer: 'Аудару',
    recentTransactions: 'Соңғы операциялар',
    statement: 'Үзінді',
    salary: 'Жалақы',
    currencyConverter: 'Валюта конвертері',
    from: 'Бастап',
    to: 'Дейін',
    convert: 'Конвертациялау',
    exchangeRate: 'Айырбас бағамы',
    quickActions: 'Жылдам әрекеттер',
    payBills: 'Қызметтерді төлеу',
    utilities: 'Коммуналдық, интернет, ТВ',
    cardSettings: 'Карта баптаулары',
    manageCards: 'Карталарды басқару',
    support: '24/7 Қолдау',
    onlineConsultation: 'Онлайн кеңес',
    securityTest: 'Қауіпсіздік тесті',
    twoFACode: '2FA коды',
    verify2FA: '2FA тексеру',
    usd: 'USD - АҚШ доллары',
    eur: 'EUR - Евро',
    kzt: 'KZT - Теңге',
    rub: 'RUB - Рубль',
  },
  ru: {
    tagline: 'Ваш надежный банковский партнер',
    menu: 'Меню',
    accounts: 'Счета',
    transfers: 'Переводы',
    cards: 'Карты',
    loans: 'Кредиты',
    logout: 'Выход',
    myAccounts: 'Мои счета',
    currentAccount: 'Текущий счет',
    active: 'Активна',
    savingsAccount: 'Сберегательный счет',
    perAnnum: 'годовых',
    quickTransfer: 'Быстрый перевод',
    recipientAccount: 'Счет получателя',
    amount: 'Сумма',
    transfer: 'Перевести',
    recentTransactions: 'Последние операции',
    statement: 'Выписка',
    salary: 'Зарплата',
    currencyConverter: 'Конвертер валют',
    from: 'Из',
    to: 'В',
    convert: 'Конвертировать',
    exchangeRate: 'Курс обмена',
    quickActions: 'Быстрые действия',
    payBills: 'Оплата услуг',
    utilities: 'Коммунальные, интернет, ТВ',
    cardSettings: 'Настройки карт',
    manageCards: 'Управление картами',
    support: 'Поддержка 24/7',
    onlineConsultation: 'Онлайн консультация',
    securityTest: 'Тест безопасности',
    twoFACode: '2FA код',
    verify2FA: 'Проверить 2FA',
    usd: 'USD - Доллар США',
    eur: 'EUR - Евро',
    kzt: 'KZT - Тенге',
    rub: 'RUB - Рубль',
  },
};

export default function KazBankDemo() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  const params = useParams();
  const subdomain = params.subdomain as string;
  const sessionId = subdomain?.match(/^(?:kazbank|talentflow|quickmart)-(.+)$/)?.[1] || subdomain;

  useEffect(() => {
    // Initialize BugSpotter SDK with session API key
    const initializeSDK = async () => {
      if (!sessionId) {
        console.warn('⚠️ No session ID found, skipping BugSpotter SDK initialization');
        return null;
      }

      // Fetch API key for this demo from the session
      const apiKey = await fetchDemoApiKey(sessionId, 'kazbank');

      if (!apiKey) {
        console.warn('⚠️ No API key found for KazBank demo, continuing without SDK');
        return null;
      }

      const bugspotterSDK = await initializeBugSpotter(apiKey, sessionId);

      if (bugspotterSDK) {
        console.info('✅ BugSpotter SDK ready for KazBank demo');
      } else {
        console.warn('⚠️ BugSpotter SDK initialization failed, continuing with demo only');
      }

      return bugspotterSDK;
    };

    let sdkInstance: BugSpotterSDK | null = null;

    // Fetch injector configuration and initialize
    const initializeInjector = async () => {
      // Wait for SDK to initialize first
      const sdk = await initializeSDK();
      sdkInstance = sdk;

      try {
        const response = await fetch('/api/injector/config');
        const data = await response.json();

        const config =
          data.success && data.config ? data.config : { enabled: true, probability: 30 };

        // Don't initialize if disabled
        if (!config.enabled) {
          console.log('[BugInjector] Disabled by admin');
          return;
        }

        const injector = new BugInjector(config.probability / 100, sdk);

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

    // Cleanup function
    return () => {
      if (sdkInstance) {
        sdkInstance.destroy();
      }
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-green-600">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center font-bold text-2xl text-white">
                  KB
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">KazBank</h1>
                  <p className="text-xs text-gray-500">{t.tagline}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'ru'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  RU
                </button>
                <button
                  onClick={() => setLanguage('kk')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    language === 'kk'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ҚЗ
                </button>
              </div>
              <button
                id="mobile-menu-toggle"
                className="lg:hidden px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t.menu}
              </button>
            </div>
            <nav className="hidden lg:flex gap-6 items-center">
              <a
                href="#"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                {t.accounts}
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                {t.transfers}
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                {t.cards}
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                {t.loans}
              </a>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                {t.logout}
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
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t.myAccounts}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 text-white shadow-lg">
                  <p className="text-green-100 text-sm mb-2">{t.currentAccount}</p>
                  <p className="text-3xl font-bold">₸ 4,589,320</p>
                  <p className="text-green-200 text-sm mt-2">KZ12 3456 7890 1234</p>
                  <div className="mt-4 flex gap-2">
                    <div className="text-xs bg-green-800 bg-opacity-50 px-2 py-1 rounded">VISA</div>
                    <div className="text-xs bg-green-800 bg-opacity-50 px-2 py-1 rounded">
                      {t.active}
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg p-6 text-white shadow-lg">
                  <p className="text-gray-300 text-sm mb-2">{t.savingsAccount}</p>
                  <p className="text-3xl font-bold">₸ 8,230,180</p>
                  <p className="text-gray-300 text-sm mt-2">KZ98 7654 3210 5678</p>
                  <div className="mt-4 flex gap-2">
                    <div className="text-xs bg-gray-800 bg-opacity-50 px-2 py-1 rounded">
                      7.5% {t.perAnnum}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Transfer */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-green-600">💸</span>
                {t.quickTransfer}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.recipientAccount}
                  </label>
                  <input
                    type="text"
                    placeholder="KZ__ ____ ____ ____"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.amount}</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      ₸
                    </span>
                  </div>
                </div>
                <button
                  id="transfer-btn"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {t.transfer}
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">{t.recentTransactions}</h2>
                <button
                  id="download-statement"
                  className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                >
                  <span>📄</span>
                  {t.statement}
                </button>
              </div>
              <div className="space-y-3">
                {[
                  {
                    name: 'Kaspi.kz',
                    amount: '-₸ 28,900',
                    date: language === 'en' ? 'Oct 25' : language === 'ru' ? '25 окт' : '25 қаз',
                  },
                  {
                    name: t.salary,
                    amount: '+₸ 520,000',
                    date: language === 'en' ? 'Oct 24' : language === 'ru' ? '24 окт' : '24 қаз',
                  },
                  {
                    name: 'Magnum',
                    amount: '-₸ 12,340',
                    date: language === 'en' ? 'Oct 23' : language === 'ru' ? '23 окт' : '23 қаз',
                  },
                  {
                    name:
                      language === 'en'
                        ? 'Almaty Energy'
                        : language === 'ru'
                          ? 'Алматы Энерго'
                          : 'Алматы Энерго',
                    amount: '-₸ 8,500',
                    date: language === 'en' ? 'Oct 22' : language === 'ru' ? '22 окт' : '22 қаз',
                  },
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
              <h3 className="font-bold text-gray-800 mb-4">{t.currencyConverter}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">{t.from}</label>
                  <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all">
                    <option>{t.usd}</option>
                    <option>{t.eur}</option>
                    <option>{t.kzt}</option>
                    <option>{t.rub}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">{t.to}</label>
                  <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all">
                    <option>{t.kzt}</option>
                    <option>{t.eur}</option>
                    <option>{t.usd}</option>
                    <option>{t.rub}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">{t.amount}</label>
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
                  {t.convert}
                </button>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600">{t.exchangeRate}</div>
                  <div className="text-lg font-bold text-gray-800">1 USD = 475.50 ₸</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">{t.quickActions}</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors border-2 border-gray-100 hover:border-green-200">
                  <div className="font-medium text-gray-800">💳 {t.payBills}</div>
                  <div className="text-xs text-gray-500">{t.utilities}</div>
                </button>
                <button
                  id="login-submit"
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors border-2 border-gray-100 hover:border-green-200"
                >
                  <div className="font-medium text-gray-800">🔐 {t.cardSettings}</div>
                  <div className="text-xs text-gray-500">{t.manageCards}</div>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors border-2 border-gray-100 hover:border-green-200">
                  <div className="font-medium text-gray-800">📞 {t.support}</div>
                  <div className="text-xs text-gray-500">{t.onlineConsultation}</div>
                </button>
              </div>
            </div>

            {/* Login Form (for 2FA bug) */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">{t.securityTest}</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={t.twoFACode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  id="login-submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {t.verify2FA}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
