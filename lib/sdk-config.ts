/**
 * BugSpotter SDK initialization and configuration
 * Handles SDK setup with proper error handling and fallbacks
 */

import type { BugSpotterSDK } from '@/types/bug';

/**
 * Initialize BugSpotter SDK with API key from session
 * @param apiKey - The API key for the specific demo project
 * @param sessionId - The session ID for tracking
 */
export async function initializeBugSpotter(
  apiKey: string,
  sessionId?: string
): Promise<BugSpotterSDK | null> {
  // Check if SDK is disabled
  if (process.env.NEXT_PUBLIC_BUGSPOTTER_ENABLED === 'false') {
    console.info('🐛 BugSpotter SDK disabled via environment variable');
    return null;
  }

  if (typeof window === 'undefined') {
    console.warn('🐛 BugSpotter SDK can only be initialized in browser environment');
    return null;
  }

  if (!apiKey) {
    console.warn('🐛 BugSpotter SDK: No API key provided, SDK not initialized');
    return null;
  }

  try {
    // Use the real BugSpotter SDK
    const { BugSpotter } = await import('@bugspotter/sdk');

    console.info('🐛 Initializing BugSpotter SDK...');
    console.info('🔑 API Key:', apiKey.substring(0, 10) + '...');

    // Initialize SDK with API key and auth configuration
    const instance = BugSpotter.init({
      endpoint: `${process.env.NEXT_PUBLIC_BUGSPOTTER_API}/api/v1/reports`,
      auth: {
        type: 'api-key',
        apiKey,
      },
      showWidget: true, // Show floating bug report button
      widgetOptions: {
        position: 'bottom-right',
      },
      replay: {
        enabled: true,
        duration: 15,
        sampling: {
          mousemove: 100,
          scroll: 200,
        },
      },
      sanitize: {
        enabled: true,
        patterns: ['email', 'phone'],
      },
    });

    console.info('✅ BugSpotter SDK initialized successfully');
    console.info('🎨 Widget enabled: true');
    console.info('📍 Widget position: bottom-right');
    if (sessionId) {
      console.info('📊 Session ID:', sessionId);
    }
    console.info('📊 SDK Config:', instance.getConfig());

    return instance as BugSpotterSDK;
  } catch (error) {
    console.error('❌ Failed to initialize BugSpotter SDK:', error);
    return null;
  }
}

/**
 * Fetch API key for a specific demo site from the session
 * @param sessionId - The session ID
 * @param demo - The demo site name (kazbank, talentflow, quickmart)
 */
export async function fetchDemoApiKey(
  sessionId: string,
  demo: 'kazbank' | 'talentflow' | 'quickmart'
): Promise<string | null> {
  try {
    console.log('[fetchDemoApiKey] Fetching API key for:', { sessionId, demo });
    const response = await fetch(`/api/demo/get-api-key?sessionId=${sessionId}&demo=${demo}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[fetchDemoApiKey] Failed to fetch API key for ${demo}:`, response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('[fetchDemoApiKey] API key fetched successfully:', {
      demo,
      projectId: data.projectId,
      projectName: data.projectName,
      apiKeyPrefix: data.apiKey?.substring(0, 10) + '...'
    });
    
    return data.apiKey || null;
  } catch (error) {
    console.error('[fetchDemoApiKey] Error fetching demo API key:', error);
    return null;
  }
}

/**
 * Generate a session ID based on subdomain or create a new one
 */
export function generateSessionId(subdomain?: string): string {
  if (subdomain) {
    return subdomain;
  }

  // Generate random session ID for development
  return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get demo type from current URL or subdomain
 */
export function getDemoType(): 'kazbank' | 'talentflow' | 'quickmart' {
  if (typeof window === 'undefined') return 'kazbank';

  const pathname = window.location.pathname;
  const hostname = window.location.hostname;

  // Check subdomain (for production)
  if (hostname.includes('kazbank')) return 'kazbank';
  if (hostname.includes('talentflow')) return 'talentflow';
  if (hostname.includes('quickmart')) return 'quickmart';

  // Check pathname (for development)
  if (pathname.includes('kazbank')) return 'kazbank';
  if (pathname.includes('talentflow')) return 'talentflow';
  if (pathname.includes('quickmart')) return 'quickmart';

  return 'kazbank'; // default
}
