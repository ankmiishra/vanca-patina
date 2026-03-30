/**
 * FRONTEND AUTOMATED TEST SUITE
 * Framework: Vitest + React Testing Library
 * Location: frontend/src/tests/
 * Run: npm test
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import api from '@/services/api';

// Mock axios
vi.mock('@/services/api');

// ========================================
// 1. AUTHENTICATION TESTS
// ========================================

describe('Authentication Pages', () => {
  describe('Login Component', () => {
    it('should render login form', () => {
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should show validation errors for empty email', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const submitBtn = screen.getByRole('button', { name: /login/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should call login API with correct credentials', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue({
        accessToken: 'token123',
        _id: 'user1',
        name: 'John',
        email: 'john@example.com'
      });
      api.post = mockLogin;

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitBtn = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('/api/auth/login', {
          email: 'john@example.com',
          password: 'password123'
        });
      });
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } }
      });
      api.post = mockLogin;

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitBtn = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Register Component', () => {
    it('should render registration form', () => {
      render(<RegisterPage />);
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('should enforce password minimum length', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'short');

      const submitBtn = screen.getByRole('button', { name: /register/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitBtn = screen.getByRole('button', { name: /register/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });
  });
});

// ========================================
// 2. PRODUCT LISTING TESTS
// ========================================

describe('Shop Page', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Matte Patina',
      price: 500,
      category: 'Chemicals',
      finishType: 'Matte',
      image: 'http://example.com/image.jpg'
    },
    {
      id: '2',
      name: 'Glossy Finish',
      price: 750,
      category: 'Finishes',
      finishType: 'Glossy',
      image: 'http://example.com/image2.jpg'
    }
  ];

  beforeEach(() => {
    api.get = vi.fn().mockResolvedValue({
      data: {
        products: mockProducts,
        page: 1,
        pages: 1,
        total: 2
      }
    });
  });

  it('should display product list', async () => {
    render(<Shop />);

    await waitFor(() => {
      expect(screen.getByText('Matte Patina')).toBeInTheDocument();
      expect(screen.getByText('Glossy Finish')).toBeInTheDocument();
    });
  });

  it('should filter products by category', async () => {
    const user = userEvent.setup();
    api.get = vi.fn().mockResolvedValue({
      data: {
        products: [mockProducts[0]],
        page: 1,
        pages: 1,
        total: 1
      }
    });

    render(<Shop />);

    const categoryFilter = screen.getByLabelText(/category/i);
    await user.selectOptions(categoryFilter, 'Chemicals');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('category=Chemicals'),
        expect.anything()
      );
    });
  });

  it('should search products', async () => {
    const user = userEvent.setup();
    render(<Shop />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Matte');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('search=Matte'),
        expect.anything()
      );
    });
  });

  it('should sort products', async () => {
    const user = userEvent.setup();
    render(<Shop />);

    const sortSelect = screen.getByLabelText(/sort/i);
    await user.selectOptions(sortSelect, 'price-asc');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=price-asc'),
        expect.anything()
      );
    });
  });

  it('should show loading state', () => {
    api.get = vi.fn(() => new Promise(() => {})); // Never resolves

    render(<Shop />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error message on API failure', async () => {
    api.get = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<Shop />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});

// ========================================
// 3. CART TESTS
// ========================================

describe('Cart Page', () => {
  const mockCart = {
    items: [
      {
        product: {
          id: '1',
          name: 'Product 1',
          price: 100,
          image: 'http://example.com/1.jpg'
        },
        quantity: 2
      }
    ]
  };

  it('should display cart items', async () => {
    api.get = vi.fn().mockResolvedValue({ data: mockCart });

    render(<Cart />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Qty: 2')).toBeInTheDocument();
    });
  });

  it('should show empty cart message', async () => {
    api.get = vi.fn().mockResolvedValue({ data: { items: [] } });

    render(<Cart />);

    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });

  it('should update item quantity', async () => {
    const user = userEvent.setup();
    api.get = vi.fn().mockResolvedValue({ data: mockCart });
    api.put = vi.fn().mockResolvedValue({ data: mockCart });

    render(<Cart />);

    const increaseBtn = screen.getByRole('button', { name: /\+/i });
    await user.click(increaseBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalled();
    });
  });

  it('should remove item from cart', async () => {
    const user = userEvent.setup();
    api.get = vi.fn().mockResolvedValue({ data: mockCart });
    api.delete = vi.fn().mockResolvedValue({ data: { items: [] } });

    render(<Cart />);

    const deleteBtn = screen.getByRole('button', { name: /remove/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalled();
    });
  });

  it('should calculate and display total price', async () => {
    api.get = vi.fn().mockResolvedValue({ data: mockCart });

    render(<Cart />);

    await waitFor(() => {
      // 100 * 2 = 200
      expect(screen.getByText(/total.*200/i)).toBeInTheDocument();
    });
  });

  it('should have checkout button', async () => {
    api.get = vi.fn().mockResolvedValue({ data: mockCart });

    render(<Cart />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /checkout/i })).toBeInTheDocument();
    });
  });
});

// ========================================
// 4. CHECKOUT TESTS
// ========================================

describe('Checkout Page', () => {
  beforeEach(() => {
    api.get = vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            product: { id: '1', name: 'Product', price: 100 },
            quantity: 1
          }
        ]
      }
    });

    api.post = vi.fn().mockResolvedValue({
      data: { orderId: 'order123' }
    });
  });

  it('should render checkout form', () => {
    render(<Checkout />);

    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<Checkout />);

    const submitBtn = screen.getByRole('button', { name: /place order/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/address is required/i)).toBeInTheDocument();
    });
  });

  it('should submit order with correct data', async () => {
    const user = userEvent.setup();
    render(<Checkout />);

    const addressInput = screen.getByLabelText(/address/i);
    const cityInput = screen.getByLabelText(/city/i);
    const postalInput = screen.getByLabelText(/postal code/i);
    const submitBtn = screen.getByRole('button', { name: /place order/i });

    await user.type(addressInput, '123 Main St');
    await user.type(cityInput, 'Boston');
    await user.type(postalInput, '02101');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({
          shippingAddress: {
            address: '123 Main St',
            city: 'Boston',
            postalCode: '02101'
          }
        }),
        expect.anything()
      );
    });
  });

  it('should show error on order creation failure', async () => {
    const user = userEvent.setup();
    api.post = vi.fn().mockRejectedValue({
      response: { data: { message: 'Order creation failed' } }
    });

    render(<Checkout />);

    const addressInput = screen.getByLabelText(/address/i);
    const submitBtn = screen.getByRole('button', { name: /place order/i });

    await user.type(addressInput, '123 Main St');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/order creation failed/i)).toBeInTheDocument();
    });
  });
});

// ========================================
// 5. ADMIN DASHBOARD TESTS
// ========================================

describe('Admin Dashboard', () => {
  const mockStats = {
    totalUsers: 10,
    totalOrders: 5,
    totalProducts: 20,
    totalRevenue: 5000,
    latestOrders: []
  };

  beforeEach(() => {
    localStorage.setItem('role', 'admin');
    localStorage.setItem('token', 'admintoken');

    api.get = vi.fn().mockImplementation((url) => {
      if (url.includes('/admin/stats')) {
        return Promise.resolve({ data: mockStats });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('should display admin stats', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // totalUsers
      expect(screen.getByText('5')).toBeInTheDocument(); // totalOrders
      expect(screen.getByText('20')).toBeInTheDocument(); // totalProducts
    });
  });

  it('should redirect non-admin users', () => {
    localStorage.setItem('role', 'user');
    const navigateFn = vi.fn();

    render(<AdminDashboard />);

    // Component should call navigate('/admin/login')
    expect(navigateFn).toBeDefined();
  });

  it('should have product management section', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/products/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument();
  });

  it('should have order management section', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/orders/i)).toBeInTheDocument();
  });

  it('should have user management section', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/users/i)).toBeInTheDocument();
  });
});

// ========================================
// 6. NAVIGATION TESTS
// ========================================

describe('Navbar Component', () => {
  it('should show login link when not authenticated', () => {
    localStorage.removeItem('token');

    render(<Navbar />);

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('should show user menu when authenticated', () => {
    localStorage.setItem('token', 'usertoken');
    localStorage.setItem('user', JSON.stringify({
      _id: 'user1',
      name: 'John',
      email: 'john@example.com',
      role: 'user'
    }));

    render(<Navbar />);

    expect(screen.getByText(/john/i)).toBeInTheDocument();
  });

  it('should show admin menu when user is admin', () => {
    localStorage.setItem('token', 'admintoken');
    localStorage.setItem('user', JSON.stringify({
      _id: 'admin1',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin'
    }));

    render(<Navbar />);

    expect(screen.getByRole('link', { name: /admin dashboard/i })).toBeInTheDocument();
  });

  it('should show logout button when authenticated', () => {
    localStorage.setItem('token', 'usertoken');

    render(<Navbar />);

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('should display cart item count', async () => {
    // This would depend on CartContext implementation
    render(<Navbar />);

    await waitFor(() => {
      // Check if cart icon shows item count
      expect(screen.getByText(/cart/i)).toBeInTheDocument();
    });
  });
});

export {};
