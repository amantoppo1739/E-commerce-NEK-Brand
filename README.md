# NEK Brand E-commerce Frontend

A modern, luxury e-commerce platform built with Next.js 14, featuring server-side rendering, static site generation, user authentication, admin dashboard, and a beautiful TailwindCSS design.

## Features

### Customer Features
- ✨ **Next.js 14 with App Router** - Modern React framework with server-side rendering
- 🎨 **TailwindCSS** - Beautiful, responsive design with luxury aesthetic
- 🛒 **Shopping Cart** - Full-featured cart with React Context API and localStorage persistence
- 📦 **Product Variants** - Support for size, material, and inventory management
- 🖼️ **Image Galleries** - Interactive product image galleries
- 🔍 **SEO Optimized** - Static site generation for product pages
- 📱 **Fully Responsive** - Works beautifully on all devices
- ⚡ **Performance** - Optimized with Next.js Image component and ISR
- 👤 **User Authentication** - Login, registration, and account management
- 📋 **Order Management** - Order confirmation, tracking, and history
- 💳 **Checkout Process** - Complete checkout flow with address and payment forms
- 📦 **Order Tracking** - Real-time order status with visual timeline
- 🔐 **Password Recovery** - Secure forgot/reset password flow
- 📱 **Mobile-First Enhancements** - Filter drawer, sticky CTAs, and tuned spacing for smaller screens

### Admin Features
- 🎛️ **Admin Dashboard** - Analytics and overview of store performance
- 📊 **Order Management** - View, filter, and update order statuses
- 🛍️ **Product Management** - View and manage product catalog
- 📈 **Statistics** - Revenue, orders, inventory, and status breakdowns
- 🔄 **Status Updates** - Update order status and add tracking numbers

#### Product CRUD Enhancements
- ☁️ **Cloudinary uploads** directly from the admin drawer with drag/drop + URL support
- 🧮 **Inline inventory adjustments** per variant (with low-stock warnings)
- 🧾 **Slug validation** and uniqueness checks before saving
- ♻️ **Soft delete & restore** flows for safer catalog management
- 🔍 **Search, filters, and pagination** all powered by the admin product API

#### Admin Orders Enhancements
- 📬 **Dedicated admin APIs** under `/api/admin/orders` with metrics, filters, pagination, and bulk status counts
- 🔍 **Search & Filters** for order number, customer email/name, payment status, and fulfillment state with debounced search
- 📊 **Order insights** (revenue, status buckets, ready-to-ship) rendered via metric cards on the admin orders page
- ⚡ **Inline quick actions** to mark processing/shipped plus instant payment/status badges without leaving the list
- 🧾 **Revamped detail view** with fulfillment timeline, payment & tracking controls, and internal admin-only notes stored on each order
- ✍️ **Tracking + Notes** persisted via the new PATCH endpoint so teams can add context without contacting customers
- 📄 **CSV export** button respecting current filters for quick offline reporting

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Free accounts for: Supabase, Resend, Cloudinary (Sentry optional)

### Quick Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up free services:**
   - Create Supabase account → Get database URL
   - Create Resend account → Get API key
   - Create Cloudinary account → Get credentials
   - (Optional) Create Sentry account → Get DSN

3. **Configure environment:**
   - Copy `.env.example` to `.env.local`
   - Fill in all environment variables (see [SETUP.md](./SETUP.md) for detailed instructions)

4. **Set up database:**
```bash
npm run db:generate
npm run db:push
npm run db:seed
```
- The seed script now creates the admin/user accounts above, 30+ richly described products (with multiple variants/images), and a dozen historical orders so dashboards and filters have realistic data immediately.

5. **Run development server:**
```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)**

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── orders/            # Order management endpoints
│   │   ├── products/          # Product endpoints
│   │   └── admin/             # Admin endpoints
│   ├── account/               # User account pages
│   ├── admin/                 # Admin dashboard and management
│   │   ├── products/          # Product management
│   │   └── orders/            # Order management
│   ├── checkout/              # Checkout page
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   ├── order-confirmation/    # Order confirmation pages
│   ├── order-tracking/        # Order tracking pages
│   ├── products/              # Product listing and detail pages
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/                # React components
│   ├── Header.tsx             # Navigation header
│   ├── Footer.tsx             # Footer component
│   ├── ProductCard.tsx        # Product card component
│   ├── ProductDetailClient.tsx # Product detail page client component
│   └── CartDrawer.tsx         # Shopping cart drawer
├── contexts/                  # React contexts
│   ├── CartContext.tsx         # Shopping cart state management
│   └── AuthContext.tsx        # Authentication state management
├── lib/                       # Utilities and data
│   ├── mock-data.ts           # Mock product data
│   ├── auth.ts                # Authentication utilities
│   └── orders.ts              # Order management utilities
└── types/                     # TypeScript types
    ├── product.ts             # Product type definitions
    └── order.ts               # Order and user type definitions
```

