# 🐞 BUG REPORT & ISSUES FOUND

**Report Generated:** March 29, 2026  
**Project:** Vanca Patina E-Commerce Platform  
**Status:** QA Analysis Complete

---

## 🔴 CRITICAL BUGS (MUST FIX)

### BUG #1: Deprecated Auth Middleware Compatibility
**Severity:** CRITICAL  
**Status:** ⚠️ Code Review  
**Location:** `backend/server.js`, lines 30-32  

**Issue:**
The code uses `xss-clean` (line 32) and `express-mongo-sanitize` (line 31) which are deprecated and incompatible with Express 5.x.

**Current Code:**
```javascript
// app.use(mongoSanitize());
// app.use(xssClean());
```

**Problem:**
- These packages are commented out due to Express 5.x incompatibility
- Input validation is partially bypassed
- Security vulnerability if used with older packages

**Fix:**
Replace with proper Zod validation (already done):
```javascript
// Input validation is now done via Zod schemas in validators/
// Each endpoint validates with: validate(schema)
```

**Impact:** Medium - Currently mitigated by Zod validation  
**Test:** ✅ Validate all endpoints use Zod schemas

---

### BUG #2: Razorpay Key Validation
**Severity:** CRITICAL  
**Status:** ⚠️ Code Review  
**Location:** `backend/controllers/paymentController.js`, lines 10-14  

**Issue:**
If `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` are not configured, the payment endpoint fails silently.

**Current Code:**
```javascript
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({...});
}
```

**Problem:**
- No warning logged to console during startup if keys missing
- Frontend might attempt checkout without realizing payment is unavailable
- Orders might get created without proper payment

**Fix:**
```javascript
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️ WARNING: Razorpay credentials not configured!');
  console.warn('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
}
```

**Impact:** Critical for production  
**Test:** Verify payment endpoint returns error if keys missing

---

