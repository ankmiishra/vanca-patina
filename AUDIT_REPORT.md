# 🔴 MERN E-Commerce App - Complete Audit Report

## Executive Summary
**Status:** 🔴 CRITICAL ISSUES FOUND
- **8 Backend Issues** (3 Critical)
- **2 Frontend Issues** (2 Critical)
- **3 Data Flow Issues**
- **Multiple Security Concerns**

---

## 📋 PART 1: BACKEND AUDIT

### 🔴 CRITICAL ISSUE #1: Zod Validation Crashes on Optional Fields

**File:** [backend/validators/schemas.js](backend/validators/schemas.js#L14-L28)

**Problem:**
```javascript
// ❌ WRONG - .trim() called on undefined values
const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional().transform((s) => s.trim()),
    // ^ When optional field is undefined, .trim() throws error
    email: z.string().email().optional().transform((s) => s.trim().toLowerCase()),
    // ^ Same issue here
    password: z.string().min(8).max(72).optional(),
  })
```

**Error Message:** `Cannot read properties of undefined (reading 'trim')`

**Affected Lines:**
- Line 16: `name` field in `updateProfileSchema`
- Line 17: `email` field in `updateProfileSchema`
- Lines 19, 35, 63: Multiple transform() calls without null safety

**Root Cause:**
- `.transform()` is called BEFORE Zod checks if optional field is undefined
- Optional fields that aren't provided become `undefined` at transform stage

**Solution:**
Use `.pipe()` to chain validators after filtering undefined values:

```javascript
// ✅ CORRECT - Use optional().pipe() pattern
name: z.string().min(2).max(100).optional().pipe(
  z.string().transform((s) => s.trim()).optional()
),

// OR use .refine() for conditional transform
email: z.string().email().optional().refine(
  (val) => val === undefined || val.trim().toLowerCase() === val,
  "Invalid email"
).transform((s) => s ? s.trim().toLowerCase() : undefined),

// OR simplest: just skip transform for optional
search: z.string().optional(),
```

---

### 🔴 CRITICAL ISSUE #2: Deprecated & Broken Middleware Packages

**File:** [backend/package.json](backend/package.json) and [backend/server.js](backend/server.js#L31-L32)

**Problem:**
```json
{
  "dependencies": {
    "express-mongo-sanitize": "^2.2.0",  // ❌ Deprecated, incompatible with Express 5
    "xss-clean": "^0.1.4"                // ❌ Unmaintained, causes "Cannot set property query" error
  }
}
```

**Error:** `Cannot set property 'query' of [object Object] which has only a getter`

**Root Cause:**
- `express-mongo-sanitize` v2.2.0 is incompatible with Express 5.x
- Both packages try to modify `req` object in ways Express 5 doesn't allow
- They're commented out in server.js but still listed in dependencies

**Solution:**
1. Remove from `package.json`:
   ```json
   // Remove: "express-mongo-sanitize", "xss-clean"
   ```

2. Helmet already installed and configured (better solution):
   ```javascript
   // ✅ Already in server.js - no changes needed
   const helmet = require("helmet");
   app.use(helmet());  // Provides security headers and XSS protection
   ```

---

### 🔴 CRITICAL ISSUE #3: Missing finishType Field in Product Model

**File:** [backend/models/product.js](backend/models/product.js)

**Problem:**
```javascript
// Current schema - missing finishType
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  // ❌ No finishType field!
  // But frontend Shop.tsx expects it
});
```

**Frontend Dependency:** [frontend/src/pages/Shop.tsx](frontend/src/pages/Shop.tsx#L37)
```typescript
const finishTypes = useMemo(() => {
  return [...new Set(products.map((p) => p.finishType))];  // Expects p.finishType
}, [products]);
```

**Solution:** Add `finishType` field to Product schema:
```javascript
finishType: {
  type: String,
  enum: ["Matte", "Glossy", "Satin", "Standard"],
  default: "Standard"
}
```

---

### 🟡 ISSUE #4: Weak JWT Secret Configuration

**File:** [backend/.env](backend/.env#L6)

**Problem:**
```env
JWT_SECRET=change_me__please_set_a_real_secret
```

**Risk:** Predictable secret makes tokens vulnerable to forging

**Solution:**
```env
JWT_SECRET=your-super-secure-random-string-minimum-32-chars-here
```

Generate secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 🟡 ISSUE #5: Missing Validation on Routes

**File:** [backend/routes/productRoutes.js](backend/routes/productRoutes.js#L18)

**Problem:**
```javascript
router.post(
  '/upload',
  protect,
  admin,
  upload.single('image'),
  validate(uploadProductImageSchema),  // ❌ Validates body, but productId might be in formData
  uploadProductImage
);
```

**Solution:**
Ensure `uploadProductImageSchema` validates the correct source:
```javascript
const uploadProductImageSchema = z.object({
  productId: objectIdSchema,
});

// And in route, validate 'body' explicitly if using form-data
router.post('/upload', ..., validate(uploadProductImageSchema, 'body'), ...)
```

---

### 🟠 ISSUE #6: Database Connection Error Handling

**File:** [backend/config/db.js](backend/config/db.js)

**Current:**
```javascript
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("DB Error:", error.message);
    process.exit(1);  // ❌ Hard exit without cleanup
  }
};
```

**Best Practice:**
```javascript
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("DB Error:", error.message);
    // Retry logic
    setTimeout(() => connectDB(), 5000);
  }
};
```

---

### 🟠 ISSUE #7: Insufficient Error Handling in Controllers

**File:** [backend/controllers/cartController.js](backend/controllers/cartController.js#L7)

**Problem:**
```javascript
const getUserCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart) return res.json({ items: [] });  // ❌ What if populate fails?
  res.json(cart);
});
```

**Better:**
```javascript
const getUserCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  // Always return consistent structure
  res.json({
    items: cart?.items || [],
    total: cart?.items?.reduce((sum, item) => sum + (item.product?.price * item.qty || 0), 0) || 0,
    _id: cart?._id
  });
});
```

---

### 🟠 ISSUE #8: Missing CORS Configuration for Credentials

**File:** [backend/server.js](backend/server.js#L38-L55)

**Current:**
```javascript
app.use(
  cors({
    origin: ...,
    credentials: true,  // ✅ Correct
  })
);
```

**⚠️ Note:** Since frontend uses Authorization header (not cookies), `credentials: true` is OK but not strictly needed. However, current CORS config is good.

---

## 📋 PART 2: FRONTEND AUDIT

### 🔴 CRITICAL ISSUE #1: mapBackendProduct finishType Bug

**File:** [frontend/src/lib/mapBackendProduct.ts](frontend/src/lib/mapBackendProduct.ts#L17)

**Problem:**
```typescript
// ❌ WRONG - finishType mapped to category
finishType: item.category ?? "Standard",
```

**Impact:**
- Shop page filters by finishType but gets category values instead
- Duplicate category values appear as finish types
- Filter UI shows product categories, not finishes

**Real Data Flow:**
```
Backend: {category: "Patina Solutions", finishType: "Matte"}
Frontend Maps: {finishType: "Patina Solutions"}  ❌
Expected: {finishType: "Matte"}  ✅
```

**Solution:**
```typescript
finishType: item.finishType ?? item.category ?? "Standard",
```

---

### 🔴 CRITICAL ISSUE #2: CartContext useCallback Dependency Issue

**File:** [frontend/src/context/CartContext.tsx](frontend/src/context/CartContext.tsx#L45)

**Problem:**
```typescript
const syncCart = useCallback(async () => {
  // ...
  setProducts(list.map(mapBackendProduct));  // ❌ mapBackendProduct dependency missing
  // ...
}, [mapBackendProduct]);  // ❌ mapBackendProduct not included in dependency array!
```

**Error:** 
- React will warn about missing dependency
- If `mapBackendProduct` changes, the effect won't update
- Stale closure can cause bugs

**Solution:**
```typescript
const syncCart = useCallback(async () => {
  // Don't include mapBackendProduct in dependency
  // Instead, call it inside useCallback
  const mapped = list.map(it => ({
    product: mapBackendProduct(it.product),
    quantity: Number(it.qty),
  }));
  setItems(mapped);
}, []);  // Empty array is correct here since no external dependencies
```

---

### 🟡 ISSUE #3: API URL Configuration

**File:** [frontend/.env](frontend/.env) and [frontend/src/services/api.ts](frontend/src/services/api.ts)

**Status:** ✅ CORRECT
```env
VITE_API_URL=http://localhost:5000  # ✅ Correct
```

**No issues found - API configuration is good**

---

### 🟠 ISSUE #4: Missing Error Boundary in Shop Component

**File:** [frontend/src/pages/Shop.tsx](frontend/src/pages/Shop.tsx)

**Problem:**
```typescript
{error && !loading && (
  <div className="text-center py-10 text-destructive">{error}</div>
)}
```

**Better:**
```typescript
{error && !loading && (
  <div className="text-center py-10 text-destructive">
    <p className="mb-4">{error}</p>
    <button 
      onClick={() => window.location.reload()}
      className="px-4 py-2 text-primary"
    >
      Retry
    </button>
  </div>
)}
```

---

## 📋 PART 3: DATA FLOW AUDIT

### ✅ Authentication Flow (Working)
```
Frontend Login → POST /api/auth/login → Controllers check password
→ Generate JWT → Return token → Store in localStorage → ✅ OK
```

**All middleware and validation working correctly**

---

### ⚠️ Product Display Flow (BROKEN)

**Flow:**
```
Frontend Shop → useProducts() → GET /api/products 
→ Backend returns products ✅
→ mapBackendProduct() maps finishType ❌ [BUG: maps to category]
→ Shop.tsx displays with wrong finishType ❌
```

**Fix:** Apply finishType mapping fix (Issue #1 in Frontend)

---

### ✅ Cart Flow (Working)
```
Frontend → addToCart → POST /api/cart 
→ Controller adds/updates cart → Returns populated cart ✅
→ CartContext maps items → UI displays ✅
```

**Status:** All flow working correctly

---

### ✅ Order Flow (Working)
```
Frontend Checkout → POST /api/orders 
→ Controller creates order, updates stock ✅
→ Cart cleared ✅
→ User can view orders ✅
```

**Status:** All flow working correctly

---

## 🔥 RECOMMENDED PACKAGES TO REMOVE

```json
// Remove these (they're breaking):
"express-mongo-sanitize": "^2.2.0",  ❌
"xss-clean": "^0.1.4",               ❌

// Keep these (working fine):
"helmet": "^8.1.0",                  ✅
"express-rate-limit": "^8.3.1",      ✅
"bcryptjs": "^3.0.3",                ✅
"mongoose": "^9.3.2",                ✅
```

---

## 🔒 SECURITY IMPROVEMENTS

| Issue | Severity | Fix |
|-------|----------|-----|
| Weak JWT_SECRET | 🔴 Critical | Generate 32-char random secret |
| No rate limiting on auth | 🟡 High | Apply rate limit to `/api/auth/login` |
| No input sanitization | 🟡 Medium | Helmet covers most; add validation on all inputs |
| Missing HTTPS in production | 🔴 Critical | Use HTTPS in production |
| JWT expires in 30 days | 🟠 Medium | Consider shorter expiry (7 days) |

---

## ✨ CODE QUALITY IMPROVEMENTS

### 1. Add TypeScript to Backend
```bash
npm install -D typescript @types/node @types/express
```

### 2. Add Input Validation Middleware
```javascript
// Validate all text inputs
app.use(express.json({ 
  strict: true,
  limit: '10kb'
}));
```

### 3. Better Error Messages
```javascript
// ❌ Bad
throw new Error("Invalid");

// ✅ Good
const err = new Error("Invalid email format");
err.statusCode = 400;
err.code = 'INVALID_EMAIL';
throw err;
```

### 4. Use Environment Variables Validation
```javascript
const required = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
});
```

---

## 📊 SUMMARY OF ALL FIXES NEEDED

| # | File | Issue | Severity | Status |
|---|------|-------|----------|--------|
| 1 | `/backend/validators/schemas.js` | Zod trim() on undefined | 🔴 Critical | 🔧 Need Fix |
| 2 | `/backend/package.json` | Remove deprecated packages | 🔴 Critical | 🔧 Need Fix |
| 3 | `/backend/models/product.js` | Missing finishType | 🔴 Critical | 🔧 Need Fix |
| 4 | `/frontend/src/lib/mapBackendProduct.ts` | Wrong finishType mapping | 🔴 Critical | 🔧 Need Fix |
| 5 | `/frontend/src/context/CartContext.tsx` | useCallback dependency | 🔴 Critical | 🔧 Need Fix |
| 6 | `/backend/.env` | Weak JWT_SECRET | 🟡 High | ⚠️ WARNING |
| 7 | `/backend/config/db.js` | Error handling | 🟠 Medium | 📚 Improve |
| 8 | `/backend/server.js` | Cleanup unused imports | 🟠 Medium | 🧹 Cleanup |

---

## ✅ NEXT STEPS

1. **Immediate (Critical):**
   - Fix Zod validation schemas
   - Remove deprecated packages
   - Add finishType to Product model and map correctly

2. **Short-term (High Priority):**
   - Update .env with proper JWT_SECRET
   - Fix CartContext dependency issue
   - Test all API endpoints

3. **Medium-term (Code Quality):**
   - Add better error handling
   - Add input validation
   - Add TypeScript to backend

4. **Long-term (Production Ready):**
   - Add comprehensive logging
   - Add unit tests
   - Setup CI/CD pipeline
   - Security audit of authentication

---

**Generated:** March 2026
**Status:** Awaiting fixes
