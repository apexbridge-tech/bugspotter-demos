'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BugInjector } from '@/lib/bug-injector';
import { initializeBugSpotter, fetchDemoApiKey } from '@/lib/sdk-config';
import { BugSpotterSDK } from '@/types/bug';

export const dynamic = 'force-dynamic';

export default function QuickMartDemo() {
  const [cartCount, setCartCount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
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
      const credentials = await fetchDemoApiKey(sessionId, 'quickmart');

      if (!credentials) {
        console.warn('⚠️ No API key found for QuickMart demo, continuing without SDK');
        return null;
      }

      const bugspotterSDK = await initializeBugSpotter(credentials.apiKey, credentials.projectId, sessionId);

      if (bugspotterSDK) {
        console.info('✅ BugSpotter SDK ready for QuickMart demo');
      } else {
        console.warn('⚠️ BugSpotter SDK initialization failed, continuing with demo only');
      }

      return bugspotterSDK;
    };

    let sdkInstance: BugSpotterSDK | null = null;

    const initializeInjector = async () => {
      // Wait for SDK to initialize first
      const sdk = await initializeSDK();
      sdkInstance = sdk;

      try {
        const response = await fetch('/api/injector/config');
        const data = await response.json();

        const config =
          data.success && data.config ? data.config : { enabled: true, probability: 30 };

        if (!config.enabled) {
          console.log('[BugInjector] Disabled by admin');
          return;
        }

        const injector = new BugInjector(config.probability / 100, sdk);

        // Register bugs
        injector.registerBug({
          type: 'duplicate',
          elementId: 'add-to-cart-1',
          message: 'Cart race condition: Item added twice due to rapid double-click',
          severity: 'medium',
          demo: 'quickmart',
        });

        injector.registerBug({
          type: 'freeze',
          elementId: 'checkout-btn',
          message: 'Payment processor freeze: Gateway connection timeout after 30 seconds',
          severity: 'critical',
          demo: 'quickmart',
          delay: 2000,
        });

        injector.registerBug({
          type: 'crash',
          elementId: 'search-products',
          message: 'Search parser crashed: Special character "$" caused unhandled exception',
          severity: 'high',
          demo: 'quickmart',
        });

        injector.registerBug({
          type: 'network-error',
          elementId: 'product-image-1',
          message: 'Image lazy load failed: CDN timeout for product-image-12345.jpg',
          severity: 'low',
          demo: 'quickmart',
        });

        injector.registerBug({
          type: 'validation-error',
          elementId: 'apply-promo',
          message: 'Promo code validation failed: "DEMO50" exists but discount not calculated',
          severity: 'high',
          demo: 'quickmart',
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

  const handleAddToCart = () => {
    setCartCount((prev) => prev + 2); // Intentionally adds 2 (bug simulation)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <h1 className="text-2xl font-bold">QuickMart</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Try searching with special characters like $..."
                    className="w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <button
                    id="search-products"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
              <button className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Promo Banner */}
      <div className="bg-black text-white py-3">
        <div className="container mx-auto px-6 text-center">
          <p className="font-semibold">
            🎉 Use code <span className="bg-orange-600 px-2 py-1 rounded">DEMO50</span> for 50% off!
            (Bug: doesn't actually apply)
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h3 className="font-bold text-gray-800 mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-700 mb-2">Category</p>
                  <div className="space-y-2">
                    {['Electronics', 'Clothing', 'Home & Garden', 'Sports'].map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-orange-600" />
                        <span className="text-sm text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Price Range</p>
                  <input type="range" className="w-full" />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>$0</span>
                    <span>$500</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Rating</p>
                  <div className="space-y-1">
                    {[5, 4, 3].map((stars) => (
                      <label key={stars} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-orange-600" />
                        <span className="text-sm text-gray-700">{'⭐'.repeat(stars)} & up</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Best Rated</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Wireless Headphones', price: 89.99, rating: 4.5, image: '🎧' },
                { name: 'Smart Watch Pro', price: 299.99, rating: 4.8, image: '⌚' },
                { name: 'Laptop Stand', price: 49.99, rating: 4.3, image: '💻' },
                { name: 'Ergonomic Mouse', price: 59.99, rating: 4.6, image: '🖱️' },
                { name: 'Mechanical Keyboard', price: 129.99, rating: 4.7, image: '⌨️' },
                { name: 'USB-C Hub', price: 39.99, rating: 4.4, image: '🔌' },
              ].map((product, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div
                    id={i === 0 ? 'product-image-1' : undefined}
                    className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-6xl cursor-pointer hover:scale-105 transition-transform"
                  >
                    {product.image}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-yellow-500 text-sm">
                        {'⭐'.repeat(Math.floor(product.rating))}
                      </div>
                      <span className="text-xs text-gray-600">({product.rating})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-800">${product.price}</span>
                      <button
                        id={i === 0 ? 'add-to-cart-1' : undefined}
                        onClick={handleAddToCart}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Section */}
            <div className="mt-8 bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Checkout</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter promo code DEMO50"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <button
                    id="apply-promo"
                    onClick={() => setPromoApplied(true)}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoApplied && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">
                      ⚠️ Promo code accepted but discount not applied (Bug)
                    </p>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">$459.94</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">$9.99</span>
                  </div>
                  <div className="flex justify-between mb-4 text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-orange-600">$469.93</span>
                  </div>
                  <button
                    id="checkout-btn"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16 py-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold mb-3">About QuickMart</h4>
              <p className="text-gray-400 text-sm">
                Your one-stop shop for all things tech and lifestyle.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Customer Service</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Returns
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Shipping Info
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Press
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Connect</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                >
                  f
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                >
                  t
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                >
                  in
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
            <p>&copy; 2025 QuickMart. All rights reserved. Demo site with intentional bugs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
