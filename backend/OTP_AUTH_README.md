# OTP-Based Hybrid Authentication System

This backend now supports OTP-based authentication alongside the existing email/password system.

## New API Endpoints

### 1. Send OTP
**POST** `/api/auth/send-otp`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "OTP sent successfully"
}
```

Rate limit: 3 requests per hour

### 2. Verify OTP
**POST** `/api/auth/verify-otp`

Request body:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**For existing users** (with password set):
Returns JWT tokens (same as login)

**For new users** (no password set):
```json
{
  "message": "OTP verified. Please set your password.",
  "requiresPasswordSetup": true,
  "email": "user@example.com"
}
```

Rate limit: 5 attempts per 5 minutes

### 3. Set Password
**POST** `/api/auth/set-password`

Request body:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "newpassword123"
}
```

Response: JWT tokens (same as registration)

## Authentication Flow

### New User Registration
1. User enters email
2. POST `/api/auth/send-otp` → OTP sent to email
3. User enters OTP
4. POST `/api/auth/verify-otp` → Returns `requiresPasswordSetup: true`
5. User enters password
6. POST `/api/auth/set-password` → User created and logged in

### Existing User Login
1. User enters email
2. POST `/api/auth/send-otp` → OTP sent to email
3. User enters OTP
4. POST `/api/auth/verify-otp` → User logged in with JWT tokens

## Security Features

- OTP hashed with bcrypt (10 salt rounds)
- OTP expires in 5 minutes
- Maximum 5 verification attempts per OTP
- Rate limiting on all endpoints
- OTP cleared after successful verification or password setup

## Environment Variables Required

Add these to your `.env` file:

```env
# Email/SMTP configuration for OTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_NAME=Vanca Patina
```

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password (not your regular password) for `SMTP_PASS`

## Database Changes

The `User` model now includes these fields:
- `otp`: Hashed OTP string
- `otpExpiry`: Date when OTP expires
- `otpAttempts`: Number of failed verification attempts

## Error Responses

- `400 Bad Request`: Invalid OTP, expired OTP
- `404 Not Found`: User not found
- `429 Too Many Requests`: Rate limit exceeded or too many failed attempts

## Integration with Existing System

- Reuses existing JWT token generation and refresh logic
- Compatible with existing `protect` middleware
- Maintains existing user sessions and refresh tokens
- No changes to existing login/register endpoints