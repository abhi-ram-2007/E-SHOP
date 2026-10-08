# E-SHOP

A modern multi-category e-commerce marketplace built with **React, Vite,
Tailwind CSS, Supabase, and AI-powered features**.

E-SHOP supports three main roles: **Customer, Seller, and Admin**. The
platform includes authentication, product management, shopping cart and
wishlist, orders, reviews, seller tools, admin analytics, and
AI-assisted shopping and product content.

## ✨ Key Features

### Customer

-   Email/password authentication
-   Profile management
-   Saved shipping addresses
-   Product browsing and category shopping
-   Product details and image gallery
-   Shopping cart and wishlist
-   Checkout with Cash on Delivery (COD)
-   Order history and order details
-   Product reviews
-   AI shopping assistant
-   AI product recommendations
-   AI review summaries

### Seller

-   Seller dashboard and profile
-   Add, edit, and manage products
-   Product pricing, discounts, and stock management
-   Multiple product image uploads
-   Supabase Storage integration
-   Seller order management
-   AI-generated product titles and descriptions
-   AI-generated short descriptions, features, and tags

### Admin

-   Admin dashboard
-   Revenue and order analytics
-   Product, customer, seller, review, and category management
-   Best-selling product analytics
-   Low-stock monitoring
-   Recent orders
-   Account status management
-   Block/unblock customer and seller accounts

## 🤖 AI Features

E-SHOP uses **Supabase Edge Functions** with the **Gemini API**.

### AI Shopping Assistant

Customers can ask natural-language questions such as:

> Show me products under ₹1000

The assistant uses the real Supabase product catalog to provide relevant
product recommendations.

### AI Product Recommendations

The product details page can recommend related products based on the
currently viewed product.

### AI Review Summary

Reviews can be summarized into: - Overall summary - Common positive
points - Common concerns

### Seller AI Description Generator

Sellers can generate: - Product title - Product description - Short
description - Key features - Product tags

Generated content can be reviewed and edited before saving.

## 🧑‍💻 Technology Stack

  Layer                Technology
  -------------------- -------------------------
  Frontend             React
  Build Tool           Vite
  Styling              Tailwind CSS
  Icons                Lucide React
  Routing              React Router
  Backend / Database   Supabase
  Authentication       Supabase Auth
  Database             PostgreSQL via Supabase
  File Storage         Supabase Storage
  Serverless Backend   Supabase Edge Functions
  AI                   Google Gemini API
  Deployment           Vercel
  Version Control      Git & GitHub

## 🏗️ Architecture

``` text
                         ┌──────────────────────┐
                         │       Customer       │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │      React App       │
                         │ React + Vite +       │
                         │ Tailwind CSS         │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
      ┌───────▼───────┐    ┌────────▼────────┐   ┌──────▼──────┐
      │ Supabase Auth  │    │ Supabase DB     │   │  Supabase   │
      │                │    │ PostgreSQL      │   │   Storage   │
      └───────────────┘    └────────┬────────┘   └─────────────┘
                                    │
                         ┌──────────▼───────────┐
                         │ Supabase Edge        │
                         │ Functions            │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │    Gemini API        │
                         │    AI Services       │
                         └──────────────────────┘
```

## 👥 User Roles

### Customer

Browse products, manage profile and addresses, use cart and wishlist,
place COD orders, view orders, write reviews, and use AI shopping
features.

### Seller

Manage profile and products, upload product images, manage stock and
pricing, view orders, and generate product content with AI.

### Admin

Manage products, categories, orders, customers, sellers, reviews,
account status, and marketplace analytics.

## 📂 Project Structure

``` text
E-SHOP/
├── public/
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── AIProductRecommendations.jsx
│   │   ├── AIReviewSummary.jsx
│   │   ├── AIShoppingAssistant.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── SellerAIDescriptionGenerator.jsx
│   │   ├── SiteFooter.jsx
│   │   └── SiteHeader.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── data/
│   ├── lib/
│   ├── pages/
│   │   ├── admin/
│   │   ├── customer/
│   │   ├── seller/
│   │   └── public pages
│   └── main.jsx
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── vercel.json
├── .gitignore
└── README.md
```

## 🛣️ Main Routes

### Public

``` text
/
/shop
/shop/:category
/products/:id
/login
/register
/update-password
```

### Customer

``` text
/customer
/customer/profile
/customer/addresses
/customer/orders
/customer/orders/:id
/customer/wishlist
/cart
/checkout
/order-success/:id
```

### Seller

``` text
/seller
/seller/profile
/seller/products
/seller/products/new
/seller/products/:id/edit
/seller/orders
```

### Admin

``` text
/admin
/admin/products
/admin/products/edit/:id
/admin/orders
/admin/customers
/admin/sellers
/admin/reviews
/admin/categories
```

## 🗄️ Database

The application uses **Supabase PostgreSQL**.

Major tables include:

``` text
profiles
categories
products
product_images
orders
order_items
reviews
```

### Products

Products include fields such as name, description, brand, price,
discount, stock, rating, review count, seller, category, and active
status.

