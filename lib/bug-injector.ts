/**
 * BugInjector - Client-side bug injection system for demo purposes
 *
 * Attaches event listeners to elements with data-bug attributes
 * and triggers bugs with 30% probability to simulate real-world issues
 */

import type { BugSpotterSDK } from '@/types/bug';
import { toast } from 'sonner';

export type BugType =
  | 'timeout'
  | 'network-error'
  | 'calculation-error'
  | 'corruption'
  | 'freeze'
  | 'crash'
  | 'validation-error'
  | 'duplicate'
  | 'layout-break';

export interface BugConfig {
  type: BugType;
  elementId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  demo: 'kazbank' | 'talentflow' | 'quickmart';
  delay?: number; // Optional delay before triggering bug (in ms)
}

export class BugInjector {
  private probability: number = 0.3; // 30% chance
  private bugs: Map<string, BugConfig> = new Map();
  private bugspotterSDK: BugSpotterSDK | null = null;

  constructor(probability: number = 0.3, bugspotterSDK?: BugSpotterSDK | null) {
    this.probability = probability;
    this.bugspotterSDK = bugspotterSDK || null;
  }

  /**
   * Registers a bug configuration for an element
   */
  registerBug(config: BugConfig): void {
    this.bugs.set(config.elementId, config);
  }

  /**
   * Initializes the bug injector by attaching event listeners
   * Call this after the DOM is loaded
   */
  initialize(): void {
    this.bugs.forEach((config, elementId) => {
      const element = document.getElementById(elementId);

      if (!element) {
        console.warn(`BugInjector: Element #${elementId} not found`);
        return;
      }

      // Attach click listener
      element.addEventListener('click', (e) => {
        this.handleClick(e, config);
      });
    });
  }

  /**
   * Handles click events and potentially triggers bugs
   */
  private handleClick(event: Event, config: BugConfig): void {
    // Check if we should trigger the bug (based on probability)
    if (Math.random() > this.probability) {
      return; // No bug this time
    }

    // Prevent default action if we're triggering a bug
    event.preventDefault();
    event.stopPropagation();

    // Trigger bug with optional delay
    if (config.delay) {
      setTimeout(() => {
        this.triggerBug(config);
      }, config.delay);
    } else {
      this.triggerBug(config);
    }
  }

  /**
   * Triggers a bug and shows BugSpotter's built-in report modal
   */
  private async triggerBug(config: BugConfig): Promise<void> {
    const error = this.generateError(config);

    // Log error to console so it appears in bug report
    console.error(`[${config.severity.toUpperCase()}] ${config.type}:`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }

    // Visual feedback
    this.showVisualFeedback(config);

    // Show toast notification with appropriate styling based on severity
    this.showToastNotification(config);

    // Use BugSpotter SDK's built-in capture modal
    if (this.bugspotterSDK) {
      try {
        await this.bugspotterSDK.capture();
        console.log('[BugInjector] Bug report captured via BugSpotter SDK');
      } catch (err) {
        console.error('[BugInjector] Failed to open BugSpotter capture modal:', err);
      }
    } else {
      console.warn('[BugInjector] BugSpotter SDK not available');
    }
  }

