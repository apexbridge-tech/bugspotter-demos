/**
 * API client for communicating with BugSpotter backend
 * Handles bug reporting, session management, and Jira integration
 */

import type {
  BugReport,
  BugReportResponse,
  BugFilter,
  Session,
  JiraTicketResponse,
  BugStats,
} from '@/types/bug';

export class BugSpotterAPIClient {
  private apiEndpoint: string;
  private apiKey: string;
  private sessionId?: string;

  constructor(apiEndpoint: string, apiKey: string, sessionId?: string) {
    this.apiEndpoint = apiEndpoint.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.sessionId = sessionId;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { retry?: boolean } = {}
  ): Promise<T> {
    const url = `${this.apiEndpoint}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.sessionId) {
      headers['X-Session-ID'] = this.sessionId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`BugSpotter API Error (${endpoint}):`, error);

      // Retry logic - retry once after 1 second
      if (!options.retry) {
        console.log('Retrying request after 1 second...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.makeRequest<T>(endpoint, { ...options, retry: true });
      }

      throw error;
    }
  }

  /**
   * Create a new bug report
   */
  async createBugReport(bugData: Omit<BugReport, 'id' | 'timestamp'>): Promise<BugReportResponse> {
    try {
      return await this.makeRequest<BugReportResponse>('/api/v1/bugs', {
        method: 'POST',
        body: JSON.stringify(bugData),
      });
    } catch (error) {
      console.error('Failed to create bug report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get bug reports with optional filtering
   */
  async getBugReports(filters: BugFilter = {}): Promise<BugReport[]> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const endpoint = `/api/v1/bugs${params.toString() ? `?${params}` : ''}`;
      const response = await this.makeRequest<{ bugs: BugReport[] }>(endpoint);

      return response.bugs || [];
    } catch (error) {
      console.error('Failed to fetch bug reports:', error);
      return [];
    }
  }

  /**
   * Get bug statistics for dashboard
   */
  async getBugStats(): Promise<BugStats | null> {
    try {
      return await this.makeRequest<BugStats>('/api/v1/bugs/stats');
    } catch (error) {
      console.error('Failed to fetch bug stats:', error);
      return null;
    }
  }

  /**
   * Get session information
   */
  async getSessionInfo(sessionId: string): Promise<Session | null> {
    try {
      return await this.makeRequest<Session>(`/api/v1/sessions/${sessionId}`);
    } catch (error) {
      console.error('Failed to fetch session info:', error);
      return null;
    }
  }

  /**
   * Create a Jira ticket from a bug report
   */
  async createJiraTicket(bugId: string): Promise<JiraTicketResponse> {
    try {
      return await this.makeRequest<JiraTicketResponse>('/api/v1/jira/create', {
        method: 'POST',
        body: JSON.stringify({ bugId }),
      });
    } catch (error) {
      console.error('Failed to create Jira ticket:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Health check for the API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/api/v1/health');
      return true;
    } catch (error) {
      console.error('BugSpotter API health check failed:', error);
      return false;
    }
  }
}

// Singleton instance for the demo
let apiClient: BugSpotterAPIClient | null = null;

/**
 * Get or create the global API client instance
 */
export function getBugSpotterAPIClient(): BugSpotterAPIClient {
  if (!apiClient) {
    const apiEndpoint = process.env.NEXT_PUBLIC_BUGSPOTTER_API || 'https://demo.api.bugspotter.io';
    const apiKey = process.env.NEXT_PUBLIC_BUGSPOTTER_KEY || 'demo-api-key-12345';

    apiClient = new BugSpotterAPIClient(apiEndpoint, apiKey);
  }

  return apiClient;
}

/**
 * Create a session-specific API client
 */
export function createSessionAPIClient(sessionId: string): BugSpotterAPIClient {
  const apiEndpoint = process.env.NEXT_PUBLIC_BUGSPOTTER_API || 'https://demo.api.bugspotter.io';
  const apiKey = process.env.NEXT_PUBLIC_BUGSPOTTER_KEY || 'demo-api-key-12345';

  return new BugSpotterAPIClient(apiEndpoint, apiKey, sessionId);
}