### Orders

Orders store the customer, status, payment method, subtotal, shipping
fee, discount, total amount, shipping information, and timestamps.

### Order Items

Order items store the order, product, seller, product name, price, and
quantity.

## 🔐 Authentication & Authorization

Supabase Auth provides email/password authentication.

Role-based access routes users to the appropriate dashboard:

``` text
Customer → Customer Dashboard
Seller   → Seller Dashboard
Admin    → Admin Dashboard
```

Protected routes prevent unauthorized dashboard access.

Account status is managed using:

``` text
active
blocked
```

Blocked customer and seller accounts are prevented from continuing to
use the application.

## 🔒 Environment Variables

Create `.env.local` in the project root:

``` env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Never commit `.env.local` to GitHub.**

For deployment, add the same variables to the hosting provider's
environment variable settings.

## 🚀 Getting Started

### 1. Clone the repository

``` bash
git clone https://github.com/abhi-ram-2007/E-SHOP.git
cd E-SHOP
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create `.env.local` and add:

``` env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start development

``` bash
npm run dev
```

The app will normally be available at:

``` text
http://localhost:5173
```

### 5. Production build

``` bash
npm run build
```

### 6. Preview production build

``` bash
npm run preview
```

## ☁️ Deployment

The project is configured for **Vercel**.

Current Vite configuration outputs the production site to `dist/public`,
so use:

``` text
Framework: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist/public
Install Command: npm install
```

Vercel environment variables:

``` text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The project also contains `vercel.json` for SPA routing:

``` json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🛒 E-Commerce Flow

``` text
Customer
   ↓
Browse Products
   ↓
Product Details
   ↓
Cart / Wishlist
   ↓
Checkout
   ↓
Cash on Delivery
   ↓
Order Created
   ↓
Seller/Admin Processing
   ↓
Order Status Updates
   ↓
Customer Order Tracking
```

## 🧠 AI Flow

``` text
React Frontend
      ↓
Supabase Edge Function
      ↓
Gemini API
      ↓
AI Response
      ↓
Validated Response
      ↓
React UI
```

Gemini credentials are kept inside Supabase Edge Function secrets and
are not placed in the React frontend.

## 🖼️ Product Image Flow

``` text
Seller/Admin
     ↓
Select Images
     ↓
Supabase Storage
     ↓
Image URL
     ↓
product_images table
     ↓
Product Page
```

## 📊 Admin Analytics

The admin dashboard provides: - Confirmed-order revenue - Total orders -
Total products - Total customers - Total sellers - Total reviews -
Recent revenue - Order status distribution - Best-selling products -
Low-stock products - Recent orders

## 💳 Payment

Current payment method:

``` text
Cash on Delivery (COD)
```

Online payment can be added later.

## 📦 Shipping

Current rule:

``` text
Free shipping above ₹999
```

Shipping charges and discounts are stored with each order.

## 🧪 Production Checklist

### Customer

-   [ ] Registration and login
-   [ ] Profile and addresses
-   [ ] Product browsing
-   [ ] Cart and wishlist
-   [ ] Checkout and COD
-   [ ] Order history
-   [ ] Reviews
-   [ ] AI shopping assistant
-   [ ] AI recommendations
-   [ ] AI review summary

### Seller

-   [ ] Seller profile
-   [ ] Add/edit products
-   [ ] Product image upload
-   [ ] Stock management
-   [ ] Order management
-   [ ] AI product description generator

### Admin

-   [ ] Dashboard analytics
-   [ ] Product management
-   [ ] Category management
-   [ ] Order management
-   [ ] Customer management
-   [ ] Seller management
-   [ ] Review management
-   [ ] Account blocking/unblocking

### Production

-   [ ] Environment variables
-   [ ] Production build
-   [ ] React Router routes
-   [ ] Supabase authentication
-   [ ] Database access
-   [ ] Product images
-   [ ] AI features
-   [ ] Mobile responsiveness

## 🔮 Future Enhancements

-   Online payment integration
-   Advanced search and filtering
-   Product comparison
-   Coupons and promotions
-   Email notifications
-   Push notifications
-   Advanced seller analytics
-   Inventory alerts
-   Delivery tracking
-   More personalized AI recommendations
-   AI-powered visual product search

## 🛡️ Security

-   Never commit `.env.local`.
-   Never expose Supabase service-role or other secret keys in frontend
    code.
-   Keep Gemini API credentials inside Supabase Edge Function secrets.
-   Use Supabase Row Level Security (RLS).
-   Protect customer, seller, and admin routes.
-   Validate user roles and account status.
-   Keep administrative database operations behind secure
    server-side/RPC authorization.

## 📜 License

This project is currently intended as an academic and portfolio
application.

Add a specific open-source license if the project is later released
under one.

## 🔗 Repository

**GitHub:** https://github.com/abhi-ram-2007/E-SHOP

------------------------------------------------------------------------

**E-SHOP --- A full-stack multi-category e-commerce marketplace built
with React, Vite, Supabase, Tailwind CSS, and AI services.**