  /**
   * Generates a realistic error based on bug type
   */
  private generateError(config: BugConfig): Error & { stack?: string } {
    const error = new Error(config.message);

    // Generate realistic stack traces
    const stackTraces: Record<BugType, string> = {
      timeout: `Error: ${config.message}
    at XMLHttpRequest.handleTimeout (${config.demo}/api-client.js:45:15)
    at setTimeout (native)
    at fetch (api-client.js:32:7)`,

      'network-error': `NetworkError: ${config.message}
    at fetch (api-client.js:89:12)
    at handleTransfer (transfer.js:23:9)
    at HTMLButtonElement.onClick (${config.demo}/page.tsx:156:5)`,

      'calculation-error': `CalculationError: ${config.message}
    at calculateExchangeRate (currency-utils.js:67:11)
    at convertCurrency (converter.tsx:34:18)
    at handleConvert (converter.tsx:78:5)`,

      corruption: `DataCorruptionError: ${config.message}
    at generatePDF (pdf-generator.js:123:8)
    at handleDownload (statements.tsx:45:12)
    at HTMLButtonElement.onClick (${config.demo}/page.tsx:201:7)`,

      freeze: `TimeoutError: ${config.message}
    at processPayment (payment-processor.js:234:15)
    at checkout.tsx:89:await
    at handleCheckout (checkout.tsx:67:9)`,

      crash: `FatalError: ${config.message}
    at parseSearchQuery (search-utils.js:156:23)
    at handleSearch (search.tsx:34:5)
    at HTMLInputElement.onInput (search.tsx:91:7)`,

      'validation-error': `ValidationError: ${config.message}
    at validateOTP (auth-service.js:178:9)
    at verify2FA (login.tsx:56:12)
    at handleLogin (login.tsx:89:await)`,

      duplicate: `ConcurrencyError: ${config.message}
    at queueEmail (email-service.js:67:11)
    at sendBulkEmails (bulk-actions.tsx:123:9)
    at HTMLButtonElement.onClick (${config.demo}/page.tsx:267:5)`,

      'layout-break': `RenderError: ${config.message}
    at toggleMobileMenu (navigation.tsx:45:7)
    at HTMLButtonElement.onClick (header.tsx:89:5)
    at React.createElement (react-dom.js:1234:15)`,
    };

    error.stack = stackTraces[config.type];

    return error;
  }

  /**
   * Shows visual feedback when a bug is triggered
   */
  private showVisualFeedback(config: BugConfig): void {
    const element = document.getElementById(config.elementId);
    if (!element) return;

    // Add visual indicator based on severity
    const severityColors = {
      low: '#fbbf24', // yellow
      medium: '#f97316', // orange
      high: '#ef4444', // red
      critical: '#dc2626', // dark red
    };

    const originalBg = element.style.backgroundColor;
    const originalTransition = element.style.transition;

    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = severityColors[config.severity];

    setTimeout(() => {
      element.style.backgroundColor = originalBg;
      setTimeout(() => {
        element.style.transition = originalTransition;
      }, 300);
    }, 1000);
  }

  /**
   * Shows a toast notification when a bug is triggered
   */
  private showToastNotification(config: BugConfig): void {
    const severityIcons = {
      low: '⚠️',
      medium: '🔶',
      high: '❌',
      critical: '🚨',
    };

    const severityLabels = {
      low: 'Warning',
      medium: 'Error',
      high: 'Critical Error',
      critical: 'Critical Failure',
    };

    const icon = severityIcons[config.severity];
    const label = severityLabels[config.severity];

    // Use appropriate toast type based on severity
    if (config.severity === 'critical' || config.severity === 'high') {
      toast.error(`${icon} ${label}: ${config.type}`, {
        description: config.message,
        duration: 6000,
        action: this.bugspotterSDK ? {
          label: 'Report Bug',
          onClick: () => {
            this.bugspotterSDK?.capture();
          }
        } : undefined,
      });
    } else if (config.severity === 'medium') {
      toast.warning(`${icon} ${label}: ${config.type}`, {
        description: config.message,
        duration: 5000,
        action: this.bugspotterSDK ? {
          label: 'Report',
          onClick: () => {
            this.bugspotterSDK?.capture();
          }
        } : undefined,
      });
    } else {
      toast(`${icon} ${label}: ${config.type}`, {
        description: config.message,
        duration: 4000,
      });
    }
  }

  /**
   * Manually trigger a bug (for testing)
   */
  public manualTrigger(elementId: string): void {
    const config = this.bugs.get(elementId);
    if (config) {
      this.triggerBug(config);
    }
  }
}