## Key Features Implementation

### Server-Side Rendering (SSR) / Static Site Generation (SSG)

- Product listing pages use **Incremental Static Regeneration (ISR)** with `revalidate: 3600`
- Product detail pages are statically generated at build time using `generateStaticParams`
- Home page uses ISR for optimal performance

### Shopping Cart

- Managed with React Context API
- Persists to localStorage
- Features:
  - Add/remove items
  - Update quantities
  - Calculate subtotals
  - Real-time inventory checking

### Product Variants

- Support for multiple materials (14K Gold, 18K Gold, Platinum, etc.)
- Size selection for rings and bracelets
- Real-time inventory display
- Price updates based on variant selection

### Authentication System

- User registration and login
- Role-based access (user/admin)
- Protected routes
- Session management with localStorage
- Forgot password + secure reset tokens
- Demo credentials:
  - Admin: `admin@nek.com` / any password
  - User: `user@example.com` / any password

### Order Management

- Complete checkout flow with address forms
- Order confirmation with order number
- Order tracking with status timeline
- Order history in user account
- Admin order management with status updates

### Admin Dashboard

- Real-time statistics (revenue, orders, products, inventory)
- Order status breakdown
- Product catalog management
- Order filtering and status updates
- Tracking number management

### Admin Product Workflow

1. Go to `/admin/products` and click **Add Product** to open the drawer.
2. Complete product basics (name, slug, description, category, featured toggle, status). Slugs are auto-generated but you can edit them, and the drawer validates uniqueness via `/api/admin/products/slug`.
3. Upload or paste media URLs; files are sent directly to Cloudinary (ensure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set before attempting uploads).
4. Add/edit/remove variants with material, size, SKU, price, and inventory. Submissions call `/api/admin/products` (create) or `/api/admin/products/[id]` (update) so everything stays in sync with Prisma.
5. Adjust stock inline from the listing using the +/- controls; these send lightweight PATCH requests with `inventoryAdjustments` for quick corrections.
6. Use Archive/Restore to soft-delete products. All filters (search, category, status, featured) are backed by the paginated admin API for fast catalog operations.

### API Integration

- Mock REST API endpoints for all features
- Simulates real API delays
- Supports filtering, CRUD operations
- Order creation and status updates

## Building for Production

```bash
npm run build
npm start
```

## Design Philosophy

The design follows modern e-commerce best practices seen in luxury brands like:
- Clean, minimal aesthetic
- High-quality product imagery
- Intuitive navigation
- Smooth animations and transitions
- Mobile-first responsive design

## Demo Credentials

### Admin Access
- Email: `admin@nek.com`
- Password: Any password works (demo mode)

### User Access
- Email: `user@example.com`
- Password: Any password works (demo mode)

## Pages Overview

### Customer Pages
- `/` - Home page with featured products
- `/products` - Product listing with filters
- `/products/[slug]` - Product detail page
- `/checkout` - Checkout process
- `/order-confirmation/[orderNumber]` - Order confirmation
- `/order-tracking/[orderNumber]` - Order tracking
- `/account` - User account dashboard
- `/login` - User login
- `/register` - User registration

### Admin Pages
- `/admin` - Admin dashboard
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/orders/[id]` - Order details

## Demo Credentials

### Admin Access
- Email: `admin@nek.com`
- Password: Any password works (demo mode)

### User Access
- Email: `user@example.com`
- Password: Any password works (demo mode)

## Pages Overview

### Customer Pages
- `/` - Home page with featured products
- `/products` - Product listing with filters
- `/products/[slug]` - Product detail page
- `/checkout` - Checkout process
- `/order-confirmation/[orderNumber]` - Order confirmation
- `/order-tracking/[orderNumber]` - Order tracking
- `/account` - User account dashboard
- `/login` - User login
- `/register` - User registration

### Admin Pages
- `/admin` - Admin dashboard
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/orders/[id]` - Order details

## License

This project is created for portfolio/resume purposes.

