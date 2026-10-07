import { BrowserRouter, Route, Routes } from "react-router-dom";

import SiteHeader from "./components/SiteHeader.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import AIShoppingAssistant from "./components/AIShoppingAssistant.jsx";

// Customer
import CartPage from "./pages/customer/CartPage.jsx";
import CheckoutPage from "./pages/customer/CheckoutPage.jsx";
import OrderSuccessPage from "./pages/customer/OrderSuccessPage.jsx";
import CustomerOrders from "./pages/customer/CustomerOrders.jsx";
import CustomerOrderDetails from "./pages/customer/CustomerOrderDetails.jsx";
import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";
import CustomerAddresses from "./pages/customer/CustomerAddresses.jsx";
import CustomerProfile from "./pages/customer/CustomerProfile.jsx";
import WishlistPage from "./pages/customer/WishlistPage.jsx";

// Public
import HomePage from "./pages/HomePage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import ProductDetailsPage from "./pages/ProductDetailsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

// Authentication
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import UpdatePasswordPage from "./pages/auth/UpdatePasswordPage.jsx";

// Seller
import SellerDashboard from "./pages/seller/SellerDashboard.jsx";
import SellerProfile from "./pages/seller/SellerProfile.jsx";
import MyProducts from "./pages/seller/MyProducts.jsx";
import AddProduct from "./pages/seller/AddProduct.jsx";
import EditProduct from "./pages/seller/EditProduct.jsx";
import SellerOrders from "./pages/seller/SellerOrders.jsx";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminEditProduct from "./pages/admin/AdminEditProduct.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminSellers from "./pages/admin/AdminSellers.jsx";
import AdminReviews from "./pages/admin/AdminReviews.jsx";
import AdminCategories from "./pages/admin/AdminCategories.jsx";

// Auth
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";


function Storefront() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Routes>

          {/* =========================
              PUBLIC ROUTES
          ========================= */}

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/shop"
            element={<ShopPage />}
          />

          <Route
            path="/shop/:category"
            element={<ShopPage />}
          />

          <Route
            path="/products/:id"
            element={<ProductDetailsPage />}
          />


          {/* =========================
              AUTHENTICATION
          ========================= */}

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          <Route
            path="/update-password"
            element={<UpdatePasswordPage />}
          />


          {/* =========================
              CUSTOMER ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
              />
            }
          >
            <Route
              path="/customer"
              element={<CustomerDashboard />}
            />

            <Route
              path="/customer/profile"
              element={<CustomerProfile />}
            />

            <Route
              path="/customer/addresses"
              element={<CustomerAddresses />}
            />

            <Route
              path="/customer/orders"
              element={<CustomerOrders />}
            />

            <Route
              path="/customer/orders/:id"
              element={<CustomerOrderDetails />}
            />

            <Route
              path="/cart"
              element={<CartPage />}
            />

            <Route
              path="/checkout"
              element={<CheckoutPage />}
            />

            <Route
              path="/order-success/:id"
              element={<OrderSuccessPage />}
            />

            <Route
              path="/customer/wishlist"
              element={<WishlistPage />}
            />
          </Route>


          {/* =========================
              SELLER ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["seller"]}
              />
            }
          >
            <Route
              path="/seller"
              element={<SellerDashboard />}
            />

            <Route
              path="/seller/profile"
              element={<SellerProfile />}
            />

            <Route
              path="/seller/products"
              element={<MyProducts />}
            />

            <Route
              path="/seller/products/new"
              element={<AddProduct />}
            />

            <Route
              path="/seller/products/:id/edit"
              element={<EditProduct />}
            />

            <Route
              path="/seller/orders"
              element={<SellerOrders />}
            />
          </Route>


          {/* =========================
              ADMIN ROUTES
          ========================= */}

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
              />
            }
          >
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/products"
              element={<AdminProducts />}
            />

            <Route
              path="/admin/products/edit/:id"
              element={<AdminEditProduct />}
            />

            <Route
              path="/admin/orders"
              element={<AdminOrders />}
            />

            <Route
              path="/admin/customers"
              element={<AdminCustomers />}
            />

            <Route
              path="/admin/sellers"
              element={<AdminSellers />}
            />

            <Route
              path="/admin/reviews"
              element={<AdminReviews />}
            />

            <Route
              path="/admin/categories"
              element={<AdminCategories />}
            />
          </Route>


          {/* =========================
              404
          ========================= */}

          <Route
            path="*"
            element={<NotFoundPage />}
          />

        </Routes>
      </main>

      <SiteFooter />

      {/* =========================
          AI SHOPPING ASSISTANT
      ========================= */}

      <AIShoppingAssistant />
    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Storefront />
      </AuthProvider>
    </BrowserRouter>
  );
}