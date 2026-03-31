# trader5 Email Templates

This folder contains professional HTML email templates for the trader5 platform.

## Available Templates

### 1. **verification-code.html**
- **Purpose:** Send 6-digit verification codes for 2FA authentication
- **Variables:**
  - `{{VERIFICATION_CODE}}` - The 6-digit code

### 2. **welcome.html**
- **Purpose:** Welcome new users after successful registration
- **Variables:**
  - `{{USER_NAME}}` - User's display name
  - `{{DASHBOARD_URL}}` - Link to dashboard

### 3. **password-reset.html**
- **Purpose:** Send password reset links
- **Variables:**
  - `{{RESET_URL}}` - Password reset link (appears twice)

### 4. **funding-confirmation.html**
- **Purpose:** Confirm successful BTC deposits
- **Variables:**
  - `{{TRANSACTION_ID}}` - Blockchain transaction ID
  - `{{BTC_AMOUNT}}` - Amount in BTC
  - `{{USD_AMOUNT}}` - USD equivalent value
  - `{{TIMESTAMP}}` - Date and time of transaction
  - `{{TOTAL_BALANCE}}` - Total account balance in USD
  - `{{BTC_BALANCE}}` - Total account balance in BTC
  - `{{DASHBOARD_URL}}` - Link to dashboard

### 5. **trade-alert.html**
- **Purpose:** Notify users of executed trades
- **Variables:**
  - `{{TRADE_STATUS}}` - e.g., "COMPLETED", "PENDING"
  - `{{POSITION_TYPE}}` - e.g., "LONG" or "SHORT"
  - `{{ENTRY_PRICE}}` - Entry price in USD
  - `{{POSITION_SIZE}}` - Position size in BTC
  - `{{STRATEGY_NAME}}` - Active strategy name
  - `{{TIMESTAMP}}` - Trade execution time
  - `{{STOP_LOSS}}` - Stop loss price
  - `{{TAKE_PROFIT}}` - Take profit target
  - `{{AI_REASONING}}` - Brief explanation of AI decision
  - `{{DASHBOARD_URL}}` - Link to dashboard
  - `{{SETTINGS_URL}}` - Link to settings page

## Design Features

- **Dark Theme:** Consistent with trader5 branding (slate/emerald color scheme)
- **Responsive:** Works on desktop and mobile email clients
- **Inline Styles:** All CSS is inlined for maximum email client compatibility
- **Professional Layout:** Clean, modern design with clear hierarchy
- **Branding:** trader5 logo and colors throughout
- **Security Focused:** Includes warnings and security notices where appropriate

## Usage

To use these templates in your backend:

1. Read the HTML file
2. Replace variables with actual data using string replacement
3. Send via your email service (SendGrid, AWS SES, etc.)

### Example (Node.js):

```javascript
const fs = require('fs');

// Read template
let emailHtml = fs.readFileSync('./src/emails/verification-code.html', 'utf8');

// Replace variables
emailHtml = emailHtml.replace('{{VERIFICATION_CODE}}', '123456');

// Send email
await sendEmail({
  to: 'user@example.com',
  subject: 'Your trader5 Verification Code',
  html: emailHtml
});
```

## Testing

Test emails in multiple clients before production:
- Gmail (desktop & mobile)
- Outlook (desktop & web)
- Apple Mail (iOS & macOS)
- Yahoo Mail
- ProtonMail

Use services like [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/) for comprehensive testing.

## Notes

- All templates use UTC timestamps - adjust as needed
- Color scheme: Emerald (#10b981) for primary actions, Red (#ef4444) for warnings
- Font stack includes system fonts for best rendering
- Links are styled but functional - ensure they point to correct URLs in production
