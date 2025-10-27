import { NextResponse } from 'next/server';

// This endpoint returns all registered bugs from each demo
// with descriptions of how to trigger them

export const dynamic = 'force-dynamic';

interface RegisteredBug {
  demo: 'kazbank' | 'talentflow' | 'quickmart';
  elementId: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  delay?: number;
  description: string; // How to trigger this bug
  triggerAction: string; // User action that triggers it
}

const registeredBugs: RegisteredBug[] = [
  // KazBank Bugs
  {
    demo: 'kazbank',
    elementId: 'transfer-btn',
    type: 'timeout',
    message: 'Transaction timeout: Unable to complete transfer after 5 seconds',
    severity: 'high',
    delay: 5000,
    description: 'Money transfer times out after 5 seconds',
    triggerAction: 'Click the "Transfer" button in the Quick Transfer section',
  },
  {
    demo: 'kazbank',
    elementId: 'download-statement',
    type: 'corruption',
    message: 'PDF generation failed: File corruption detected in statement export',
    severity: 'medium',
    delay: 2000,
    description: 'Account statement PDF download fails with corruption error',
    triggerAction: 'Click the "Statement" button next to Recent Transactions',
  },
  {
    demo: 'kazbank',
    elementId: 'convert-currency',
    type: 'calculation-error',
    message: 'Exchange rate calculation error: Invalid result for amount 1234.56',
    severity: 'critical',
    description: 'Currency conversion produces incorrect results',
    triggerAction: 'Click the "Convert" button in the Currency Converter widget',
  },
  {
    demo: 'kazbank',
    elementId: 'login-submit',
    type: 'validation-error',
    message: '2FA validation failed: OTP verification service unavailable',
    severity: 'high',
    description: '2FA verification fails due to service unavailability',
    triggerAction: 'Click the "Verify 2FA" button in the Security Test section or Card Settings',
  },
  {
    demo: 'kazbank',
    elementId: 'mobile-menu-toggle',
    type: 'layout-break',
    message: 'Navigation render error: Mobile menu overflow causing layout collapse',
    severity: 'medium',
    description: 'Mobile navigation menu causes layout to break',
    triggerAction: 'Click the "Menu" button in the mobile header (visible on mobile/small screens)',
  },

  // TalentFlow Bugs
  {
    demo: 'talentflow',
    elementId: 'search-candidates',
    type: 'crash',
    message: 'Search query parser error: Unexpected token "senior" at position 0',
    severity: 'high',
    description: 'Candidate search crashes with certain keywords',
    triggerAction: 'Click the "Search" button in the Search Candidates section',
  },
  {
    demo: 'talentflow',
    elementId: 'upload-resume',
    type: 'freeze',
    message: 'File upload stalled: Progress frozen at 99% for resume.pdf',
    severity: 'critical',
    delay: 3000,
    description: 'Resume upload freezes at 99% and never completes',
    triggerAction: 'Click the "Upload Resume" button in the application form',
  },
  {
    demo: 'talentflow',
    elementId: 'schedule-interview',
    type: 'calculation-error',
    message: 'Timezone conversion failed: Invalid offset calculation for PST to EST',
    severity: 'high',
    description: 'Interview scheduling fails due to timezone calculation error',
    triggerAction: 'Click the "Schedule Interview" button for any candidate',
  },
  {
    demo: 'talentflow',
    elementId: 'send-bulk-email',
    type: 'duplicate',
    message: 'Email queue race condition: Duplicate messages sent to 47 candidates',
    severity: 'critical',
    description: 'Bulk email sender sends duplicate emails due to race condition',
    triggerAction: 'Click the "Send to All" button in the bulk actions section',
  },
  {
    demo: 'talentflow',
    elementId: 'export-excel',
    type: 'corruption',
    message: 'Excel export corrupted: Invalid cell format in candidate data export',
    severity: 'medium',
    description: 'Candidate data export produces corrupted Excel file',
    triggerAction: 'Click the "Export to Excel" button in the reports section',
  },

  // QuickMart Bugs
  {
    demo: 'quickmart',
    elementId: 'add-to-cart-1',
    type: 'duplicate',
    message: 'Cart race condition: Item added twice due to rapid double-click',
    severity: 'medium',
    description: 'Product gets added to cart twice on single click',
    triggerAction: 'Click any "Add to Cart" button for a product',
  },
  {
    demo: 'quickmart',
    elementId: 'checkout-btn',
    type: 'freeze',
    message: 'Payment processor freeze: Gateway connection timeout after 30 seconds',
    severity: 'critical',
    delay: 2000,
    description: 'Checkout freezes during payment processing',
    triggerAction: 'Click the "Proceed to Checkout" button',
  },
  {
    demo: 'quickmart',
    elementId: 'search-products',
    type: 'crash',
    message: 'Search parser crashed: Special character "$" caused unhandled exception',
    severity: 'high',
    description: 'Product search crashes with special characters',
    triggerAction: 'Click the "Search" button or press Enter in the search bar',
  },
  {
    demo: 'quickmart',
    elementId: 'product-image-1',
    type: 'network-error',
    message: 'Image lazy load failed: CDN timeout for product-image-12345.jpg',
    severity: 'low',
    description: 'Product images fail to load due to CDN timeout',
    triggerAction: 'Click or hover over product images',
  },
  {
    demo: 'quickmart',
    elementId: 'apply-promo',
    type: 'validation-error',
    message: 'Promo code validation failed: "DEMO50" exists but discount not calculated',
    severity: 'high',
    description: 'Promo code validation fails despite valid code',
    triggerAction: 'Click the "Apply" button after entering a promo code',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    bugs: registeredBugs,
    stats: {
      total: registeredBugs.length,
      byDemo: {
        kazbank: registeredBugs.filter((b) => b.demo === 'kazbank').length,
        talentflow: registeredBugs.filter((b) => b.demo === 'talentflow').length,
        quickmart: registeredBugs.filter((b) => b.demo === 'quickmart').length,
      },
      bySeverity: {
        critical: registeredBugs.filter((b) => b.severity === 'critical').length,
        high: registeredBugs.filter((b) => b.severity === 'high').length,
        medium: registeredBugs.filter((b) => b.severity === 'medium').length,
        low: registeredBugs.filter((b) => b.severity === 'low').length,
      },
    },
  });
}
