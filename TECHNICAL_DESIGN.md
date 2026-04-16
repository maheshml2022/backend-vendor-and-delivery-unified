# DailyBox Unified Backend — Technical Design Document

> **Version:** 2.0.0  
> **Runtime:** Node.js (ES Modules) + Express 4  
> **Database:** PostgreSQL 15+  
> **Last Updated:** June 2025

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Reference — Core Routes](#7-api-reference--core-routes)
8. [API Reference — Admin Module](#8-api-reference--admin-module)
9. [API Reference — Customer Module](#9-api-reference--customer-module)
10. [API Reference — Vendor Module](#10-api-reference--vendor-module)
11. [API Reference — Delivery Module](#11-api-reference--delivery-module)
12. [API Reference — Public Module](#12-api-reference--public-module)
13. [Response Format](#13-response-format)
14. [Error Handling](#14-error-handling)
15. [Validation](#15-validation)
16. [Integration Guide — Admin App (React)](#16-integration-guide--admin-app-react)
17. [Integration Guide — Customer App (Mobile)](#17-integration-guide--customer-app-mobile)
18. [Integration Guide — Vendor App (Mobile)](#18-integration-guide--vendor-app-mobile)
19. [Integration Guide — Delivery App (Mobile)](#19-integration-guide--delivery-app-mobile)
20. [Setup & Running](#20-setup--running)

---

## 1. Overview

DailyBox is a **multi-tenant food delivery platform** serving four distinct client applications through a single unified backend:

| App | Platform | Target User | Auth Method |
|-----|----------|-------------|-------------|
| **Admin** | React (Web) | Platform administrators | Username + Password |
| **Customer** | Mobile (Android/iOS) | End consumers | OTP + Optional Password |
| **Vendor** | Mobile (Android/iOS) | Restaurant/Store owners | Password + OTP |
| **Delivery** | Mobile (Android/iOS) | Delivery partners | OTP (auto-register) |

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ (ES Modules) |
| Framework | Express 4.18.2 |
| Database | PostgreSQL via `pg` 8.11.3 |
| Auth | JWT (`jsonwebtoken` 9.0.2) + `bcryptjs` 2.4.3 |
| Validation | Joi 17.11.0 |
| Security | Helmet, CORS |
| Logging | Morgan (access logs) + custom logger |
| File Uploads | Multer (disk storage, 5 MB, jpg/jpeg/png/webp) |

---

## 2. Architecture

### 2.1 Layer Diagram

```
Client Apps (Admin / Customer / Vendor / Delivery)
        │
        ▼
┌─────────────────────────────────────────────────┐
│                   Express Server                │
│   helmet ─▶ cors ─▶ bodyParser ─▶ morgan        │
├─────────────────────────────────────────────────┤
│                    Routes                       │
│  Core (auth, users, restaurants, menu, cart,    │
│        orders, admin)                           │
│  Modules (customer, vendor, delivery, public)   │
├─────────────────────────────────────────────────┤
│               Middleware Layer                   │
│  authenticate ─▶ requireRole ─▶ validation      │
├─────────────────────────────────────────────────┤
│               Controller Layer                  │
│  Parse request ─▶ call service ─▶ send response │
├─────────────────────────────────────────────────┤
│                Service Layer                    │
│  Business logic, orchestration, data transforms │
├─────────────────────────────────────────────────┤
│              Repository Layer (models/)          │
│  Raw SQL queries via pg pool ─▶ PostgreSQL      │
└─────────────────────────────────────────────────┘
```

### 2.2 Request Flow

```
HTTP Request
  → Express Middleware (helmet, cors, body-parser, morgan)
    → Route Matching (/api/v1/...)
      → Auth Middleware (authenticate / optionalAuthenticate)
        → RBAC Middleware (requireRole)
          → Controller (parse & validate input)
            → Service (business logic)
              → Repository (SQL query)
                → PostgreSQL
              ← Result rows
            ← Formatted data
          ← successResponse / errorResponse
        ← JSON response
```

### 2.3 Design Principles

- **3-Layer Architecture:** Controller → Service → Repository. No direct DB access from controllers.
- **Standardized Responses:** Every endpoint returns the same JSON envelope (`successResponse`, `errorResponse`, `paginatedResponse`).
- **asyncHandler:** All async controllers wrapped to forward errors to the central `errorHandler`.
- **Fail-Fast Validation:** Required env vars validated at startup. Joi schemas validate request input before business logic.
- **Modular Organization:** Core features in `src/`, domain modules in `src/modules/{domain}/`.

---

## 3. Project Structure

```
backend-unified/
├── .env                          # Environment variables (see §4)
├── package.json                  # Dependencies & scripts
├── logs/                         # Access logs (auto-created)
├── uploads/                      # Uploaded files (auto-created)
│
└── src/
    ├── server.js                 # Entry point — Express app setup
    │
    ├── config/
    │   └── database.js           # PostgreSQL pool + query() + transaction()
    │
    ├── db/
    │   ├── init.js               # Core table creation (11 tables, 6 indexes)
    │   ├── init-modules.js       # Module tables (7 tables, 16 ALTERs, 19 indexes)
    │   ├── migrate-admin.js      # Seed initial admin user
    │   └── seed.js               # Sample data seeder
    │
    ├── middleware/
    │   ├── authentication.js     # authenticate, optionalAuthenticate
    │   ├── rbac.js               # requireRole(...roles), requireAuth
    │   └── errorHandler.js       # Central error handler + asyncHandler
    │
    ├── utils/
    │   ├── jwt.js                # generateToken, verifyToken, refreshToken
    │   ├── otp.js                # generateOTP, getOTPExpiry
    │   ├── response.js           # successResponse, errorResponse, paginatedResponse
    │   └── logger.js             # Logging utility
    │
    ├── validators/
    │   ├── index.js              # Core Joi schemas (auth, users, restaurants, menu, cart, orders)
    │   ├── customerValidators.js # Address, review, catalog schemas
    │   ├── vendorValidators.js   # Vendor auth, store, product, order schemas
    │   └── deliveryValidators.js # Delivery auth, status, location schemas
    │
    ├── models/                   # Repository layer (shared across modules)
    │   ├── userRepository.js
    │   ├── otpRepository.js
    │   ├── addressRepository.js
    │   ├── restaurantRepository.js
    │   ├── menuRepository.js
    │   ├── orderItemRepository.js
    │   ├── catalogRepository.js
    │   ├── menuItemReviewRepository.js
    │   ├── productRepository.js
    │   ├── productImageRepository.js
    │   ├── reviewRepository.js
    │   ├── vendorDetailRepository.js
    │   ├── vendorStoreRepository.js
    │   ├── deliveryPartnerRepository.js
    │   ├── deliveryAssignmentRepository.js
    │   ├── deliveryEarningsRepository.js
    │   └── paymentRepository.js
    │
    ├── controllers/              # Core controllers (admin app primarily)
    │   ├── adminController.js
    │   ├── authController.js
    │   ├── cartController.js
    │   ├── menuController.js
    │   ├── orderController.js
    │   ├── restaurantController.js
    │   └── userController.js
    │
    ├── services/                 # Core services
    │   ├── authService.js
    │   ├── cartService.js
    │   ├── menuService.js
    │   ├── orderService.js
    │   ├── restaurantService.js
    │   └── userService.js
    │
    ├── routes/                   # Core route definitions
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── restaurant.routes.js
    │   ├── menu.routes.js
    │   ├── cart.routes.js
    │   ├── order.routes.js
    │   └── admin.routes.js
    │
    └── modules/                  # Domain-specific modules
        ├── customer/
        │   ├── controllers/
        │   │   ├── addressController.js
        │   │   ├── catalogController.js
        │   │   └── menuReviewController.js
        │   ├── services/
        │   │   ├── addressService.js
        │   │   ├── catalogService.js
        │   │   └── menuReviewService.js
        │   └── routes/
        │       └── index.js      # 30 endpoints
        │
        ├── vendor/
        │   ├── controllers/
        │   │   ├── authController.js
        │   │   ├── profileController.js
        │   │   ├── storeController.js
        │   │   ├── productController.js
        │   │   ├── orderController.js
        │   │   ├── dashboardController.js
        │   │   ├── reviewController.js
        │   │   └── uploadController.js
        │   ├── services/
        │   │   ├── authService.js
        │   │   ├── profileService.js
        │   │   ├── storeService.js
        │   │   ├── productService.js
        │   │   ├── orderService.js
        │   │   ├── dashboardService.js
        │   │   └── reviewService.js
        │   └── routes/
        │       └── index.js      # 25 endpoints
        │
        ├── delivery/
        │   ├── controllers/
        │   │   ├── authController.js
        │   │   └── assignmentController.js
        │   ├── services/
        │   │   ├── authService.js
        │   │   └── assignmentService.js
        │   └── routes/
        │       └── index.js      # 7 endpoints
        │
        └── public/
            ├── controllers/
            │   └── publicController.js
            ├── services/
            │   └── publicService.js
            └── routes/
                └── index.js      # 4 endpoints
```

**File count:** 81 source files | **Total endpoints:** ~111

---

## 4. Environment Configuration

All config lives in the `.env` file at project root. **No hardcoded secrets in source code.**

```env
# ─── Application ─────────────────────────────────────────────────────────────
NODE_ENV=development          # development | production
PORT=5000                     # Server port
API_VERSION=v1                # API version prefix
APP_VERSION=2.0.0             # App version (health check)
BACKEND_BASE_URL=http://localhost:5000

# ─── CORS ────────────────────────────────────────────────────────────────────
CORS_ORIGIN=*                 # Comma-separated origins or * for all

# ─── Database (PostgreSQL) ───────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dailybox
DB_USER=postgres
DB_PASSWORD=<your-password>
DB_POOL_MAX=10
DB_POOL_MIN=2

# ─── JWT ─────────────────────────────────────────────────────────────────────
JWT_SECRET=<strong-random-secret>
JWT_EXPIRATION=7d

# ─── OTP ─────────────────────────────────────────────────────────────────────
OTP_LENGTH=6                  # Digits in OTP
OTP_EXPIRATION=5              # Minutes
MAX_OTP_ATTEMPTS=3

# ─── Admin Migration ─────────────────────────────────────────────────────────
ADMIN_USERNAME=admin          # Initial admin username
ADMIN_PASSWORD=<strong-password>
```

### Required Variables (fail-fast at startup)

`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`

---

## 5. Database Schema

### 5.1 Table Overview

| # | Table | Source | Description |
|---|-------|--------|-------------|
| 1 | `users` | init.js | All user accounts (admin, customer, vendor, delivery) |
| 2 | `otps` | init.js | OTP codes for phone verification |
| 3 | `addresses` | init.js | User delivery addresses |
| 4 | `restaurants` | init.js | Restaurant listings |
| 5 | `menu_items` | init.js | Food menu items per restaurant |
| 6 | `cart` | init.js | Shopping cart items |
| 7 | `orders` | init.js | Order records |
| 8 | `order_items` | init.js | Items within each order |
| 9 | `vendor_details` | init-modules.js | Vendor business information |
| 10 | `vendor_stores` | init-modules.js | Vendor store locations |
| 11 | `products` | init-modules.js | Vendor store products |
| 12 | `product_images` | init-modules.js | Product image galleries |
| 13 | `reviews` | init-modules.js | Store/product reviews |
| 14 | `menu_item_reviews` | init-modules.js | Menu item reviews by customers |
| 15 | `delivery_partners` | init-modules.js | Delivery partner profiles |
| 16 | `delivery_assignments` | init-modules.js | Order-to-partner assignments |
| 17 | `payments` | init-modules.js | Payment transactions |
| 18 | `vendor_payouts` | init-modules.js | Vendor payout records |
| 19 | `delivery_earnings` | init-modules.js | Delivery earning records |

### 5.2 Core Tables (init.js)

#### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| full_name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE |
| mobile_number | VARCHAR(15) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | |
| role | VARCHAR(50) | DEFAULT 'customer' |
| is_active | BOOLEAN | DEFAULT true |
| is_verified | BOOLEAN | DEFAULT false |
| profile_pic | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

> **Note:** `init-modules.js` adds columns: `username VARCHAR(100) UNIQUE`, `last_login TIMESTAMP`, `device_token TEXT`, `preferred_language VARCHAR(10) DEFAULT 'en'`

#### `otps`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| mobile_number | VARCHAR(15) | NOT NULL |
| otp_code | VARCHAR(10) | NOT NULL |
| expires_at | TIMESTAMP | NOT NULL |
| is_used | BOOLEAN | DEFAULT false |
| attempts | INT | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `addresses`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INT | FK → users(id) ON DELETE CASCADE |
| label | VARCHAR(50) | (e.g. home, office) |
| address_line1 | VARCHAR(255) | NOT NULL |
| address_line2 | VARCHAR(255) | |
| city | VARCHAR(100) | NOT NULL |
| state | VARCHAR(100) | |
| postal_code | VARCHAR(20) | |
| latitude | DECIMAL(10,8) | |
| longitude | DECIMAL(11,8) | |
| is_primary | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `restaurants`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| cuisine_type | VARCHAR(100) | |
| address | TEXT | |
| city | VARCHAR(100) | |
| latitude | DECIMAL(10,8) | |
| longitude | DECIMAL(11,8) | |
| rating | DECIMAL(3,2) | DEFAULT 0 |
| phone | VARCHAR(15) | |
| image_url | TEXT | |
| opening_time | TIME | |
| closing_time | TIME | |
| is_active | BOOLEAN | DEFAULT true |
| delivery_radius_km | DECIMAL(5,2) | |
| min_order_amount | DECIMAL(10,2) | |
| avg_delivery_time | INT | (minutes) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

> **Note:** `init-modules.js` adds: `vendor_id INT REFERENCES users(id)`, `is_featured BOOLEAN DEFAULT false`, `commission_rate DECIMAL(5,2) DEFAULT 10.00`

#### `menu_items`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| restaurant_id | INT | FK → restaurants(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| price | DECIMAL(10,2) | NOT NULL |
| category | VARCHAR(100) | |
| image_url | TEXT | |
| is_vegetarian | BOOLEAN | DEFAULT false |
| is_available | BOOLEAN | DEFAULT true |
| preparation_time | INT | (minutes) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

> **Note:** `init-modules.js` adds: `is_bestseller BOOLEAN DEFAULT false`, `discount_percent DECIMAL(5,2) DEFAULT 0`, `spice_level VARCHAR(20)`

#### `cart`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INT | FK → users(id) ON DELETE CASCADE |
| menu_item_id | INT | FK → menu_items(id) ON DELETE CASCADE |
| quantity | INT | NOT NULL, DEFAULT 1 |
| special_instructions | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

> **Note:** `init-modules.js` adds: `product_id INT REFERENCES products(id)`, `item_type VARCHAR(20) DEFAULT 'menu_item'`

#### `orders`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INT | FK → users(id) |
| restaurant_id | INT | FK → restaurants(id) |
| total_amount | DECIMAL(10,2) | NOT NULL |
| status | VARCHAR(50) | DEFAULT 'pending' |
| delivery_address | TEXT | |
| payment_method | VARCHAR(50) | |
| payment_status | VARCHAR(50) | DEFAULT 'pending' |
| special_instructions | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

> **Note:** `init-modules.js` adds: `vendor_id INT REFERENCES users(id)`, `delivery_partner_id INT REFERENCES delivery_partners(id)`, `delivery_fee DECIMAL(10,2) DEFAULT 0`, `estimated_delivery_time INT`, `actual_delivery_time TIMESTAMP`, `cancelled_reason TEXT`

#### `order_items`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INT | FK → orders(id) ON DELETE CASCADE |
| menu_item_id | INT | FK → menu_items(id) |
| quantity | INT | NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| special_instructions | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 5.3 Module Tables (init-modules.js)

#### `vendor_details`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INT | FK → users(id) ON DELETE CASCADE, UNIQUE |
| business_name | VARCHAR(255) | NOT NULL |
| business_type | VARCHAR(100) | |
| gst_number | VARCHAR(50) | |
| pan_number | VARCHAR(20) | |
| bank_account | VARCHAR(50) | |
| ifsc_code | VARCHAR(20) | |
| approval_status | VARCHAR(50) | DEFAULT 'pending' |
| approved_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `vendor_stores`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| vendor_id | INT | FK → users(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| store_type | VARCHAR(50) | (grocery, pharmacy, vegetables) |
| address | TEXT | |
| city | VARCHAR(100) | |
| latitude | DECIMAL(10,8) | |
| longitude | DECIMAL(11,8) | |
| phone | VARCHAR(15) | |
| image_url | TEXT | |
| is_active | BOOLEAN | DEFAULT true |
| opening_time | TIME | |
| closing_time | TIME | |
| delivery_radius_km | DECIMAL(5,2) | |
| min_order_amount | DECIMAL(10,2) | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `products`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| store_id | INT | FK → vendor_stores(id) ON DELETE CASCADE |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| price | DECIMAL(10,2) | NOT NULL |
| mrp | DECIMAL(10,2) | |
| category | VARCHAR(100) | |
| sub_category | VARCHAR(100) | |
| unit | VARCHAR(50) | (e.g. kg, piece, strip) |
| stock_quantity | INT | DEFAULT 0 |
| image_url | TEXT | |
| is_available | BOOLEAN | DEFAULT true |
| is_prescription_required | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `product_images`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| product_id | INT | FK → products(id) ON DELETE CASCADE |
| image_url | TEXT | NOT NULL |
| is_primary | BOOLEAN | DEFAULT false |
| sort_order | INT | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `reviews`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INT | FK → users(id) ON DELETE CASCADE |
| store_id | INT | FK → vendor_stores(id) ON DELETE CASCADE |
| order_id | INT | FK → orders(id) |
| rating | INT | NOT NULL, CHECK(1–5) |
| comment | TEXT | |
| vendor_reply | TEXT | |
| replied_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `menu_item_reviews`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INT | FK → users(id) ON DELETE CASCADE |
| menu_item_id | INT | FK → menu_items(id) ON DELETE CASCADE |
| rating | INT | NOT NULL, CHECK(1–5) |
| comment | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**Unique:** `(user_id, menu_item_id)` — one review per user per item.

#### `delivery_partners`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| user_id | INT | FK → users(id) ON DELETE CASCADE, UNIQUE |
| vehicle_type | VARCHAR(50) | |
| vehicle_number | VARCHAR(50) | |
| license_number | VARCHAR(50) | |
| is_available | BOOLEAN | DEFAULT false |
| current_latitude | DECIMAL(10,8) | |
| current_longitude | DECIMAL(11,8) | |
| total_deliveries | INT | DEFAULT 0 |
| rating | DECIMAL(3,2) | DEFAULT 5.00 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `delivery_assignments`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INT | FK → orders(id), UNIQUE |
| delivery_partner_id | INT | FK → delivery_partners(id) |
| status | VARCHAR(50) | DEFAULT 'assigned' |
| picked_up_at | TIMESTAMP | |
| delivered_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `payments`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| order_id | INT | FK → orders(id) |
| user_id | INT | FK → users(id) |
| amount | DECIMAL(10,2) | NOT NULL |
| method | VARCHAR(50) | NOT NULL |
| transaction_id | VARCHAR(255) | |
| status | VARCHAR(50) | DEFAULT 'pending' |
| paid_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `vendor_payouts`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| vendor_id | INT | FK → users(id) |
| total_orders | INT | |
| total_amount | NUMERIC(10,2) | |
| payout_amount | NUMERIC(10,2) | |
| payout_status | VARCHAR(50) | DEFAULT 'pending' |
| payout_date | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### `delivery_earnings`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| delivery_partner_id | INT | FK → delivery_partners(id) |
| order_id | INT | FK → orders(id) |
| amount | NUMERIC(10,2) | |
| status | VARCHAR(50) | DEFAULT 'pending' |
| settled_at | TIMESTAMP | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### 5.4 Indexes

**Core indexes (init.js — 6):**

| Index | Table | Column(s) |
|-------|-------|-----------|
| idx_users_mobile | users | mobile_number |
| idx_menu_items_restaurant | menu_items | restaurant_id |
| idx_cart_user | cart | user_id |
| idx_orders_user | orders | user_id |
| idx_orders_restaurant | orders | restaurant_id |
| idx_order_items_order | order_items | order_id |

**Module indexes (init-modules.js — 19):**

| Index | Table | Column(s) |
|-------|-------|-----------|
| idx_users_role | users | role |
| idx_users_username | users | username |
| idx_addresses_user | addresses | user_id |
| idx_restaurants_vendor | restaurants | vendor_id |
| idx_restaurants_city | restaurants | city |
| idx_vendor_stores_vendor | vendor_stores | vendor_id |
| idx_vendor_stores_type | vendor_stores | store_type |
| idx_vendor_stores_city | vendor_stores | city |
| idx_products_store | products | store_id |
| idx_products_category | products | category |
| idx_product_images_product | product_images | product_id |
| idx_reviews_store | reviews | store_id |
| idx_reviews_user | reviews | user_id |
| idx_menu_item_reviews_item | menu_item_reviews | menu_item_id |
| idx_delivery_partners_user | delivery_partners | user_id |
| idx_delivery_assignments_order | delivery_assignments | order_id |
| idx_delivery_assignments_partner | delivery_assignments | delivery_partner_id |
| idx_payments_order | payments | order_id |
| idx_delivery_earnings_partner | delivery_earnings | delivery_partner_id |

### 5.5 Entity Relationships

```
users ─────────┬──────── otps (mobile_number)
               ├──────── addresses (user_id)
               ├──────── cart (user_id)
               ├──────── orders (user_id)
               ├──────── vendor_details (user_id) [1:1]
               ├──────── delivery_partners (user_id) [1:1]
               ├──────── reviews (user_id)
               ├──────── menu_item_reviews (user_id)
               └──────── payments (user_id)

restaurants ───┬──────── menu_items (restaurant_id)
               └──────── orders (restaurant_id)

vendor_stores ─┬──────── products (store_id)
               └──────── reviews (store_id)

products ──────┤──────── product_images (product_id)

orders ────────┬──────── order_items (order_id)
               ├──────── delivery_assignments (order_id)
               ├──────── payments (order_id)
               └──────── delivery_earnings (order_id)

delivery_partners ─┬──── delivery_assignments (delivery_partner_id)
                   └──── delivery_earnings (delivery_partner_id)
```

---

## 6. Authentication & Authorization

### 6.1 JWT Token

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

**Token payload:**
```json
{
  "userId": 1,
  "role": "admin",        // admin | customer | vendor | delivery
  "mobileNumber": "9876543210",
  "iat": 1719000000,
  "exp": 1719604800
}
```

**Expiry:** Configurable via `JWT_EXPIRATION` (default `7d`).

### 6.2 Middleware Chain

| Middleware | File | Purpose |
|-----------|------|---------|
| `authenticate` | middleware/authentication.js | Decode JWT, set `req.user` — **rejects** if missing/invalid |
| `optionalAuthenticate` | middleware/authentication.js | Decode JWT if present, never rejects |
| `requireRole(...roles)` | middleware/rbac.js | Check `req.user.role` against allowed roles — **must be placed after `authenticate`** |
| `requireAuth` | middleware/rbac.js | Ensure `req.user` exists (role-agnostic) |

### 6.3 Auth Flows by App

#### Admin App — Username + Password

```
1. POST /api/v1/auth/login
   Body: { "username": "admin", "password": "..." }
   
2. Backend:
   → Find user by username
   → Compare bcrypt hash
   → Generate JWT with role: "admin"
   
3. Response: { token, user: { id, fullName, role } }

4. All subsequent requests:
   Authorization: Bearer <token>
   → authenticate middleware → requireRole('admin')
```

#### Customer App — OTP Primary

```
Flow A — OTP Login (existing user):
  1. POST /api/v1/auth/send-otp        → { mobileNumber: "9876543210" }
  2. POST /api/v1/auth/verify-otp      → { mobileNumber: "...", otpCode: "123456" }
  3. Response: { token, user, isNewUser: false }

Flow B — New Registration:
  1. POST /api/v1/auth/send-otp        → { mobileNumber: "9876543210" }
  2. POST /api/v1/auth/verify-otp      → Verify phone, get temp context
  3. POST /api/v1/auth/register        → { mobileNumber, fullName, email, password }
  4. Response: { token, user, isNewUser: true }

Post-login: Use core routes (restaurants, menu, cart, orders) + customer module routes.
```

#### Vendor App — Password + OTP

```
Flow A — Registration:
  1. POST /api/v1/vendor/auth/send-otp       → { mobileNumber }
  2. POST /api/v1/vendor/auth/verify-otp     → { mobileNumber, otpCode }
  3. POST /api/v1/vendor/auth/register       → { mobileNumber, fullName, password, businessName, ... }
  4. Response: { token, user: { role: "vendor" } }

Flow B — Login:
  1. POST /api/v1/vendor/auth/login          → { mobileNumber, password }
  2. Response: { token, user }

Flow C — Forgot Password:
  1. POST /api/v1/vendor/auth/forgot-password → { mobileNumber }
  2. POST /api/v1/vendor/auth/reset-password  → { mobileNumber, otpCode, newPassword }

Post-login: All /api/v1/vendor/* routes → authenticate + requireRole('vendor')
```

#### Delivery App — OTP Auto-Register

```
1. POST /api/v1/delivery/auth/send-otp      → { mobileNumber }
2. POST /api/v1/delivery/auth/verify-otp    → { mobileNumber, otpCode }
   → If user doesn't exist: auto-create with role "delivery"
   → If user exists: log in
3. Response: { token, user: { role: "delivery" } }

Post-login: All /api/v1/delivery/* routes → authenticate + requireRole('delivery')
```

---

## 7. API Reference — Core Routes

**Base URL:** `/api/v1`

### 7.1 Auth (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/send-otp` | No | Send OTP to mobile number |
| POST | `/auth/verify-otp` | No | Verify OTP — login or signal new user |
| POST | `/auth/register` | No | Register with name, email, password |
| POST | `/auth/login` | No | Login with username + password (admin) |
| PUT | `/auth/change-password` | Yes | Change password for logged-in user |

### 7.2 Users (`/api/v1/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/profile` | Yes | Get own profile |
| PUT | `/users/profile` | Yes | Update own profile |
| GET | `/users` | Yes | List all users |
| POST | `/users` | Yes | Create user |

### 7.3 Restaurants (`/api/v1/restaurants`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/restaurants` | Optional | List restaurants (paginated) |
| GET | `/restaurants/search` | Optional | Search by name/cuisine |
| GET | `/restaurants/nearby` | Optional | Nearby by lat/lng |
| POST | `/restaurants` | Yes | Create restaurant |
| GET | `/restaurants/:restaurantId` | Optional | Restaurant details |

### 7.4 Menu (`/api/v1/menu`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/menu/restaurant/:restaurantId` | Optional | Menu by restaurant |
| GET | `/menu/restaurant/:restaurantId/categories` | Optional | Menu categories |
| GET | `/menu/restaurant/:restaurantId/category/:category` | Optional | Items by category |
| GET | `/menu/restaurant/:restaurantId/search` | Optional | Search menu items |
| GET | `/menu/:menuItemId` | Optional | Item detail |

### 7.5 Cart (`/api/v1/cart`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/cart/add` | Yes | Add item to cart |
| GET | `/cart` | Yes | Get cart contents |
| PUT | `/cart/:cartId` | Yes | Update quantity |
| DELETE | `/cart/:cartId` | Yes | Remove item |
| DELETE | `/cart` | Yes | Clear entire cart |

### 7.6 Orders (`/api/v1/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | Yes | Place order |
| GET | `/orders` | Yes | List user orders |
| GET | `/orders/:orderId` | Yes | Order details |
| PUT | `/orders/:orderId/status` | Yes | Update order status |

---

## 8. API Reference — Admin Module

**Base:** `/api/v1/admin`  
**Auth:** All routes require `authenticate` + `requireRole('admin')`

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard/metrics` | Platform-wide metrics |

### User Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/:id` | Update user |
| PATCH | `/admin/users/:id/status` | Toggle user active/inactive |

### Vendor Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/vendors` | List vendors |
| POST | `/admin/vendors` | Create vendor |
| GET | `/admin/vendors/:id` | Vendor detail |
| POST | `/admin/vendors/:id/approve` | Approve vendor |
| POST | `/admin/vendors/:id/reject` | Reject vendor |

### Order Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/orders` | List all orders |
| GET | `/admin/orders/:id` | Order detail |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/reports/orders` | Orders report |
| GET | `/admin/reports/revenue` | Revenue report |

### Delivery Partner Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/delivery-partners` | List all partners |
| GET | `/admin/delivery-partners/available` | Available partners |
| POST | `/admin/delivery-partners` | Create partner |
| GET | `/admin/delivery-partners/:id` | Partner detail |
| PUT | `/admin/delivery-partners/:id` | Update partner |
| PATCH | `/admin/delivery-partners/:id/status` | Toggle active status |
| PATCH | `/admin/delivery-partners/:id/availability` | Toggle availability |
| DELETE | `/admin/delivery-partners/:id` | Delete partner |

---

## 9. API Reference — Customer Module

**Base:** `/api/v1/customer`

### Address Management (Auth: Yes)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/customer/addresses` | List user addresses |
| POST | `/customer/addresses` | Create address |
| PUT | `/customer/addresses/:addressId` | Update address |
| DELETE | `/customer/addresses/:addressId` | Delete address |
| PUT | `/customer/addresses/:addressId/primary` | Set as primary |

### Menu Item Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/customer/menu/:menuItemId/reviews` | Optional | List reviews |
| POST | `/customer/menu/:menuItemId/reviews` | Yes | Create/update review |
| DELETE | `/customer/menu/:menuItemId/reviews/:reviewId` | Yes | Delete review |
| GET | `/customer/menu/:menuItemId/details` | Optional | Item details + reviews |

### Catalog Browse

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/customer/catalog` | Optional | Catalog home |
| GET | `/customer/catalog/items/:itemId` | Optional | Item detail |

### Catalog — Grocery (`/customer/catalog/grocery`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../grocery` | List grocery stores |
| GET | `.../grocery/items` | List grocery items |
| GET | `.../grocery/search` | Search grocery items |
| GET | `.../grocery/categories` | Grocery categories |
| GET | `.../grocery/stores/:storeId` | Store detail |

### Catalog — Vegetables (`/customer/catalog/vegetables`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../vegetables` | List vegetable stores |
| GET | `.../vegetables/items` | List items |
| GET | `.../vegetables/search` | Search items |
| GET | `.../vegetables/categories` | Categories |
| GET | `.../vegetables/stores/:storeId` | Store detail |

### Catalog — Pharmacy (`/customer/catalog/pharmacy`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `.../pharmacy` | List pharmacies |
| GET | `.../pharmacy/items` | List items |
| GET | `.../pharmacy/search` | Search items |
| GET | `.../pharmacy/categories` | Categories |
| GET | `.../pharmacy/stores/:storeId` | Store detail |

### Catalog — Generic Domain (`/customer/catalog/:domain`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/customer/catalog/:domain` | Domain listing |
| GET | `/customer/catalog/:domain/items` | Domain items |
| GET | `/customer/catalog/:domain/categories` | Domain categories |
| GET | `/customer/catalog/:domain/search` | Search within domain |

---

## 10. API Reference — Vendor Module

**Base:** `/api/v1/vendor`

### Public Auth (No authentication required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/vendor/auth/send-otp` | Send OTP |
| POST | `/vendor/auth/verify-otp` | Verify OTP |
| POST | `/vendor/auth/register` | Register vendor |
| POST | `/vendor/auth/login` | Login vendor |
| POST | `/vendor/auth/forgot-password` | Request reset |
| POST | `/vendor/auth/reset-password` | Reset password |

### Protected Routes (Auth: Yes, Role: vendor)

#### Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/profile` | Get vendor profile |
| PUT | `/vendor/profile` | Update profile |

#### Stores

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/stores` | List own stores |
| POST | `/vendor/stores` | Create store |
| PUT | `/vendor/stores/:id` | Update store |
| PATCH | `/vendor/stores/:id/status` | Toggle store status |

#### Products

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/products` | List products |
| POST | `/vendor/products` | Create product |
| PUT | `/vendor/products/:id` | Update product |
| DELETE | `/vendor/products/:id` | Delete product |
| POST | `/vendor/products/:id/images` | Add product image |

#### Orders

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/orders` | List vendor orders |
| GET | `/vendor/orders/:id` | Order detail |
| PATCH | `/vendor/orders/:id/accept` | Accept order |
| PATCH | `/vendor/orders/:id/status` | Update status |

#### Dashboard & Reviews

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/dashboard` | Dashboard metrics |
| GET | `/vendor/reviews` | List reviews |
| POST | `/vendor/reviews/:id/reply` | Reply to review |

#### Uploads

| Method | Path | Description |
|--------|------|-------------|
| POST | `/vendor/upload-image` | Upload image (multipart/form-data) |

---

## 11. API Reference — Delivery Module

**Base:** `/api/v1/delivery`

### Public Auth (No authentication required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/delivery/auth/send-otp` | Send OTP |
| POST | `/delivery/auth/verify-otp` | Verify OTP + auto-register |

### Protected Routes (Auth: Yes, Role: delivery)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/delivery/orders` | Get assigned orders |
| PATCH | `/delivery/orders/:id/status` | Update delivery status |
| POST | `/delivery/location` | Update current location |
| PATCH | `/delivery/availability` | Toggle availability |
| GET | `/delivery/earnings` | Get earnings |

---

## 12. API Reference — Public Module

**Base:** `/api/v1/public`  
**Auth:** None — fully public endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/public/cities` | Active city list |
| GET | `/public/cities/:city/stores` | Stores in a city |
| GET | `/public/stores/:id` | Store details |
| GET | `/public/orders/:id/track` | Track order status |

---

## 13. Response Format

Every API response follows a consistent JSON envelope.

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error: mobile number must be 10 digits",
  "error": { ... },      // Only in NODE_ENV=development
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  },
  "timestamp": "2025-06-01T12:00:00.000Z"
}
```

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

---

## 14. Error Handling

### asyncHandler Pattern

Every controller function is wrapped in `asyncHandler` which catches thrown/rejected errors and forwards them to the centralized error handler:

```js
import { asyncHandler } from '../../middleware/errorHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.userId);
  res.json(successResponse(profile, 'Profile fetched'));
});
```

### Central Error Handler (`middleware/errorHandler.js`)

- Logs error details (message, stack, path, method)
- Sends standardized error response
- Hides stack traces in production

### Error Flow

```
Controller throws/rejects
  → asyncHandler catches
    → next(error)
      → errorHandler middleware
        → log error
        → res.json(errorResponse(...))
```

---

## 15. Validation

### Joi Schema Validation Pattern

Validation happens at the **controller** level before calling the service:

```js
// In controller
import { validateSendOTP } from '../../../validators/deliveryValidators.js';

export const sendOTP = asyncHandler(async (req, res) => {
  const { error, value } = validateSendOTP.validate(req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await authService.sendOTP(value.mobileNumber);
  res.json(successResponse(result, 'OTP sent'));
});
```

### Validator Files

| File | Schemas |
|------|---------|
| `validators/index.js` | Core: sendOTP, verifyOTP, register, login, updateProfile, addAddress, addToCart, placeOrder, updateOrderStatus, addRestaurant, addMenuItem |
| `validators/customerValidators.js` | createAddress, updateAddress, createMenuItemReview, catalogSearch |
| `validators/vendorValidators.js` | vendorRegister, vendorLogin, vendorOTP, verifyOTP, resetPassword, createStore, updateStore, createProduct, updateProduct, updateOrderStatus |
| `validators/deliveryValidators.js` | sendOTP, verifyOTP, updateDeliveryStatus, updateLocation |

---

## 16. Integration Guide — Admin App (React)

### Routes Used

The Admin React app primarily uses:

| Category | Base Path |
|----------|-----------|
| Login | `/api/v1/auth/login` |
| Dashboard | `/api/v1/admin/dashboard/*` |
| User Management | `/api/v1/admin/users/*` |
| Vendor Management | `/api/v1/admin/vendors/*` |
| Order Management | `/api/v1/admin/orders/*` |
| Reports | `/api/v1/admin/reports/*` |
| Delivery Partners | `/api/v1/admin/delivery-partners/*` |
| Restaurants (CRUD) | `/api/v1/restaurants/*` |
| Menu (CRUD) | `/api/v1/menu/*` |

### Auth Integration

```js
// Login
const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: '...' })
});
const { data } = await response.json();
localStorage.setItem('token', data.token);

// Authenticated request
const res = await fetch(`${BASE_URL}/api/v1/admin/dashboard/metrics`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### SPA Serving (Production)

The backend serves the Admin build files from `../adminapp/build/`. In production:
1. Build React app: `npm run build` (in adminapp directory)
2. Place build output at `../adminapp/build/` relative to `backend-unified/`
3. Non-API routes are handled by `index.html` (SPA fallback)

### CORS Configuration

For local development, set `CORS_ORIGIN=http://localhost:3000` (default React dev port). For production, set to your admin app domain.

---

## 17. Integration Guide — Customer App (Mobile)

### Routes Used

| Feature | Routes |
|---------|--------|
| Login/Register | `/api/v1/auth/send-otp`, `/api/v1/auth/verify-otp`, `/api/v1/auth/register` |
| Profile | `/api/v1/users/profile` (GET, PUT) |
| Addresses | `/api/v1/customer/addresses/*` |
| Restaurants | `/api/v1/restaurants/*` |
| Menu | `/api/v1/menu/*` |
| Menu Reviews | `/api/v1/customer/menu/:menuItemId/*` |
| Catalog (Grocery/Vegetables/Pharmacy) | `/api/v1/customer/catalog/*` |
| Cart | `/api/v1/cart/*` |
| Orders | `/api/v1/orders/*` |
| Order Tracking | `/api/v1/public/orders/:id/track` |

### Auth Integration (Kotlin/Swift)

```kotlin
// OTP login flow
val sendOtpResponse = api.post("/api/v1/auth/send-otp", 
    mapOf("mobileNumber" to "9876543210"))

val verifyResponse = api.post("/api/v1/auth/verify-otp",
    mapOf("mobileNumber" to "9876543210", "otpCode" to "123456"))

val token = verifyResponse.data.token
// Store token securely (DataStore / Keychain)

// Authenticated request — add interceptor
okHttpClient.addInterceptor { chain ->
    chain.proceed(chain.request().newBuilder()
        .addHeader("Authorization", "Bearer $token")
        .build())
}
```

### Typical User Flow

```
App Launch → Check stored token → Valid? → Home Screen
                                → Expired? → OTP Login

Home → GET /restaurants → Display list
     → GET /customer/catalog → Display Grocery/Vegetables/Pharmacy

Restaurant Detail → GET /menu/restaurant/:id → Show menu
                  → POST /cart/add → Add to cart

Cart → GET /cart → Show items
     → PUT /cart/:id → Update quantity
     → POST /orders → Place order

Order History → GET /orders → List orders
             → GET /public/orders/:id/track → Track delivery
```

---

## 18. Integration Guide — Vendor App (Mobile)

### Routes Used

| Feature | Routes |
|---------|--------|
| Registration | `/api/v1/vendor/auth/register`, `/api/v1/vendor/auth/send-otp`, `/api/v1/vendor/auth/verify-otp` |
| Login | `/api/v1/vendor/auth/login` |
| Forgot Password | `/api/v1/vendor/auth/forgot-password`, `/api/v1/vendor/auth/reset-password` |
| Profile | `/api/v1/vendor/profile` (GET, PUT) |
| Stores | `/api/v1/vendor/stores/*` |
| Products | `/api/v1/vendor/products/*` |
| Orders | `/api/v1/vendor/orders/*` |
| Dashboard | `/api/v1/vendor/dashboard` |
| Reviews | `/api/v1/vendor/reviews/*` |
| Image Upload | `/api/v1/vendor/upload-image` |

### Auth Integration

```kotlin
// Register
val registerResponse = api.post("/api/v1/vendor/auth/register", mapOf(
    "mobileNumber" to "9876543210",
    "fullName" to "Store Owner",
    "password" to "SecurePass1",
    "businessName" to "Fresh Foods"
))

// Login
val loginResponse = api.post("/api/v1/vendor/auth/login", mapOf(
    "mobileNumber" to "9876543210",
    "password" to "SecurePass1"
))
val token = loginResponse.data.token
```

### Typical Vendor Flow

```
Registration → OTP Verify → Fill Business Details → Await Admin Approval

Login → Dashboard (GET /vendor/dashboard)
      → Manage Stores (CRUD /vendor/stores/*)
      → Manage Products (CRUD /vendor/products/*)

Incoming Orders → GET /vendor/orders
               → PATCH /vendor/orders/:id/accept
               → PATCH /vendor/orders/:id/status (preparing → ready)

Reviews → GET /vendor/reviews
        → POST /vendor/reviews/:id/reply
```

### Image Upload (Multipart)

```kotlin
val requestBody = MultipartBody.Builder()
    .setType(MultipartBody.FORM)
    .addFormDataPart("image", "photo.jpg",
        file.asRequestBody("image/jpeg".toMediaType()))
    .build()

api.post("/api/v1/vendor/upload-image", requestBody)
// Response: { data: { imageUrl: "/uploads/..." } }
```

---

## 19. Integration Guide — Delivery App (Mobile)

### Routes Used

| Feature | Routes |
|---------|--------|
| Login (OTP) | `/api/v1/delivery/auth/send-otp`, `/api/v1/delivery/auth/verify-otp` |
| Assigned Orders | `/api/v1/delivery/orders` |
| Update Status | `/api/v1/delivery/orders/:id/status` |
| Location Update | `/api/v1/delivery/location` |
| Availability | `/api/v1/delivery/availability` |
| Earnings | `/api/v1/delivery/earnings` |

### Auth Integration

```kotlin
// OTP auto-register flow
api.post("/api/v1/delivery/auth/send-otp", 
    mapOf("mobileNumber" to "9876543210"))

val response = api.post("/api/v1/delivery/auth/verify-otp",
    mapOf("mobileNumber" to "9876543210", "otpCode" to "123456"))
// Auto-creates delivery partner if first time

val token = response.data.token
```

### Typical Delivery Flow

```
Login (OTP) → Set Availability ON

Active → GET /delivery/orders → List assigned orders
       → PATCH /delivery/orders/:id/status → "picked_up"
       → POST /delivery/location → Update GPS
       → PATCH /delivery/orders/:id/status → "delivered"
       → PATCH /delivery/availability → Toggle OFF

Earnings → GET /delivery/earnings → View earnings history
```

### Location Update (Background)

```kotlin
// Send location updates every 30 seconds while on delivery
api.post("/api/v1/delivery/location", mapOf(
    "latitude" to 12.9716,
    "longitude" to 77.5946
))
```

---

## 20. Setup & Running

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm 9+

### Installation

```bash
cd backend-unified
npm install
```

### Database Setup

```bash
# 1. Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE dailybox;"

# 2. Configure .env (see §4)
cp .env.example .env
# Edit DB credentials

# 3. Start server (auto-creates tables on first run)
npm run dev

# 4. Seed admin user
npm run migrate-admin

# 5. (Optional) Seed sample data
npm run seed
```

### NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `node src/server.js` | Production start |
| `dev` | `nodemon src/server.js` | Development with auto-reload |
| `seed` | `node src/db/seed.js` | Seed sample data |
| `migrate-admin` | `node src/db/migrate-admin.js` | Create initial admin user |

### Health Check

```bash
curl http://localhost:5000/health
# { "status": "ok", "message": "DailyBox Backend is running", "version": "2.0.0" }
```

### Startup Sequence

```
1. Load .env variables
2. Validate required env vars (DB_*, JWT_SECRET)
3. Initialize database connection pool
4. Run init.js → Create 11 core tables + 6 indexes
5. Run init-modules.js → Create 7 module tables + 16 ALTER TABLEs + 19 indexes
6. Mount middleware (helmet, cors, body-parser, morgan)
7. Mount routes (core + modules)
8. Mount SPA fallback (admin build)
9. Mount 404 handler
10. Mount error handler
11. Listen on PORT
```

---

## Quick Reference — Which Routes Does Each App Use?

| Route Group | Admin | Customer | Vendor | Delivery | Public |
|-------------|:-----:|:--------:|:------:|:--------:|:------:|
| `/auth/*` | Login | OTP + Register | — | — | — |
| `/users/*` | — | Profile | — | — | — |
| `/restaurants/*` | CRUD | Browse | — | — | — |
| `/menu/*` | CRUD | Browse | — | — | — |
| `/cart/*` | — | Full CRUD | — | — | — |
| `/orders/*` | View + Status | Place + View | — | — | — |
| `/admin/*` | **Full Access** | — | — | — | — |
| `/customer/*` | — | **Full Access** | — | — | — |
| `/vendor/*` | — | — | **Full Access** | — | — |
| `/delivery/*` | — | — | — | **Full Access** | — |
| `/public/*` | — | Track | — | — | **Full Access** |

---

*End of Technical Design Document*
