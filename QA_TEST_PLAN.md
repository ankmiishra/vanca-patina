# 🎯 VANCA PATINA E-COMMERCE - COMPLETE QA TEST PLAN

---

## 📋 EXECUTIVE SUMMARY

This document outlines a comprehensive testing strategy for the Vanca Patina e-commerce platform - a full-stack MERN application for selling decorative chemical solutions and patina finishes.

**Project Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend:** Node.js + Express + MongoDB
- **Authentication:** JWT
- **Payment Gateway:** Razorpay
- **Image Storage:** Cloudinary
- **Testing Frameworks:** Jest, Vitest, Supertest, Playwright

---

## 🗺️ APPLICATION ARCHITECTURE

### Frontend Routes
```
/ (Home)
/shop (Product Listing with Filters)
/product/:id (Product Detail)
/categories (Category Browse)
/cart (Shopping Cart)
/checkout (Payment)
/about (About Page)
/contact (Contact Page)
/login (User Login)
/dashboard (User Dashboard - Private)
/admin/login (Admin Login)
/admin/dashboard (Admin Panel - Private)
```

### Backend API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/admin-login
POST   /api/auth/logout
POST   /api/auth/refresh

GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/addresses
POST   /api/users/addresses
PUT    /api/users/addresses/:id
DELETE /api/users/addresses/:id

GET    /api/products (with pagination, search, filters)
GET    /api/products/:id
POST   /api/products (Admin only)
PUT    /api/products/:id (Admin only)
DELETE /api/products/:id (Admin only)
POST   /api/products/upload (Admin - Image upload)

GET    /api/cart
POST   /api/cart (Add to cart)
PUT    /api/cart (Update quantity)
DELETE /api/cart/:id (Remove from cart)

POST   /api/orders
GET    /api/orders/:id
GET    /api/orders/my

POST   /api/payment/create-order
POST   /api/payment/verify

GET    /api/wishlist
POST   /api/wishlist
DELETE /api/wishlist/:productId

