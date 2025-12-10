# Email Configuration Guide

This application supports multiple email providers for sending OTP (One-Time Password) emails. For development and testing, we recommend using free sandbox services that work with HTTPS localhost.

## Option 1: Ethereal Email (Recommended for Development) ⭐

**Ethereal Email** is a free service that automatically creates test accounts. No signup required!

### Setup:
1. Set in your `.env` file:
   ```env
   USE_ETHEREAL_EMAIL=true
   ```

2. That's it! The application will automatically create a test account when it starts.

### Features:
- ✅ Completely free
- ✅ No signup required
- ✅ Works with HTTPS localhost
- ✅ Auto-generates test credentials
- ✅ Provides preview URLs for each email
- ✅ Perfect for development and testing

### Viewing Emails:
- Emails are logged to console with preview URLs
- Or visit: https://ethereal.email
- Login with the credentials shown in console logs

## Option 2: Mailtrap (Free Sandbox)

**Mailtrap** is a free email testing service with a web interface.

### Setup:
1. Sign up for free at: https://mailtrap.io
2. Create an inbox in your Mailtrap account
3. Copy your SMTP credentials from Mailtrap
4. Set in your `.env` file:
   ```env
   USE_MAILTRAP=true
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_mailtrap_username
   SMTP_PASSWORD=your_mailtrap_password
   ```

### Features:
- ✅ Free tier available
- ✅ Works with HTTPS localhost
- ✅ Web interface to view emails
- ✅ Email testing and debugging tools

### Viewing Emails:
- Login to https://mailtrap.io
- View emails in your inbox

## Option 3: Custom SMTP (Gmail, Outlook, etc.)

For production or custom SMTP servers:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Note:** For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use the app password in `SMTP_PASSWORD`

## Environment Variables

Add to your `.env` file:

```env
# For Ethereal Email (recommended for development)
USE_ETHEREAL_EMAIL=true

# OR for Mailtrap
USE_MAILTRAP=true
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASSWORD=your_mailtrap_password

# OR for custom SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
```

## Priority Order

The application checks email configuration in this order:
1. `USE_ETHEREAL_EMAIL=true` → Uses Ethereal Email (auto-generated)
2. `USE_MAILTRAP=true` or `SMTP_HOST=smtp.mailtrap.io` → Uses Mailtrap
3. `SMTP_HOST` set → Uses custom SMTP
4. None set → Logs emails to console only

## Testing

1. Start your server
2. Request a password reset
3. Check:
   - **Ethereal**: Console logs will show preview URL
   - **Mailtrap**: Login to mailtrap.io to view emails
   - **Custom SMTP**: Check your email inbox

## Troubleshooting

### Emails not sending?
- Check console logs for error messages
- Verify environment variables are set correctly
- For Ethereal: Check if test account was created (shown in console)
- For Mailtrap: Verify credentials in mailtrap.io dashboard

### HTTPS localhost issues?
- Both Ethereal and Mailtrap work with HTTPS localhost
- No special configuration needed

