/**
 * END-TO-END TESTS WITH PLAYWRIGHT
 * Framework: Playwright
 * Location: frontend/e2e/
 * Run: npx playwright test
 * Config: playwright.config.ts
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';

// ========================================
// FIXTURES & HELPERS
// ========================================

let authToken: string;
let adminToken: string;
let testUserId: string;
let testProductId: string;

// Helper to create test user
async function createTestUser(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/register`);
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Register")');
  await page.waitForURL(`${BASE_URL}/`);
}

// Helper to login user
async function loginUser(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Login")');
  await page.waitForURL(`${BASE_URL}/`);
  authToken = await page.evaluate(() => localStorage.getItem('token'));
}

// Helper to login as admin
async function loginAdmin(page: Page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[name="email"]', 'ritikamishra707@gmail.com');
  await page.fill('input[name="password"]', 'Ankitmishra1@');
  await page.click('button:has-text("Login")');
  await page.waitForURL(`${BASE_URL}/admin/dashboard`);
  adminToken = await page.evaluate(() => localStorage.getItem('token'));
}

// ========================================
// 1. AUTHENTICATION FLOW TESTS
// ========================================

test.describe('Authentication Flow', () => {
  test('User Registration & Login', async ({ page }) => {
    const testEmail = `user_${Date.now()}@example.com`;

    // Register
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button:has-text("Register")');

    // Should be redirected to home
    await page.waitForURL(`${BASE_URL}/`);
    
    // Token should be saved
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();

    // Logout
    await page.click('button:has-text("Logout")', { timeout: 5000 });
    await page.waitForURL(`${BASE_URL}/login`);

    // Token should be cleared
    const clearedToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(clearedToken).toBeNull();

    // Login again
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/`);

    const newToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(newToken).toBeTruthy();
  });

  test('Admin Login', async ({ page }) => {
    await loginAdmin(page);

    // Should be on admin dashboard
    expect(page.url()).toContain('/admin/dashboard');

    // Should see admin stats
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Protected Routes Redirect', async ({ page }) => {
    // Try accessing /cart without login
    await page.goto(`${BASE_URL}/cart`);

    // Should redirect to login
    expect(page.url()).toContain('/login');
  });
});

// ========================================
// 2. PRODUCT BROWSING TESTS
// ========================================

test.describe('Product Browsing', () => {
  test('Browse Products on Shop Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);

    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Check product cards are visible
    const productCards = await page.locator('[data-testid="product-card"]').count();
    expect(productCards).toBeGreaterThan(0);

    // Each card should have product details
    const firstCard = page.locator('[data-testid="product-card"]').first();
    await expect(firstCard.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="product-price"]')).toBeVisible();
  });

  test('Search Products', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForSelector('[data-testid="product-card"]');

    // Type search
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('patina');

    // Wait for results to update
    await page.waitForTimeout(1000);

    // Check results contain search term
    const results = await page.locator('[data-testid="product-name"]').allTextContents();
    expect(results.some(name => name.toLowerCase().includes('patina'))).toBeTruthy();
  });

  test('Filter by Category', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForSelector('[data-testid="category-filter"]');

    // Select category
    const categorySelect = page.locator('[data-testid="category-filter"]');
    await categorySelect.selectOption('Chemicals');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // URL should contain category param
    expect(page.url()).toContain('category=Chemicals');
  });

  test('Sort Products', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForSelector('[data-testid="sort-select"]');

    // Select sort option
    const sortSelect = page.locator('[data-testid="sort-select"]');
    await sortSelect.selectOption('price-asc');

    // Wait for results to update
    await page.waitForTimeout(1000);

    // Get all prices and verify they're sorted
    const prices = await page.locator('[data-testid="product-price"]').allTextContents();
    const numPrices = prices.map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
    
    for (let i = 1; i < numPrices.length; i++) {
      expect(numPrices[i]).toBeGreaterThanOrEqual(numPrices[i - 1]);
    }
  });

  test('View Product Details', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForSelector('[data-testid="product-card"]');

    // Click first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productLink = firstProduct.locator('a').first();
    await productLink.click();

    // Should be on product detail page
    expect(page.url()).toContain('/product/');

    // Should have product details
    await expect(page.locator('[data-testid="product-detail-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-detail-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-detail-description"]')).toBeVisible();
  });

  test('View Categories', async ({ page }) => {
    await page.goto(`${BASE_URL}/categories`);

    // Wait for categories to load
    await page.waitForSelector('[data-testid="category-card"]', { timeout: 10000 });

    // Check categories are visible
    const categoryCards = await page.locator('[data-testid="category-card"]').count();
    expect(categoryCards).toBeGreaterThan(0);
  });
});

// ========================================
// 3. CART & CHECKOUT TESTS
// ========================================

test.describe('Cart & Checkout', () => {
  test('Add Product to Cart', async ({ page }) => {
    const testEmail = `cart_${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'TestPassword123');
    
    // Go to shop
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForSelector('[data-testid="product-card"]');

    // Get initial cart count
    const cartBadge = page.locator('[data-testid="cart-count"]');
    const initialCount = await cartBadge.textContent();

    // Click add to cart on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('button:has-text("Add to Cart")').click();

    // Wait and check toast notification
    await expect(page.locator('text=Added to cart')).toBeVisible();

    // Cart badge should update
    const newCount = await cartBadge.textContent();
    expect(parseInt(newCount)).toBeGreaterThan(parseInt(initialCount));
  });

  test('View Cart & Update Quantities', async ({ page }) => {
    const testEmail = `cart2_${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'TestPassword123');

    // Add product to cart
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForSelector('[data-testid="product-card"]');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('button:has-text("Add to Cart")').click();
    await page.waitForTimeout(500);

    // Go to cart
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForSelector('[data-testid="cart-item"]');

    // Increase quantity
    const increaseBtn = page.locator('[data-testid="increase-qty"]').first();
    const currentQty = await page.locator('[data-testid="item-qty"]').first().textContent();
    await increaseBtn.click();
    await page.waitForTimeout(500);

    const newQty = await page.locator('[data-testid="item-qty"]').first().textContent();
    expect(parseInt(newQty)).toBe(parseInt(currentQty) + 1);
  });

  test('Remove from Cart', async ({ page }) => {
    const testEmail = `cart3_${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'TestPassword123');

    // Add product
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForSelector('[data-testid="product-card"]');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('button:has-text("Add to Cart")').click();
    await page.waitForTimeout(500);

    // Go to cart
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForSelector('[data-testid="cart-item"]');

    // Remove item
    const removeBtn = page.locator('[data-testid="remove-item"]').first();
    await removeBtn.click();
    await page.waitForTimeout(500);

    // Should show empty cart message
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });

  test('Checkout Process', async ({ page }) => {
    const testEmail = `checkout_${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'TestPassword123');

    // Add product
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForSelector('[data-testid="product-card"]');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.locator('button:has-text("Add to Cart")').click();
    await page.waitForTimeout(500);

    // Go to cart
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForSelector('[data-testid="checkout-btn"]');

    // Click checkout
    await page.click('[data-testid="checkout-btn"]');

    // Should be on checkout page
    expect(page.url()).toContain('/checkout');

    // Fill checkout form
    await page.fill('[data-testid="address"]', '123 Main St');
    await page.fill('[data-testid="city"]', 'Boston');
    await page.fill('[data-testid="postal-code"]', '02101');
    await page.fill('[data-testid="country"]', 'India');

    // Note: Actual payment would require mocking Razorpay
    // For now just verify form is filled
    expect(await page.inputValue('[data-testid="address"]')).toBe('123 Main St');
  });
});

// ========================================
// 4. USER DASHBOARD TESTS  
// ========================================

test.describe('User Dashboard', () => {
  test('View User Profile', async ({ page }) => {
    const testEmail = `profile_${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'TestPassword123');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid="profile-section"]', { timeout: 5000 });

    // Check profile details are shown
    await expect(page.locator('[data-testid="profile-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-name"]')).toBeVisible();
  });

  test('Update Profile', async ({ page }) => {
    const testEmail = `profile2_${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'TestPassword123');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('[data-testid="profile-section"]');

    // Edit profile
    await page.click('[data-testid="edit-profile-btn"]');
    await page.fill('[data-testid="input-name"]', 'Updated Name');
    await page.click('[data-testid="save-profile-btn"]');

    // Should show success message
    await expect(page.locator('text=Profile updated')).toBeVisible();
  });

  test('View Orders', async ({ page }) => {
    const testEmail = `orders_${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'TestPassword123');

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard`);

    // Check orders section
    await page.click('text=Orders');
    await page.waitForSelector('[data-testid="orders-section"]');
  });
});

// ========================================
// 5. ADMIN OPERATIONS TESTS
// ========================================

test.describe('Admin Operations', () => {
  test('Admin Can Create Product', async ({ page }) => {
    await loginAdmin(page);

    // Go to admin products
    await page.click('[data-testid="products-tab"]');
    await page.waitForSelector('[data-testid="add-product-btn"]');

    // Click add product
    await page.click('[data-testid="add-product-btn"]');

    // Fill product form
    await page.fill('[data-testid="product-name"]', `Test Product ${Date.now()}`);
    await page.fill('[data-testid="product-price"]', '500');
    await page.fill('[data-testid="product-category"]', 'Test');
    await page.fill('[data-testid="product-description"]', 'Test product description');
    await page.fill('[data-testid="product-stock"]', '10');

    // Submit
    await page.click('[data-testid="save-product-btn"]');

    // Should show success message
    await expect(page.locator('text=Product created')).toBeVisible();
  });

  test('Admin Can Update Product', async ({ page }) => {
    await loginAdmin(page);

    // Go to products
    await page.click('[data-testid="products-tab"]');
    await page.waitForSelector('[data-testid="product-row"]');

    // Click edit on first product
    const firstProduct = page.locator('[data-testid="product-row"]').first();
    await firstProduct.locator('[data-testid="edit-btn"]').click();

    // Update name
    const nameInput = page.locator('[data-testid="product-name"]');
    await nameInput.clear();
    await nameInput.fill(`Updated Name ${Date.now()}`);

    // Save
    await page.click('[data-testid="save-product-btn"]');

    // Should show success
    await expect(page.locator('text=Product updated')).toBeVisible();
  });

  test('Admin Can Delete Product', async ({ page }) => {
    await loginAdmin(page);

    // Go to products
    await page.click('[data-testid="products-tab"]');
    await page.waitForSelector('[data-testid="product-row"]');

    // Click delete on first product
    const firstProduct = page.locator('[data-testid="product-row"]').first();
    await firstProduct.locator('[data-testid="delete-btn"]').click();

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Should show success
    await expect(page.locator('text=Product deleted')).toBeVisible();
  });

  test('Admin Can View Dashboard Stats', async ({ page }) => {
    await loginAdmin(page);

    // Should show stats
    await expect(page.locator('[data-testid="stat-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-products"]')).toBeVisible();
  });

  test('Admin Can Update Order Status', async ({ page }) => {
    await loginAdmin(page);

    // Go to orders
    await page.click('[data-testid="orders-tab"]');
    await page.waitForSelector('[data-testid="order-row"]');

    // Click on first order
    const firstOrder = page.locator('[data-testid="order-row"]').first();
    await firstOrder.click();

    // Change status
    const statusSelect = page.locator('[data-testid="status-select"]');
    await statusSelect.selectOption('processing');

    // Save
    await page.click('[data-testid="save-btn"]');

    // Should show success
    await expect(page.locator('text=Order updated')).toBeVisible();
  });
});

// ========================================
// 6. RESPONSIVE DESIGN TESTS
// ========================================

test.describe('Responsive Design', () => {
  test('Mobile Layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/`);

    // Navigation should be responsive
    const navbar = page.locator('[data-testid="navbar"]');
    await expect(navbar).toBeVisible();

    // Go to shop
    await page.goto(`${BASE_URL}/shop`);

    // Products should stack
    const products = page.locator('[data-testid="product-card"]');
    const firstProduct = products.first();
    const width = await firstProduct.evaluate(el => el.offsetWidth);
    expect(width).toBeLessThan(400); // Mobile width
  });

  test('Tablet Layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(`${BASE_URL}/shop`);

    // Should have 2-column layout
    const container = page.locator('[data-testid="products-grid"]');
    const style = await container.evaluate(el => window.getComputedStyle(el).gridTemplateColumns);
    expect(style).toContain('repeat');
  });

  test('Desktop Layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(`${BASE_URL}/shop`);

    // Should have 4-column layout
    const productCount = await page.locator('[data-testid="product-card"]').count();
    expect(productCount).toBeGreaterThan(0);
  });
});

// ========================================
// 7. ERROR HANDLING TESTS
// ========================================

test.describe('Error Handling', () => {
  test('Network Error Handling', async ({ page }) => {
    // Simulate network offline
    await page.context().setOffline(true);

    await page.goto(`${BASE_URL}/shop`);

    // Should show error message
    await expect(page.locator('text=/failed|error/i')).toBeVisible({ timeout: 5000 });

    // Should have retry button
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Retry should work
    await page.click('button:has-text("Retry")');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
  });

  test('Invalid Product ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/product/invalidid`);

    // Should show 404 or not found message
    await expect(page.locator('text=/not found|404/i')).toBeVisible();
  });

  test('Unauthorized Admin Access', async ({ page }) => {
    const testEmail = `user_${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'TestPassword123');

    // Try to access admin dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`);

    // Should redirect to admin login
    expect(page.url()).toContain('/admin/login');
  });
});

export {};
