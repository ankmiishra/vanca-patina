# 📚 Best Practices & Code Quality Improvements

## Overview
This document provides recommended improvements for production-readiness and code quality.

---

## 🏗️ ARCHITECTURAL IMPROVEMENTS

### 1. Add Environment Variable Validation

**File:** Create `backend/config/env.js`

```javascript
// Load and validate environment variables
const required = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// Validate token expiry
const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d';
if (!JWT_EXPIRY.match(/^\d+[dhms]$/)) {
  console.warn('⚠️ Invalid JWT_EXPIRY format, using default "30d"');
}

module.exports = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
```

**Usage in server.js:**
```javascript
require('./config/env');  // Validate on startup
```

---

### 2. Better Error Handling with Error Classes

**File:** Create `backend/utils/errors.js`

```javascript
class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, issues = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.issues = issues;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
};
```

**Usage in controllers:**
```javascript
const { NotFoundError } = require('../utils/errors');

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new NotFoundError('Product');
  res.json(product);
});
```

---

### 3. Centralized Logging Configuration

**File:** Create `backend/config/logger.js`

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vanca-patina-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
```

**Install:** `npm install winston`

---

## 🔒 SECURITY HARDENING

### 1. Add Request Validation Middleware

**File:** Create `backend/middleware/validateInput.js`

```javascript
const validateInput = (req, res, next) => {
  // Prevent large payloads
  if (req.header('Content-Length') > 10 * 1024 * 1024) {
    return res.status(413).json({ message: 'Payload too large' });
  }

  // Prevent NoSQL injection in query parameters
  Object.keys(req.query).forEach(key => {
    const value = req.query[key];
    if (typeof value === 'string') {
      if (value.includes('$') || value.includes('{')) {
        delete req.query[key];
      }
    }
  });

  next();
};

module.exports = validateInput;
```

**Usage in server.js:**
```javascript
const validateInput = require('./middleware/validateInput');
app.use(validateInput);
```

---

### 2. Add CSRF Protection

**File:** Create `backend/middleware/csrf.js`

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

const csrfProtection = csrf({
  cookie: false,  // Use session instead
});

module.exports = csrfProtection;
```

**Install:** `npm install csurf cookie-parser`

---

### 3. Implement API Key Rate Limiting

**File:** Update `backend/middleware/rateLimit.js`

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Max 100 requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, IP otherwise
    return req.user?.id || req.ip;
  },
});

module.exports = apiLimiter;
```

---

## 📝 DATA VALIDATION IMPROVEMENTS

### 1. Add Custom Validation Functions

**File:** Create `backend/validators/custom.js`

```javascript
const { z } = require('zod');

// Validate MongoDB ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: 'Invalid MongoDB ObjectId',
  });

// Validate phone number
const phoneSchema = z
  .string()
  .refine((val) => /^\+?[1-9]\d{1,14}$/.test(val), {
    message: 'Invalid phone number',
  });

// Validate postal code (basic)
const postalCodeSchema = z
  .string()
  .refine((val) => /^[0-9]{5,6}$/.test(val), {
    message: 'Invalid postal code',
  });

// Validate price (non-negative with max 2 decimals)
const priceSchema = z
  .number()
  .nonnegative()
  .refine((val) => Number.isFinite(val), {
    message: 'Invalid price',
  });

module.exports = {
  phoneSchema,
  postalCodeSchema,
  priceSchema,
};
```

---

### 2. Add Async Validator Example

**File:** Example in `backend/validators/schemas.js`

```javascript
// Example: Check if email already exists
const registerSchema = z.object({
  name: z.string().min(2).max(100).transform((s) => s?.trim()),
  email: z.string().email().refine(
    async (email) => {
      const user = await User.findOne({ email });
      return !user;
    },
    {
      message: 'Email already registered',
    }
  ),
  password: z.string().min(8).max(72),
});
```

---

## 🧪 TESTING SETUP

### 1. Add Jest Configuration

**File:** `backend/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'utils/**/*.js',
  ],
};
```

**Install:** `npm install -D jest supertest`

---

### 2. Example Unit Test

**File:** `backend/__tests__/auth.test.js`

```javascript
const request = require('supertest');
const app = require('../server');