### BUG #3: Token Expiry Handling
**Severity:** CRITICAL  
**Status:** 🔴 Needs Fix  
**Location:** `frontend/src/services/api.ts` (doesn't exist - needs implementation)

**Issue:**
No automatic token refresh when access token expires. When JWT expires, user gets 401 but cannot automatically refresh.

**Current Flow:**
1. User logs in - access token stored (15 min expiry)
2. After 15 minutes, API returns 401
3. User must manually refresh page to get new token
4. Refresh token (7 day expiry) is never used

**Expected Flow:**
1. User logs in
2. When access token expires, API interceptor automatically calls `/api/auth/refresh`
3. New token obtained and request retried
4. Seamless experience for user

**Fix Required:**
Add axios interceptor to handle token refresh:
```typescript
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const newToken = await api.post('/api/auth/refresh', { refreshToken });
      localStorage.setItem('token', newToken.data.accessToken);
      error.config.headers.Authorization = `Bearer ${newToken.data.accessToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

**Impact:** Critical for user experience  
**Priority:** High

---

## 🟠 MAJOR BUGS (SHOULD FIX)

### BUG #4: Product Image Fallback Missing
**Severity:** MAJOR  
**Status:** 🔴 Needs Fix  
**Location:** `frontend/src/lib/mapBackendProduct.ts`

**Issue:**
When product image URL is invalid, the component crashes instead of showing placeholder.

**Problem:**
```typescript
// If image URL is invalid or missing, it shows broken image icon
const imageUrl = product.image || 'placeholder.svg'; // May still be invalid
```

**Fix:**
Implement image fallback:
```typescript
const getProductImage = (url: string | undefined): string => {
  if (!url) return '/placeholder.svg';
  
  // Validate URL format
  if (url.startsWith('http') || url.startsWith('/')) {
    return url;
  }
  
  return '/placeholder.svg';
};
```

**Impact:** Users see broken images  
**Priority:** Medium

---

### BUG #5: Cart Sync Race Condition
**Severity:** MAJOR  
**Status:** ⚠️ Code Review  
**Location:** `frontend/src/context/CartContext.tsx`, lines 37-50

**Issue:**
When user logs in, `syncCart()` is called but if they immediately navigate to another page, cart might not finish syncing.

**Problem:**
```typescript
useEffect(() => {
  if (token) void syncCart(); // Fire and forget - no error handling
}, [token]);
```

**Consequences:**
- Cart items might not load
- User adds to cart while sync is happening - duplicate items
- Race conditions in concurrent operations

**Fix:**
```typescript
useEffect(() => {
  let isMounted = true;
  
  if (token) {
    syncCart().finally(() => {
      if (isMounted) setCartReady(true);
    });
  }
  
  return () => { isMounted = false; };
}, [token]);
```

**Impact:** Cart inconsistencies  
**Priority:** Medium

---

### BUG #6: Admin Stock Restoration Logic
**Severity:** MAJOR  
**Status:** ⚠️ Code Review  
**Location:** `backend/controllers/adminController.js`, lines 85-91

**Issue:**
When order is cancelled, stock is restored but only for non-delivered orders. If admin accidentally cancels delivered order, stock gets restored incorrectly.

**Current Code:**
```javascript
if (status === "cancelled") {
  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } })
    )
  );
}
```

**Problem:**
- No check if order was already delivered
- Stock could go negative if multiple cancellations
- No audit trail

**Fix:**
```javascript
if (status === "cancelled") {
  if (order.status === "delivered") {
    return res.status(400).json({ 
      message: "Cannot cancel delivered order" 
    });
  }
  
  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.qty }, $max: { stock: item.originalStock } }
      )
    )
  );
}
```

**Impact:** Inventory inconsistency  
**Priority:** Medium

---

### BUG #7: Email Validation Not Case-Insensitive Everywhere
**Severity:** MAJOR  
**Status:** ⚠️ Code Review  
**Location:** Multiple places

**Issue:**
Email validation is case-insensitive in some places but not others.

**Examples:**
- Register schema does `.toLowerCase()` ✅
- Login schema does `.toLowerCase()` ✅
- But user queries might not normalize ❌

**Problem:**
User could register as "John@Example.com" and login as "john@example.com" - works fine due to schema transforms, but if direct query is used somewhere, it might fail.

**Fix:**
Always normalize in User model:
```javascript
UserSchema.pre('save', async function() {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  // ... hash password
});
```

**Impact:** Edge case potentials  
**Priority:** Low

---

## 🟡 MINOR ISSUES (NICE-TO-HAVE FIXES)

### ISSUE #8: Product Delete Cascade
**Severity:** MINOR  
**Status:** 💡 Enhancement  

**Issue:**
When deleting a product, wishlist items and cart items with that product aren't cleaned up.

**Impact:**
- Wishlist has broken references
- Cart shows deleted product
- Frontend might crash if not handled

**Fix:**
Add cascade delete or cleanup middleware:
```javascript
productSchema.post('findByIdAndDelete', async (doc) => {
  if (doc) {
    await Wishlist.updateMany(
      {},
      { $pull: { products: doc._id } }
    );
    // Also cleanup cart items
  }
});
```

---

### ISSUE #9: Pagination Performance
**Severity:** MINOR  
**Status:** 💡 Enhancement  

**Issue:**
Without pagination limit on large collections, queries could be slow.

**Current:**
```javascript
const pageSize = req.query.pageSize ?? 12;
```

**Enhancement:**
```javascript
const pageSize = Math.min(req.query.pageSize ?? 12, 100); // Max 100 per page
```

---

### ISSUE #10: Missing Input Trimming
**Severity:** MINOR  
**Status:** 💡 Enhancement  

**Issue:**
User input like "  John  " isn't trimmed everywhere.

**Fix:**
Add middleware to trim all string inputs:
```javascript
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
});
```

---

### ISSUE #11: Floating Point Math in Prices
**Severity:** MINOR  
**Status:** ⚠️ Code Review  

**Issue:**
Using JavaScript numbers for currency can have precision issues.

**Current:**
```javascript
const totalPrice = itemsPrice + taxPrice + shippingPrice;
```

**Better:**
```javascript
// Use cents to avoid floating point
const totalPaisaPrice = Math.round(
  (itemsPrice * 100 + taxPaisaAmount + shippingPaisaAmount)
);
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Token refresh interceptor implemented
- [ ] Razorpay keys validated on startup
- [ ] Image fallback implemented
- [ ] Cart sync race condition fixed
- [ ] Admin stock restoration logic reviewed
- [ ] Email case-insensitivity standardized
- [ ] Product delete cascade handled
- [ ] Pagination limits set
- [ ] Input trimming middleware added
- [ ] Price calculation uses fixed-point arithmetic
- [ ] All tests pass
- [ ] Security audit passed

---

## 📊 SUMMARY

| Severity | Count | Fix Status |
|----------|-------|-----------|
| 🔴 Critical | 3 | ⚠️ Needs Implementation |
| 🟠 Major | 4 | ⚠️ In Review |
| 🟡 Minor | 4 | 💡 Enhancement |
| **Total** | **11** | |

---

## 🎯 PRIORITY ORDER FOR FIXES

1. **CRITICAL:** Token refresh interceptor
2. **CRITICAL:** Razorpay configuration warning
3. **CRITICAL:** Auth middleware deprecation
4. **MAJOR:** Cart sync race condition
5. **MAJOR:** Admin stock restoration
6. **MAJOR:** Product image fallback
7. **MAJOR:** Email case-insensitivity
8. **MINOR:** Other enhancements

---

**Report Status:** ✅ Complete  
**Next Steps:** Developer review and implementation  
**Estimated Fix Time:** 4-6 hours

