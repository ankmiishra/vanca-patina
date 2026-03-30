# 🛠 DEVELOPER DOCUMENTATION

**Project:** Vanca Patina E-Commerce Platform  
**Version:** 1.0.0  
**Last Updated:** March 29, 2026

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Running Locally](#running-locally)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Authentication Flow](#authentication-flow)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting](#troubleshooting)
12. [Performance Optimization](#performance-optimization)

---

## 📌 PROJECT OVERVIEW

### What is Vanca Patina?
A full-stack MERN e-commerce platform for selling decorative chemical solutions and patina finishes. The platform includes:
- **Customer Interface:** Browse, search, filter, add to cart, checkout, track orders
- **Admin Interface:** Manage products, orders, users, and view analytics
- **Payment Integration:** Razorpay for secure payment processing
- **Authentication:** JWT-based user authentication with role-based access control

### Key Features
✅ User registration & authentication  
✅ Product catalog with search, filters, sorting  
✅ Shopping cart with persistent storage  
✅ Order management & payment integration  
✅ User dashboard (profile, orders, addresses)  
✅ Admin dashboard (stats, products CRUD, order management, user management)  
✅ Wishlist functionality  
✅ Rate limiting & security measures  
✅ Image upload to Cloudinary  

---

## 💻 TECH STACK

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool (fast development)
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Vitest** - Unit testing
- **Playwright** - E2E testing

### Backend
- **Node.js** - Runtime
- **Express 5.x** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Cloudinary** - Cloud storage
- **Razorpay SDK** - Payment processing
- **Zod** - Schema validation
- **Jest + Supertest** - API testing
- **Swagger** - API documentation

### DevOps & Tools
- **Git** - Version control
- **Docker** - Containerization (optional)
- **PM2** - Process manager (production)
- **Vercel/Netlify** - Frontend hosting
- **Heroku/Render** - Backend hosting
- **MongoDB Atlas** - Managed database

---

## 📁 PROJECT STRUCTURE

```
vanca-patina/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── cloudinary.js      # Cloudinary config
│   │   └── swagger.js         # API documentation
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── userController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   └── wishlistController.js
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   └── Wishlist.js
│   ├── routes/               # API endpoints
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── userRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── adminRoutes.js
│   │   └── wishlistRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT verification
│   │   ├── uploadMiddleware.js
│   │   └── errorMiddleware.js
│   ├── validators/
│   │   ├── schemas.js        # Zod validation schemas
│   │   └── validate.js       # Validation middleware
│   ├── utils/
│   │   ├── asyncHandler.js   # Error wrapper
│   │   ├── generateToken.js
│   │   ├── generateRefreshToken.js
│   │   └── emailService.js
│   ├── tests/               # Jest tests
│   │   └── api.test.js
│   ├── scripts/             # Utility scripts
│   │   ├── seed.js
│   │   ├── seedProducts.js
│   │   ├── seedAdmin.js
│   │   └── createAdmin.js
│   ├── server.js            # Express app entry
│   ├── package.json
│   └── .env                 # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── auth/
│   │   ├── pages/          # Full page components
│   │   │   ├── Index.tsx
│   │   │   ├── Shop.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   └── ...
│   │   ├── context/         # React Context
│   │   │   ├── AuthContext.tsx
│   │   │   └── CartContext.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useProducts.ts
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── services/       # API calls
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── ordersService.ts
│   │   │   └── ...
│   │   ├── lib/           # Utilities
│   │   │   ├── utils.ts
│   │   │   └── mapBackendProduct.ts
│   │   ├── types/         # TypeScript types
│   │   │   └── product.ts
│   │   ├── tests/         # Vitest tests
│   │   │   └── components.test.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── e2e/               # Playwright tests
│   │   └── tests.spec.ts
│   ├── public/            # Static assets
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env
│
└── Documentation/
    ├── QA_TEST_PLAN.md
    ├── BUG_REPORT.md
    ├── USER_GUIDE_CLIENT.md
    └── DEV_DOCUMENTATION.md
```

---

## 🔧 ENVIRONMENT SETUP

### Prerequisites
- **Node.js:** v18 or higher
- **npm/yarn:** Latest version
- **MongoDB:** Local or MongoDB Atlas
- **Git:** For version control

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vanca-patina?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_32_characters_minimum_required_absolutely

# Server
NODE_ENV=development
PORT=5000

# CORS
CLIENT_URL=http://localhost:5173

# Cloudinary (Image Storage)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (Payment)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key

# Tax Rate
TAX_RATE=0.05  # 5%

# Email (Optional - for future use)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
# API Base URL (Backend API)
VITE_API_URL=http://localhost:5000

# App Name
VITE_APP_NAME=Vanca Patina

# Feature Flags
VITE_ENABLE_RAZORPAY=true
VITE_ENABLE_COD=true
```

### Getting API Keys

**Cloudinary:**
1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy CLOUD_NAME, API_KEY, API_SECRET

**Razorpay:**
1. Sign up at https://razorpay.com
2. Go to Settings → API Keys
3. Copy Key ID and Secret (Test keys for development)

**MongoDB Atlas:**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster (Free tier available)
3. Get connection string
4. Replace username, password in URI

---

## 🚀 RUNNING LOCALLY

### Backend Setup & Run

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start MongoDB (if local)
mongod

# Run development server (with auto-reload)
npm run dev

# Or start production server
npm start

# Server runs on http://localhost:5000
```

### Frontend Setup & Run

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Frontend runs on http://localhost:5173
# Open browser and visit http://localhost:5173
```

### Verify Setup

**Backend API:**
```bash
curl http://localhost:5000/api/products
# Should return JSON with products
```

**Frontend:**
Visit http://localhost:5173 in browser - should see home page

---

## 📡 API DOCUMENTATION

### Base URL
```
http://localhost:5000
```

### Authentication Header
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### Response Format

**Success (200):**
```json
{
  "data": { ... },
  "message": "Success"
}
```

**Error (400+):**
```json
{
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

---

### 🔐 AUTHENTICATION ENDPOINTS

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (201):
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "_id": "user_id",
  "email": "john@example.com",
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### Admin Login
```
POST /api/auth/admin-login
Authorization: Bearer <token>

Same as login, but user must have role: "admin"
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200):
{ "message": "Logged out successfully" }
```

#### Refresh Token
```
POST /api/auth/refresh

{
  "refreshToken": "refresh_token_from_localstorage"
}

Response (200):
{
  "accessToken": "new_jwt_token"
}
```

---

### 📦 PRODUCT ENDPOINTS

#### Get All Products (Public)
```
GET /api/products?pageSize=12&pageNumber=1&search=patina&category=Chemicals&sortBy=price-asc

Query Parameters:
- pageSize: 1-500 (default: 12)
- pageNumber: 1+ (default: 1)
- search/keyword: text search
- category: filter by category
- inStock: true/false
- sortBy: newest|price-asc|price-desc|rating

Response (200):
{
  "products": [
    {
      "_id": "product_id",
      "name": "Matte Patina",
      "price": 500,
      "category": "Chemicals",
      "description": "...",
      "stock": 10,
      "finishType": "Matte",
      "ratings": 4.5,
      "numReviews": 10,
      "image": "url"
    }
  ],
  "page": 1,
  "pages": 5,
  "total": 50
}
```

#### Get Single Product (Public)
```
GET /api/products/:id

Response (200):
{
  "_id": "product_id",
  "name": "Matte Patina",
  ...full product object
}
```

#### Create Product (Admin Only)
```
POST /api/admin/products
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "name": "New Product",
  "price": 500,
  "category": "Chemicals",
  "description": "Product description here",
  "stock": 50,
  "finishType": "Matte"
}

Response (201):
{ ...product object created }
```

#### Update Product (Admin Only)
```
PUT /api/admin/products/:id
Authorization: Bearer <adminToken>

{
  "name": "Updated Name",
  "price": 600
  // any fields to update
}

Response (200):
{ ...updated product }
```

#### Delete Product (Admin Only)
```
DELETE /api/admin/products/:id
Authorization: Bearer <adminToken>

Response (200):
{ "message": "Product deleted" }
```

---

### 🛒 CART ENDPOINTS

#### Get User Cart
```
GET /api/cart
Authorization: Bearer <token>

Response (200):
{
  "user": "user_id",
  "items": [
    {
      "_id": "cart_item_id",
      "product": { ...product details },
      "qty": 2
    }
  ]
}
```

#### Add to Cart
```
POST /api/cart
Authorization: Bearer <token>

{
  "productId": "product_id",
  "qty": 2
}

Response (201):
{ ...cart with items }
```

#### Update Cart Item Quantity
```
PUT /api/cart
Authorization: Bearer <token>

{
  "productId": "product_id",
  "qty": 5
}

Response (200):
{ ...updated cart }
```

#### Remove from Cart
```
DELETE /api/cart/:itemId
Authorization: Bearer <token>

Response (200):
{ ...cart after removal }
```

---

### 📋 ORDER ENDPOINTS

#### Create Order
```
POST /api/orders
Authorization: Bearer <token>

{
  "shippingAddress": {
    "address": "123 Main St",
    "city": "Boston",
    "postalCode": "02101",
    "country": "India"
  },
  "paymentMethod": "COD"  // or "Razorpay"
}

Response (201):
{
  "_id": "order_id",
  "user": "user_id",
  "orderItems": [...],
  "status": "pending",
  "itemsPrice": 1000,
  "taxPrice": 50,
  "shippingPrice": 75,
  "totalPrice": 1125
}
```

#### Get User Orders
```
GET /api/orders/my
Authorization: Bearer <token>

Response (200):
[ ...array of user's orders ]
```

#### Get Order Details
```
GET /api/orders/:id
Authorization: Bearer <token>

Response (200):
{ ...order details }
```

---

### 💳 PAYMENT ENDPOINTS

#### Create Razorpay Order
```
POST /api/payment/create-order
Authorization: Bearer <token>

Response (200):
{
  "orderId": "razorpay_order_id",
  "amount": 112500,  // in paisa
  "currency": "INR"
}
```

#### Verify Payment
```
POST /api/payment/verify
Authorization: Bearer <token>

{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature"
}

Response (200):
{
  "message": "Payment verified",
  "order": { ...order details }
}
```

---

### 👥 USER ENDPOINTS

#### Get User Profile
```
GET /api/users/profile
Authorization: Bearer <token>

Response (200):
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9999999999",
  "role": "user",
  "addresses": [...]
}
```

#### Update User Profile
```
PUT /api/users/profile
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "phone": "9999999999"
}

Response (200):
{ ...updated user }
```

#### Get User Addresses
```
GET /api/users/addresses
Authorization: Bearer <token>

Response (200):
[
  {
    "_id": "address_id",
    "label": "Home",
    "address": "123 Main St",
    "city": "Boston",
    "postalCode": "02101",
    "country": "India",
    "isDefault": true
  }
]
```

#### Add Address
```
POST /api/users/addresses
Authorization: Bearer <token>

{
  "label": "Office",
  "address": "456 Work Ave",
  "city": "Boston",
  "postalCode": "02101",
  "country": "India",
  "isDefault": false
}

Response (201):
{ ...created address }
```

#### Update Address
```
PUT /api/users/addresses/:addressId
Authorization: Bearer <token>

{ ...fields to update }

Response (200):
{ ...updated address }
```

#### Delete Address
```
DELETE /api/users/addresses/:addressId
Authorization: Bearer <token>

Response (200):
{ "message": "Address deleted" }
```

---

### 👨‍💼 ADMIN ENDPOINTS

#### Get Dashboard Stats
```
GET /api/admin/stats
Authorization: Bearer <adminToken>

Response (200):
{
  "totalUsers": 100,
  "totalOrders": 50,
  "totalRevenue": 50000,
  "totalProducts": 150,
  "latestOrders": [...]
}
```

#### Get All Orders
```
GET /api/admin/orders
Authorization: Bearer <adminToken>

Response (200):
[ ...all orders ]
```

#### Update Order Status
```
PUT /api/admin/orders/:id
Authorization: Bearer <adminToken>

{
  "status": "processing"  // pending|processing|shipped|delivered|cancelled
}

Response (200):
{ ...updated order }
```

#### Get All Products
```
GET /api/admin/products
Authorization: Bearer <adminToken>

Response (200):
[ ...all products ]
```

#### Get All Users
```
GET /api/admin/users
Authorization: Bearer <adminToken>

Response (200):
[ ...all users ]
```

#### Get User Details
```
GET /api/admin/users/:id
Authorization: Bearer <adminToken>

Response (200):
{ ...user details }
```

#### Delete User
```
DELETE /api/admin/users/:id
Authorization: Bearer <adminToken>

Response (200):
{ "message": "User deleted" }
```

---

## 🗄️ DATABASE SCHEMA

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  phone: String,
  addresses: [{
    label: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    isDefault: Boolean
  }],
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    createdAt: Date
  }],
  otp: String,
  otpExpiry: Date,
  isVerified: Boolean (default: true),
  isBlocked: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  price: Number (required),
  image: String,
  images: [String],
  category: String (required),
  description: String (required),
  stock: Number (default: 0),
  finishType: String (enum: ['Matte', 'Glossy', 'Satin', 'Standard']),
  ratings: Number (default: 0),
  numReviews: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### Cart Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    qty: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  orderItems: [{
    product: ObjectId (ref: Product),
    name: String,
    qty: Number,
    image: String,
    price: Number
  }],
  shippingAddress: {
    address: String,
    city: String,
    postalCode: String,
    country: String
  },
  itemsPrice: Number,
  taxPrice: Number,
  shippingPrice: Number,
  totalPrice: Number,
  paymentMethod: String,
  status: String (enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  isPaid: Boolean,
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 AUTHENTICATION FLOW

### JWT Token Flow

```
1. USER REGISTRATION
   POST /api/auth/register
   → Create user (password hashed)
   → Generate access + refresh tokens
   → Return tokens

2. USER LOGIN
   POST /api/auth/login
   → Verify email & password
   → Generate access + refresh tokens
   → Return tokens

3. PROTECTED API CALL
   GET /api/cart
   Header: Authorization: Bearer <accessToken>
   → Middleware verifies JWT
   → Extracts user ID from token
   → Proceeds with request

4. TOKEN EXPIRY (Access Token - 15 min)
   Automatic: axios interceptor handles
   → Calls POST /api/auth/refresh
   → Sends refresh token
   → Get new access token
   → Retry original request

5. LOGOUT
   POST /api/auth/logout
   → Clear localStorage tokens
   → Redirect to login
```

### Token Storage (Frontend)
```javascript
// Stored in localStorage (vulnerable to XSS if not protected)
localStorage.getItem('token')              // Access token
localStorage.getItem('refreshToken')       // Refresh token
localStorage.getItem('user')               // User data
localStorage.getItem('role')               // User role
```

**Security Recommendation:**  
Consider using HTTP-only cookies for token storage in production.

---

## 🧪 TESTING STRATEGY

### Run Tests

**Backend:**
```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage     # With coverage report
```

**Frontend:**
```bash
cd frontend
npm test                    # Vitest unit tests
npm test -- --coverage     # With coverage
npx playwright test         # E2E tests
```

### Test Structure

**Backend (`backend/tests/`):**
- `api.test.js` - API endpoint tests
  - Authentication tests (register, login, logout)
  - Product CRUD tests
  - Cart operations
  - Order creation
  - Admin functionality
  - Error handling

**Frontend (`frontend/src/tests/`):**
- `components.test.tsx` - Component tests
  - Authentication components
  - Product listing
  - Cart functionality
  - Checkout process
  - Admin dashboard
  - Navigation

**E2E (`frontend/e2e/`):**
- `tests.spec.ts` - Full user flows
  - User registration → checkout flow
  - Admin product management
  - Order status updates
  - Responsive design testing

---

## 🚀 DEPLOYMENT GUIDE

### Backend Deployment (Heroku/Render)

**Option 1: Heroku**

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login  

# Create app
heroku create vanca-patina-api

# Set environment variables
heroku config:set MONGODB_URI=... --app vanca-patina-api
heroku config:set JWT_SECRET=... --app vanca-patina-api
heroku config:set CLOUDINARY_NAME=... --app vanca-patina-api
heroku config:set RAZORPAY_KEY_ID=... --app vanca-patina-api
# ... more config vars

# Deploy
git push heroku main

# Check logs
heroku logs --tail --app vanca-patina-api
```

**Option 2: Render**

1. Connect GitHub repository
2. Create new Web Service
3. Set Build Command: `npm install`
4. Set Start Command: `npm start`
5. Add environment variables
6. Deploy

### Frontend Deployment (Vercel/Netlify)

**Option 1: Vercel**

```bash
npm install -g vercel

vercel --prod
# Follow prompts to connect
# Set VITE_API_URL to backend URL
```

**Option 2: Netlify**

```bash
npm run build
# Deploy ./dist folder to Netlify
```

### Production Environment Variables

**Backend `.env.production`:**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_prod_secret_32_chars_min
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RAZORPAY_KEY_ID=rzp_live_...  # LIVE KEY
RAZORPAY_KEY_SECRET=...
```

**Frontend `.env.production`:**
```env
VITE_API_URL=https://api.yourdomain.com
```

### Database Backup

```bash
# Backup MongoDB Atlas
# Use Atlas built-in backup feature or:
mongobackup \
  --uri="mongodb+srv://...@cluster.mongodb.net" \
  --out="/backup/vanca-$(date +%Y%m%d)"
```

---

## 🐛 TROUBLESHOOTING

### Backend Issues

**"Cannot find module" error**
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**MongoDB Connection Error**
- Check MONGODB_URI in .env
- Verify IP whitelist in MongoDB Atlas
- Ensure database name is correct

**Cloudinary Upload Fails**
- Verify CLOUDINARY_NAME, API_KEY, API_SECRET
- Check file size < 5MB
- Try direct upload via Cloudinary dashboard

**CORS Error**
- Check CLIENT_URL in .env matches frontend URL
- Verify CORS middleware configuration
- Clear browser cache and cookies

### Frontend Issues

**"Cannot find module" error**
```bash
cd frontend
npm install
rm -rf node_modules/.vite
npm run dev
```

**API calls return 404**
- Check VITE_API_URL in .env
- Verify backend is running on correct port
- Check API endpoint paths

**Images not loading**
- Verify Cloudinary URL format
- Check network tab for broken image requests
- Fallback to /placeholder.svg

---

## ⚡ PERFORMANCE OPTIMIZATION

### Backend Optimization

1. **Database Indexing:**
```javascript
// Add indexes to frequently queried fields
userSchema.index({ email: 1 });
productSchema.index({ category: 1, name: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
```

2. **Query Optimization:**
```javascript
// Use .lean() for read-only queries
const products = await Product.find().lean();

// Use .select() to exclude unnecessary fields
const users = await User.find().select('-password');
```

3. **Add Caching:**
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache product list
app.get('/api/products', async (req, res) => {
  const cached = await client.get('products:page:1');
  if (cached) return res.json(JSON.parse(cached));
  // ... fetch and cache
});
```

### Frontend Optimization

1. **Code Splitting:**
```typescript
// Lazy load admin dashboard
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

2. **Image Optimization:**
```html
<!-- Use next-gen formats and lazy loading -->
<img 
  src="product.webp" 
  loading="lazy" 
  width="300" 
  height="200"
/>
```

3. **Bundle Analysis:**
```bash
npm run build
# Analyze bundle size
npx webpack-bundle-analyzer dist/stats.json
```

---

## 📚 ADDITIONAL RESOURCES

- [Swagger API Docs](http://localhost:5000/api-docs) - Interactive API documentation
- [MongoDB Docs](https://docs.mongodb.com)
- [Express Guide](https://expressjs.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Razorpay Integration](https://razorpay.com/docs)
- [Cloudinary Upload](https://cloudinary.com/documentation)

---

**Documentation Created:** March 29, 2026  
**Last Updated:** March 29, 2026  
**Author:** QA & Development Team

For questions or updates, please refer to the project repository.