describe('Authentication', () => {
  test('POST /api/auth/login with valid credentials returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/login with invalid email returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(401);
  });
});
```

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### 1. Add Database Query Caching

**File:** Create `backend/middleware/cache.js`

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });  // 10 minutes default

const cacheMiddleware = (duration = 600) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached) {
      res.json(cached);
      return;
    }

    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, data, duration);
      originalJson.call(this, data);
    };

    next();
  };
};

module.exports = cacheMiddleware;
```

**Install:** `npm install node-cache`

**Usage:**
```javascript
app.get('/api/products', cacheMiddleware(300), getProducts);
```

---

### 2. Add Database Indexing

**File:** `backend/models/product.js`

```javascript
const productSchema = new mongoose.Schema({
  // ... fields
}, { timestamps: true });

// Add indexes for faster queries
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ createdAt: -1 });
productSchema.index({ finishType: 1 });

module.exports = mongoose.model('Product', productSchema);
```

---

## 📱 FRONTEND IMPROVEMENTS

### 1. Add Error Boundary Component

**File:** `frontend/src/components/ErrorBoundary.tsx`

```typescript
import React, { ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 mt-2">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

### 2. Add Error Retry Hook

**File:** `frontend/src/hooks/useRetry.ts`

```typescript
import { useState, useCallback } from 'react';

export function useRetry(fn: () => Promise<any>, maxRetries = 3) {
  const [retries, setRetries] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async () => {
    if (retries >= maxRetries) return;
    
    setIsRetrying(true);
    setRetries(r => r + 1);
    
    try {
      await fn();
    } finally {
      setIsRetrying(false);
    }
  }, [fn, retries, maxRetries]);

  return { retry, retries, isRetrying, canRetry: retries < maxRetries };
}
```

---

## 🔧 DEVELOPMENT WORKFLOW

### 1. Add Pre-commit Hooks

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run format
npm run test
```

**Install:** `npm install -D husky lint-staged`

---

### 2. Add ESLint Configuration

**File:** `.eslintrc.json`

```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": "latest"
  },
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "eqeqeq": ["error", "always"]
  }
}
```

---

## 📊 MONITORING & LOGGING

### 1. Add Request Logging Middleware

**File:** Update `backend/server.js`

```javascript
const logger = require('./config/logger');

// Log all requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  
  next();
});
```

---

### 2. Add Health Check Endpoint

**File:** Update `backend/server.js`

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});
```

---

## 📋 PRODUCTION CHECKLIST

- [ ] Environment variables validated at startup
- [ ] Error handling with custom error classes
- [ ] Request logging and monitoring setup
- [ ] Rate limiting on all auth endpoints
- [ ] Database indexes created
- [ ] Unit tests written and passing
- [ ] E2E tests for critical flows
- [ ] Security audit completed
- [ ] Performance profiling done
- [ ] CORS properly configured for production domains
- [ ] SSL/HTTPS enabled
- [ ] Database backups configured
- [ ] Error tracking (Sentry) integrated
- [ ] Performance monitoring (New Relic, Datadog) setup
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Load testing done

---

## 🎯 RECOMMENDED PACKAGES TO ADD

**Backend:**
```json
{
  "dependencies": {
    "winston": "^3.11.0",           // Logging
    "node-cache": "^5.1.2",         // Caching
    "joi": "^17.11.0",              // Alternative validation
    "compression": "^1.7.4",        // Gzip compression
    "helmet": "^8.1.0"              // Security headers (already have)
  },
  "devDependencies": {
    "jest": "^29.7.0",              // Testing
    "supertest": "^6.3.3",          // API testing
    "eslint": "^8.53.0",            // Linting
    "prettier": "^3.1.0"            // Code formatting
  }
}
```

**Frontend:**
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.5",
    "vitest": "^0.34.0",
    "eslint-plugin-react": "^7.33.0",
    "typescript-eslint": "^6.11.0"
  }
}
```

---

**Last Updated:** March 2026
**Version:** 1.0
