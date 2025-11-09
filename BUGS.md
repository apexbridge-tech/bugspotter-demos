# Bug Reference Guide

This document lists all intentional bugs in the demo system for easy testing...

## Bug Injection Mechanism

- **Probability**: 30% (each click has a 30% chance to trigger the bug)
- **Visual Feedback**: Elements flash with severity-based colors when bugs trigger
- **Error Reporting**: Bugs are automatically sent to `/api/bugs` and visible in the dashboard

## KazBank (Banking Demo)

### 1. Transfer Button Timeout

- **Element ID**: `transfer-btn`
- **Type**: `timeout`
- **Severity**: `high`
- **Trigger**: Click "Transfer Funds" button
- **Delay**: 5 seconds
- **Error**: "Transaction timeout: Unable to complete transfer after 5 seconds"

### 2. Download Statement Corruption

- **Element ID**: `download-statement`
- **Type**: `corruption`
- **Severity**: `medium`
- **Trigger**: Click "Download Statement" button
- **Delay**: 2 seconds
- **Error**: "PDF generation failed: File corruption detected in statement export"

### 3. Currency Converter Calculation

- **Element ID**: `convert-currency`
- **Type**: `calculation-error`
- **Severity**: `critical`
- **Trigger**: Click "Convert" button in currency converter
- **Delay**: None
- **Error**: "Exchange rate calculation error: Invalid result for amount 1234.56"

### 4. 2FA Validation Failure

- **Element ID**: `login-submit`
- **Type**: `validation-error`
- **Severity**: `high`
- **Trigger**: Click "Verify 2FA" button
- **Delay**: None
- **Error**: "2FA validation failed: OTP verification service unavailable"

### 5. Mobile Menu Layout Break

- **Element ID**: `mobile-menu-toggle`
- **Type**: `layout-break`
- **Severity**: `medium`
- **Trigger**: Click mobile menu toggle (visible on small screens)
- **Delay**: None
- **Error**: "Navigation render error: Mobile menu overflow causing layout collapse"

## TalentFlow (HR Demo)

### 1. Candidate Search Crash

- **Element ID**: `search-candidates`
- **Type**: `crash`
- **Severity**: `high`
- **Trigger**: Click "Search" button (especially with "senior" keyword)
- **Delay**: None
- **Error**: "Search query parser error: Unexpected token 'senior' at position 0"

### 2. Resume Upload Freeze

- **Element ID**: `upload-resume`
- **Type**: `freeze`
- **Severity**: `critical`
- **Trigger**: Click "Upload Resume" button
- **Delay**: 3 seconds
- **Error**: "File upload stalled: Progress frozen at 99% for resume.pdf"
- **Visual**: Progress bar stops at 99%

### 3. Interview Scheduler Timezone Error

- **Element ID**: `schedule-interview`
- **Type**: `calculation-error`
- **Severity**: `high`
- **Trigger**: Click "Schedule Interview" button
- **Delay**: None
- **Error**: "Timezone conversion failed: Invalid offset calculation for PST to EST"

### 4. Bulk Email Duplicates

- **Element ID**: `send-bulk-email`
- **Type**: `duplicate`
- **Severity**: `critical`
- **Trigger**: Click "Send Assessment Email" button
- **Delay**: None
- **Error**: "Email queue race condition: Duplicate messages sent to 47 candidates"

### 5. Excel Export Corruption

- **Element ID**: `export-excel`
- **Type**: `corruption`
- **Severity**: `medium`
- **Trigger**: Click "Export Candidates to Excel" button
- **Delay**: None
- **Error**: "Excel export corrupted: Invalid cell format in candidate data export"

## QuickMart (E-commerce Demo)

### 1. Double Add to Cart

- **Element ID**: `add-to-cart-1`
- **Type**: `duplicate`
- **Severity**: `medium`
- **Trigger**: Click "Add to Cart" on first product (Wireless Headphones)
- **Delay**: None
- **Error**: "Cart race condition: Item added twice due to rapid double-click"
- **Visual**: Cart count increases by 2 instead of 1

### 2. Checkout Payment Freeze

- **Element ID**: `checkout-btn`
- **Type**: `freeze`
- **Severity**: `critical`
- **Trigger**: Click "Proceed to Payment" button
- **Delay**: 2 seconds
- **Error**: "Payment processor freeze: Gateway connection timeout after 30 seconds"

### 3. Search Special Characters Crash

- **Element ID**: `search-products`
- **Type**: `crash`
- **Severity**: `high`
- **Trigger**: Click "Search" button (especially with special characters like $)
- **Delay**: None
- **Error**: "Search parser crashed: Special character '$' caused unhandled exception"

### 4. Product Image Lazy Load Failure

- **Element ID**: `product-image-1`
- **Type**: `network-error`
- **Severity**: `low`
- **Trigger**: Click on first product image (Wireless Headphones)
- **Delay**: None
- **Error**: "Image lazy load failed: CDN timeout for product-image-12345.jpg"

### 5. Promo Code Not Applied

- **Element ID**: `apply-promo`
- **Type**: `validation-error`
- **Severity**: `high`
- **Trigger**: Click "Apply" button for promo code
- **Delay**: None
- **Error**: "Promo code validation failed: 'DEMO50' exists but discount not calculated"
- **Visual**: Shows red error message that discount wasn't applied

## Testing Tips

### Triggering Bugs Reliably

1. **Multiple Clicks**: Since probability is 30%, click buttons 3-5 times to reliably trigger bugs
2. **Dashboard Refresh**: Dashboard auto-refreshes every 5 seconds, or manually refresh to see new bugs
3. **Session Isolation**: Each demo session has its own bug tracking

### Viewing Bug Details

1. Navigate to `/{subdomain}/dashboard` to see all captured bugs
2. Click on any bug row to see detailed information including:
   - Full error message
   - Stack trace
   - Severity level
   - Timestamp
   - Element ID
   - User agent

### Best Testing Workflow

1. Create a demo session from landing page
2. Visit dashboard to see current bug count (should be 0)
3. Open one of the demo sites in a new tab
4. Click various buttons to trigger bugs
5. Return to dashboard to see captured bugs

## Severity Levels

- **Critical** (Red): System-breaking issues that prevent core functionality
- **High** (Red/Orange): Major bugs that impact user experience significantly
- **Medium** (Orange): Noticeable bugs that affect specific features
- **Low** (Yellow): Minor visual or non-critical issues

## API Endpoints

### Create Session

```bash
POST /api/demo/create-session
Body: { "company": "Your Company Name" }
```

### Report Bug (automatic from BugInjector)

```bash
POST /api/bugs
Body: {
  "errorMessage": "string",
  "stackTrace": "string",
  "severity": "low|medium|high|critical",
  "demo": "kazbank|talentflow|quickmart",
  "elementId": "string",
  "userAgent": "string"
}
```

### Get Bugs

```bash
GET /api/bugs?subdomain={your-subdomain}
```

## Development Notes

- Bugs are stored in Upstash Redis with 2-hour TTL
- Session data expires after 2 hours
- Bug probability can be adjusted in each demo's `useEffect` (default: 0.3 = 30%)
- Visual feedback colors are defined in `BugInjector` class
