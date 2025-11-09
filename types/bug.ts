/**
 * TypeScript interfaces for BugSpotter SDK integration
 */

export interface BugReport {
  id: string;
  errorMessage: string;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  screenshot?: string;
  sessionId: string;
  elementId?: string;
  userAgent: string;
  url: string;
  timestamp: string;
  demo: 'kazbank' | 'talentflow' | 'quickmart';
}

export interface BugReportResponse {
  success: boolean;
  bug?: {
    id: string;
    timestamp: string;
  };
  error?: string;
}

export interface Session {
  id: string;
  demoType: 'kazbank' | 'talentflow' | 'quickmart';
  createdAt: string;
  company?: string;
}

export interface BugFilter {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  demoType?: 'kazbank' | 'talentflow' | 'quickmart';
  sessionId?: string;
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface JiraTicketResponse {
  success: boolean;
  jiraTicket?: {
    key: string;
    id: string;
    link: string;
  };
  error?: string;
}

export interface BugSpotterConfig {
  apiEndpoint: string;
  apiKey: string;
  sessionId: string;
  captureScreenshots?: boolean;
  captureConsole?: boolean;
  captureNetwork?: boolean;
  enabled?: boolean;
}

export interface BugSpotterSDK {
  capture(): Promise<unknown>;
  getConfig(): unknown;
  destroy(): void;
}

// Registered bug configuration from bug injector
export interface RegisteredBug {
  demo: 'kazbank' | 'talentflow' | 'quickmart';
  elementId: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  delay?: number;
  description: string;
  triggerAction: string;
}

// Bug statistics for admin dashboard
export interface BugStats {
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
  last24Hours: number;
  last7Days: number;
}