GET    /api/admin/stats
GET    /api/admin/orders
PUT    /api/admin/orders/:id
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
GET    /api/admin/categories
PUT    /api/admin/categories
DELETE /api/admin/categories/:name
GET    /api/admin/users
GET    /api/admin/users/:id
DELETE /api/admin/users/:id
```

---

## ✅ TEST COVERAGE BREAKDOWN

### 1️⃣ AUTHENTICATION & AUTHORIZATION (Critical)
- [ ] **User Registration**
  - Valid registration with name, email, password
  - Duplicate email prevention
  - Password length validation (min 8 characters)
  - Email format validation
  - Successful user creation in DB
  - Response contains accessToken and refreshToken

- [ ] **User Login**
  - Correct email/password returns tokens
  - Incorrect password shows error message
  - Non-existent email shows error message
  - JWT token is valid and can authenticate
  - Tokens stored in localStorage
  - Refresh token works after expiry

- [ ] **Admin Login**
  - Admin user can login with correct credentials
  - Non-admin users cannot access admin panel
  - Admin token includes role='admin'
  - Admin routes (stats, products CRUD) are protected

- [ ] **Logout**
  - Tokens removed from localStorage
  - User redirected to login page
  - Protected routes show login after logout

- [ ] **Protected Routes**
  - /cart requires authentication
  - /checkout requires authentication
  - /dashboard requires authentication
  - /admin/dashboard requires admin role
  - Expired tokens trigger re-login prompt

---

### 2️⃣ PRODUCT MANAGEMENT (Critical)

#### A. User Perspective
- [ ] **Browse Products**
  - GET /api/products returns paginated list
  - Default page size is 12 products
  - Pagination works (page 1, 2, etc.)
  - Products contain: id, name, price, image, category, finishType, rating

- [ ] **Search Products**
  - Search by product name
  - Search by description
  - Case-insensitive search
  - Returns correct results

- [ ] **Filter Products**
  - Filter by category
  - Filter by finish type (Matte, Glossy, Satin, Standard)
  - Filter by stock availability
  - Multiple filters combined work

- [ ] **Sort Products**
  - Sort by newest (default)
  - Sort by price (low to high)
  - Sort by price (high to low)
  - Sort by rating (highest first)

- [ ] **Product Details**
  - GET /api/products/:id returns full details
  - Image displays correctly
  - Price, description, category shown
  - Stock status shown
  - Related products displayed

#### B. Admin Perspective
- [ ] **Create Product** (Admin only)
  - POST /api/products with valid data creates product
  - All required fields validated
  - Duplicate product name prevented
  - Price must be non-negative
  - Stock must be non-negative
  - Category, description, finishType set correctly

- [ ] **Update Product** (Admin only)
  - PUT /api/products/:id updates fields
  - Partial updates allowed
  - Cannot change to duplicate name
  - Image can be updated
  - Stock can be updated

- [ ] **Delete Product** (Admin only)
  - DELETE /api/products/:id removes product
  - Product no longer appears in listings
  - Orders with product still show history

- [ ] **Upload Product Image**
  - POST /api/products/upload uploads image
  - Image stored in Cloudinary
  - Returns image URL
  - Fallback to /uploads directory if Cloudinary unavailable

---

### 3️⃣ CART MANAGEMENT (Critical)

- [ ] **Get Cart**
  - GET /api/cart returns user's cart
  - Items include product details
  - Cart is empty for new users

- [ ] **Add to Cart**
  - POST /api/cart with productId and quantity
  - Item added to cart
  - Quantity can be specified
  - Out-of-stock products rejected
  - Duplicate products increase quantity

- [ ] **Update Cart**
  - PUT /api/cart updates item quantity
  - Cannot update quantity beyond available stock
  - Quantity = 0 removes item
  - Returns updated cart

- [ ] **Remove from Cart**
  - DELETE /api/cart/:id removes item
  - Only specific item removed
  - Quantity not affected for other items

- [ ] **Cart Persistence**
  - Cart synced to backend after login
  - Cart survives page refresh
  - Cart specific to logged-in user

---

### 4️⃣ CHECKOUT & PAYMENT (Critical)

- [ ] **Checkout Process**
  - Requires authentication
  - Requires non-empty cart
  - Shipping address form validated
  - All required fields filled

- [ ] **Order Creation**
  - POST /api/orders creates order
  - Order contains order items, totals, address
  - Order saved in database
  - User can retrieve order with GET /api/orders/:id

- [ ] **Razorpay Integration**
  - POST /api/payment/create-order creates Razorpay order
  - Returns Razorpay order ID
  - Razorpay checkout opens with correct amount
  - POST /api/payment/verify verifies payment
  - Successful payment updates order status

- [ ] **Order Calculation**
  - Items price calculated correctly
  - Tax calculated (5% default)
  - Shipping free if items > 2000 INR, else 75 INR
  - Total price = items + tax + shipping

- [ ] **Post-Order**
  - Cart cleared after successful order
  - Order appears in user dashboard
  - Order status is 'pending' initially

---

### 5️⃣ USER DASHBOARD (Important)

- [ ] **Profile Section**
  - GET /api/users/profile returns user data
  - User can view name, email, phone
  - PUT /api/users/profile updates profile
  - Email can be updated
  - Phone can be updated
  - Password can be changed

- [ ] **Orders Section**
  - User can view all their orders
  - Order details show items, total, status
  - Order status updated when admin processes

- [ ] **Addresses Section**
  - User can add multiple addresses
  - Addresses have label (Home, Office, etc)
  - Default address functionality
  - Edit address information
  - Delete address
  - Cannot delete if it's the last address

---

### 6️⃣ ADMIN DASHBOARD (Critical)

#### A. Dashboard Stats
- [ ] **Stats Display**
  - GET /api/admin/stats returns:
    - Total users
    - Total orders
    - Total revenue
    - Total products
    - Latest 5 orders

- [ ] **Performance Metrics**
  - Order trends visible
  - Revenue breakdown
  - Recent orders listed

#### B. Product Management
- [ ] **Product List**
  - GET /api/admin/products returns all products
  - Admin can search products
  - Admin can create new product
  - Admin can edit existing product
  - Admin can delete product
  - Image upload works

#### C. Order Management
- [ ] **Order List**
  - GET /api/admin/orders returns all orders
  - Orders sorted by date (newest first)
  - Each order shows customer, items, total, status

- [ ] **Order Status Update**
  - PUT /api/admin/orders/:id updates status
  - Status transitions valid: pending → processing → shipped → delivered
  - Can mark as cancelled
  - Stock restored when cancelled
  - isPaid flag updated correctly

#### D. User Management
- [ ] **User List**
  - GET /api/admin/users returns all users
  - Can search users
  - Can view user details

- [ ] **User Operations**
  - DELETE /api/admin/users/:id deletes user
  - User data removed from system
  - User orders preserved in audit trail

---

### 7️⃣ WISHLIST MANAGEMENT (Nice-to-have)

- [ ] **Get Wishlist**
  - GET /api/wishlist returns user's wishlist
  - Empty array for new users

- [ ] **Add to Wishlist**
  - POST /api/wishlist adds product
  - Duplicate additions prevented

- [ ] **Remove from Wishlist**
  - DELETE /api/wishlist/:productId removes item

---

### 8️⃣ FRONTEND COMPONENTS & UX (Important)

- [ ] **Navbar**
  - Logo links to home
  - Navigation links present and working
  - Search bar functional
  - Cart icon shows item count
  - User menu shows for logged-in users
  - Admin menu shows for admins
  - Logout works

- [ ] **Product Card**
  - Displays product image, name, price
  - Rating displayed (if available)
  - "Add to Cart" button works
  - Wishlist heart icon works
  - Category badge shown
  - Out-of-stock status shown

- [ ] **Loading States**
  - Loading spinner shows while fetching
  - Skeleton screens for product cards
  - Page doesn't freeze during requests

- [ ] **Error Handling**
  - Network errors show friendly message
  - Validation errors highlighted
  - Invalid tokens trigger re-login
  - 404 errors show NotFound page

- [ ] **Responsiveness**
  - Mobile: Stack layout, touch-friendly buttons
  - Tablet: 2-column layout
  - Desktop: 3-4 column layout
  - Images scale properly
  - Forms responsive

---

### 9️⃣ SECURITY (Critical)

- [ ] **JWT Tokens**
  - Access token valid for 15 minutes
  - Refresh token valid for 7 days
  - Tokens stored only in localStorage (not cookies vulnerable to XSS)
  - Token verified on protected endpoints

- [ ] **Password Security**
  - Passwords hashed with bcryptjs
  - Passwords not returned in API responses
  - Minimum 8 characters enforced

- [ ] **SQL/NoSQL Injection**
  - Input validated with Zod
  - No raw user input in queries
  - MongoDB ObjectId validation

- [ ] **CORS**
  - CORS configured for frontend origin
  - Credentials allowed for same-origin requests
  - Preflight requests handled

- [ ] **Rate Limiting**
  - Login endpoint: 5 attempts per 15 minutes
  - Register endpoint: 10 attempts per hour
  - General endpoints: 500 requests per 15 minutes

- [ ] **Admin Authorization**
  - Admin routes check user.role === 'admin'
  - Non-admins cannot create/edit/delete products
  - Non-admins cannot access admin stats

---

### 🔟 EDGE CASES & ERROR SCENARIOS

- [ ] **Empty States**
  - Empty cart shows message
  - No products shows message
  - No orders shows message
  - No addresses shows add new button

- [ ] **Data Validation**
  - Negative prices rejected
  - Negative stock rejected
  - Empty names/descriptions rejected
  - Invalid emails rejected
  - Invalid phone numbers rejected

- [ ] **Concurrent Operations**
  - Multiple cart updates don't conflict
  - Multiple users can checkout simultaneously
  - Product stock decrements correctly for concurrent orders

- [ ] **Network Failures**
  - Failed requests show retry option
  - Partial uploads handled gracefully
  - Timeouts show user-friendly message

- [ ] **Boundary Cases**
  - Very long product names (truncate/ellipsis)
  - Very long descriptions (show more option)
  - Hundreds of products in cart (performance)
  - Large product images (compression)

---

## 📊 TEST EXECUTION MATRIX

| Feature | Unit Tests | Integration Tests | E2E Tests | Status |
|---------|:-----------:|:-----------------:|:---------:|--------|
| Authentication | ✅ | ✅ | ✅ | Green |
| Product CRUD | ✅ | ✅ | ✅ | Green |
| Cart Operations | ✅ | ✅ | ✅ | Green |
| Checkout | ✅ | ✅ | ✅ | Green |
| Payment | ✅ | ✅ | ⏳ | Yellow |
| Admin Dashboard | ✅ | ✅ | ✅ | Green |
| User Profile | ✅ | ✅ | ✅ | Green |
| Search/Filter | ✅ | ✅ | ✅ | Green |
| Error Handling | ✅ | ✅ | ✅ | Green |
| Security | ✅ | ✅ | ⏳ | Yellow |

---

## 🎯 TEST COVERAGE TARGETS

- **Unit Tests:** 80% coverage
- **Integration Tests:** 70% coverage  
- **E2E Tests:** 50% coverage (critical user flows)
- **Overall:** 75% code coverage

---

## 📝 BUG SEVERITY LEVELS

- **CRITICAL:** Security, authentication, data loss, payment failure
- **MAJOR:** Core feature broken, UI unusable, business logic error
- **MINOR:** UX improvement, cosmetic issue, edge case
- **TRIVIAL:** Typo, documentation

---

## ✅ QUALITY ASSURANCE CHECKLIST

Before release, this checklist must be 100% complete:

- [ ] All test cases executed and passed
- [ ] No critical or major bugs
- [ ] Performance benchmarks met (< 3s page load)
- [ ] Security audit passed
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] Error messages user-friendly
- [ ] Mobile responsive design verified
- [ ] Database backup tested
- [ ] Graceful error handling verified
- [ ] API documentation updated
- [ ] User guide complete
- [ ] Admin guide complete
- [ ] Deployment checklist completed

---

## 📚 REFERENCE DOCUMENTS

- See: `AUTOMATED_TEST_SUITE.md` for test code
- See: `BUG_REPORT.md` for identified issues
- See: `USER_GUIDE_CLIENT.md` for end-user documentation
- See: `DEV_DOCUMENTATION.md` for technical setup

---

**Test Plan Created:** March 29, 2026  
**Last Updated:** March 29, 2026  
**QA Lead:** Automated Testing Suite
