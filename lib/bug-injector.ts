/**
 * BugInjector - Client-side bug injection system for demo purposes
 *
 * Attaches event listeners to elements with data-bug attributes
 * and triggers bugs with 30% probability to simulate real-world issues
 */

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
  private apiEndpoint: string = '/api/bugs';

  constructor(probability: number = 0.3) {
    this.probability = probability;
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
   * Triggers a bug and sends it to the API
   */
  private async triggerBug(config: BugConfig): Promise<void> {
    const error = this.generateError(config);

    // Log to console (will be captured by BugSpotter SDK)
    console.error(`[BugInjector] ${config.type}:`, error.message);
    if (error.stack) {
      console.error(error.stack);
    }

    // Visual feedback
    this.showVisualFeedback(config);

    // Send to API
    await this.reportBug(config, error);
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

    // Show error message overlay for critical bugs
    if (config.severity === 'critical' || config.severity === 'high') {
      this.showErrorOverlay(config.message);
    }
  }

  /**
   * Shows an error overlay message
   */
  private showErrorOverlay(message: string): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      border: 2px solid #ef4444;
      border-radius: 8px;
      padding: 16px 20px;
      max-width: 400px;
      z-index: 9999;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: start;">
        <svg style="width: 24px; height: 24px; color: #dc2626; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <div style="font-weight: 600; color: #991b1b; margin-bottom: 4px;">Error Occurred</div>
          <div style="color: #7f1d1d; font-size: 14px;">${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => overlay.remove(), 300);
    }, 4000);
  }

  /**
   * Reports bug to the API
   */
  private async reportBug(config: BugConfig, error: Error): Promise<void> {
    try {
      const bugData = {
        errorMessage: config.message,
        stackTrace: error.stack,
        severity: config.severity,
        elementId: config.elementId,
        demo: config.demo,
        userAgent: navigator.userAgent,
      };

      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bugData),
      });
    } catch (err) {
      console.error('Failed to report bug:', err);
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

// Add CSS animation for overlay
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
