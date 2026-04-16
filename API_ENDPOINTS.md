# DailyBox API — Complete Request & Response Reference

**Base URL:** `https://dailyboxapp.com/api/v1`

---

## Table of Contents

1. [Response Format](#response-format)
2. [Authentication — `/api/v1/auth`](#1-authentication)
3. [Users — `/api/v1/users`](#2-users)
4. [Restaurants — `/api/v1/restaurants`](#3-restaurants)
5. [Menu — `/api/v1/menu`](#4-menu)
6. [Cart — `/api/v1/cart`](#5-cart)
7. [Orders — `/api/v1/orders`](#6-orders)
8. [Upload — `/api/upload`](#7-upload)
9. [Admin — `/api/v1/admin`](#8-admin)
10. [Customer — `/api/v1/customer`](#9-customer)
11. [Vendor — `/api/v1/vendor`](#10-vendor)
12. [Delivery — `/api/v1/delivery`](#11-delivery)
13. [Public — `/api/v1/public`](#12-public)
14. [Health Check](#13-health-check)

---

## Response Format

All API responses follow a standardized format.

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "error": { ... },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

### Authentication

Protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## 1. Authentication

### POST `/api/v1/auth/send-otp`

Send OTP to a mobile number.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully",
  "data": {
    "success": true,
    "message": "OTP sent successfully",
    "expiresAt": "2026-04-15T10:05:00.000Z",
    "debug_otp": "123456"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

> `debug_otp` is only returned in development mode.

---

### POST `/api/v1/auth/verify-otp`

Verify OTP and login/register user. Returns JWT token.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "otpCode": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP verified successfully",
  "data": {
    "success": true,
    "message": "OTP verified successfully",
    "user": {
      "id": 1,
      "mobileNumber": "9876543210",
      "fullName": "John Doe",
      "email": "john@example.com",
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

**Error (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid OTP"
}
```

---

### POST `/api/v1/auth/register`

Register a new user with password.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "success": true,
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "mobileNumber": "9876543210",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### POST `/api/v1/auth/login`

Login with username and password.

**Auth:** None

**Request Body:**

```json
{
  "username": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "mobileNumber": "9876543210",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

**Error (401):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

### PUT `/api/v1/auth/change-password`

Change password for the logged-in user.

**Auth:** Required (Bearer Token)

**Request Body:**

```json
{
  "oldPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": null,
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 2. Users

### GET `/api/v1/users/profile`

Get the logged-in user's profile.

**Auth:** Required

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile retrieved",
  "data": {
    "id": 1,
    "mobile_number": "9876543210",
    "email": "john@example.com",
    "full_name": "John Doe",
    "profile_image_url": "https://dailyboxapp.com/uploads/profile/img.jpg",
    "is_verified": true,
    "is_active": true,
    "role": "customer",
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### PUT `/api/v1/users/profile`

Update the logged-in user's profile.

**Auth:** Required

**Request Body:**

```json
{
  "fullName": "John Updated",
  "email": "john.updated@example.com",
  "profileImageUrl": "https://dailyboxapp.com/uploads/profile/new.jpg"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "mobile_number": "9876543210",
    "email": "john.updated@example.com",
    "full_name": "John Updated",
    "profile_image_url": "https://dailyboxapp.com/uploads/profile/new.jpg"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/users`

Get all users (admin).

**Auth:** Required

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved",
  "data": {
    "users": [
      {
        "id": 1,
        "mobile_number": "9876543210",
        "email": "john@example.com",
        "full_name": "John Doe",
        "is_verified": true,
        "is_active": true,
        "role": "customer",
        "created_at": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### POST `/api/v1/users`

Create a new user (admin).

**Auth:** Required

**Request Body:**

```json
{
  "mobileNumber": "9876543211",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": 2,
    "mobile_number": "9876543211",
    "email": "jane@example.com",
    "full_name": "Jane Doe",
    "is_verified": false,
    "is_active": true,
    "role": "customer",
    "created_at": "2026-04-15T10:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 3. Restaurants

### GET `/api/v1/restaurants`

Get all active restaurants with pagination.

**Auth:** Optional

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Restaurants retrieved",
  "data": [
    {
      "id": 1,
      "name": "Spice Garden",
      "store_type": "restaurant",
      "description": "Authentic Indian cuisine",
      "rating": 4.5,
      "delivery_time": "30-45 min",
      "delivery_charge": 30,
      "logo_url": "https://dailyboxapp.com/uploads/restaurant/logo.jpg",
      "banner_url": "https://dailyboxapp.com/uploads/restaurant/banner.jpg",
      "latitude": 17.385044,
      "longitude": 78.486671,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/restaurants/search`

Search restaurants by name or cuisine type.

**Auth:** Optional

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search term |
| `page` | number | No (default: 1) | Page number |
| `limit` | number | No (default: 20) | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Search results",
  "data": [
    {
      "id": 1,
      "name": "Spice Garden",
      "store_type": "restaurant",
      "description": "Authentic Indian cuisine",
      "rating": 4.5,
      "delivery_time": "30-45 min",
      "delivery_charge": 30,
      "is_active": true
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/restaurants/nearby`

Get nearby restaurants by geolocation (Haversine formula).

**Auth:** Optional

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `latitude` | number | Yes | Latitude coordinate |
| `longitude` | number | Yes | Longitude coordinate |
| `radius` | number | No (default: 5) | Radius in km |
| `limit` | number | No (default: 20) | Max results |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Nearby restaurants retrieved",
  "data": {
    "restaurants": [
      {
        "id": 1,
        "name": "Spice Garden",
        "store_type": "restaurant",
        "description": "Authentic Indian cuisine",
        "rating": 4.5,
        "delivery_time": "30-45 min",
        "distance_km": 2.3,
        "latitude": 17.385044,
        "longitude": 78.486671
      }
    ],
    "searchCenter": {
      "latitude": 17.385044,
      "longitude": 78.486671
    },
    "radiusKm": 5
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/restaurants/:restaurantId`

Get restaurant details by ID.

**Auth:** Optional

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `restaurantId` | number | Restaurant ID |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Restaurant details retrieved",
  "data": {
    "id": 1,
    "name": "Spice Garden",
    "store_type": "restaurant",
    "description": "Authentic Indian cuisine",
    "rating": 4.5,
    "delivery_time": "30-45 min",
    "delivery_charge": 30,
    "logo_url": "https://dailyboxapp.com/uploads/restaurant/logo.jpg",
    "banner_url": "https://dailyboxapp.com/uploads/restaurant/banner.jpg",
    "latitude": 17.385044,
    "longitude": 78.486671,
    "is_active": true,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### POST `/api/v1/restaurants`

Create a new restaurant (admin).

**Auth:** Required

**Request Body:**

```json
{
  "name": "Spice Garden",
  "storeType": "restaurant",
  "description": "Authentic Indian cuisine",
  "deliveryTime": "30-45 min",
  "deliveryCharge": 30,
  "logoUrl": "https://dailyboxapp.com/uploads/restaurant/logo.jpg",
  "bannerUrl": "https://dailyboxapp.com/uploads/restaurant/banner.jpg",
  "latitude": 17.385044,
  "longitude": 78.486671
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Restaurant created successfully",
  "data": {
    "id": 10,
    "name": "Spice Garden",
    "store_type": "restaurant",
    "description": "Authentic Indian cuisine",
    "delivery_time": "30-45 min",
    "delivery_charge": 30,
    "is_active": true,
    "created_at": "2026-04-15T10:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 4. Menu

### GET `/api/v1/menu/restaurant/:restaurantId`

Get all menu items for a restaurant.

**Auth:** Optional

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `restaurantId` | number | Restaurant ID |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Menu retrieved",
  "data": {
    "restaurantId": 1,
    "menuItems": [
      {
        "id": 1,
        "restaurant_id": 1,
        "name": "Butter Chicken",
        "description": "Creamy tomato-based chicken curry",
        "price": 299,
        "category": "Main Course",
        "image_url": "https://dailyboxapp.com/uploads/menu/butter-chicken.jpg",
        "is_vegetarian": false,
        "is_available": true,
        "created_at": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25
    }
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/menu/restaurant/:restaurantId/categories`

Get all distinct menu categories for a restaurant.

**Auth:** Optional

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories retrieved",
  "data": [
    "Starters",
    "Main Course",
    "Biryani",
    "Desserts",
    "Beverages"
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/menu/restaurant/:restaurantId/category/:category`

Get menu items by category for a restaurant.

**Auth:** Optional

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `restaurantId` | number | Restaurant ID |
| `category` | string | Category name |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Menu category retrieved",
  "data": {
    "restaurantId": 1,
    "category": "Main Course",
    "menuItems": [
      {
        "id": 1,
        "name": "Butter Chicken",
        "description": "Creamy tomato-based chicken curry",
        "price": 299,
        "category": "Main Course",
        "image_url": "https://dailyboxapp.com/uploads/menu/butter-chicken.jpg",
        "is_vegetarian": false,
        "is_available": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8
    }
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/menu/restaurant/:restaurantId/search`

Search menu items within a restaurant.

**Auth:** Optional

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search term |
| `page` | number | No (default: 1) | Page number |
| `limit` | number | No (default: 20) | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Search results",
  "data": {
    "restaurantId": 1,
    "searchTerm": "chicken",
    "menuItems": [
      {
        "id": 1,
        "name": "Butter Chicken",
        "price": 299,
        "category": "Main Course",
        "is_available": true
      }
    ]
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/menu/:menuItemId`

Get a single menu item's details.

**Auth:** Optional

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `menuItemId` | number | Menu item ID |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Menu item retrieved",
  "data": {
    "id": 1,
    "restaurant_id": 1,
    "name": "Butter Chicken",
    "description": "Creamy tomato-based chicken curry",
    "price": 299,
    "category": "Main Course",
    "image_url": "https://dailyboxapp.com/uploads/menu/butter-chicken.jpg",
    "is_vegetarian": false,
    "is_available": true,
    "created_at": "2026-01-01T00:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 5. Cart

### POST `/api/v1/cart/add`

Add an item to the cart.

**Auth:** Required

**Request Body:**

```json
{
  "restaurantId": 1,
  "menuItemId": 5,
  "quantity": 2,
  "specialInstructions": "Extra spicy"
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Item added to cart",
  "data": {
    "id": 10,
    "user_id": 1,
    "product_id": 5,
    "vendor_id": 1,
    "quantity": 2,
    "special_instructions": "Extra spicy",
    "created_at": "2026-04-15T10:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/cart`

Get the current user's cart items with totals.

**Auth:** Required

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart retrieved",
  "data": {
    "items": [
      {
        "id": 10,
        "user_id": 1,
        "product_id": 5,
        "vendor_id": 1,
        "quantity": 2,
        "special_instructions": "Extra spicy",
        "name": "Butter Chicken",
        "price": 299,
        "discount_percentage": 10,
        "store_name": "Spice Garden",
        "discounted_price": 269.1,
        "created_at": "2026-04-15T10:00:00.000Z"
      }
    ],
    "totals": {
      "subtotal": 538.2,
      "vendorCount": 1
    }
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### PUT `/api/v1/cart/:cartId`

Update cart item quantity.

**Auth:** Required

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `cartId` | number | Cart item ID |

**Request Body:**

```json
{
  "quantity": 3
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart item updated",
  "data": {
    "id": 10,
    "user_id": 1,
    "product_id": 5,
    "vendor_id": 1,
    "quantity": 3
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### DELETE `/api/v1/cart/:cartId`

Remove an item from the cart.

**Auth:** Required

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `cartId` | number | Cart item ID |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Item removed from cart",
  "data": null,
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### DELETE `/api/v1/cart`

Clear the entire cart.

**Auth:** Required

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart cleared",
  "data": null,
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 6. Orders

### POST `/api/v1/orders`

Place a new order from cart items.

**Auth:** Required

**Request Body:**

```json
{
  "restaurantId": 1,
  "deliveryAddressId": 5,
  "paymentMethod": "cod",
  "specialInstructions": "Ring the doorbell"
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Order placed successfully",
  "data": {
    "orderId": 100,
    "orderNumber": "ORD-1713178800000-123",
    "totalAmount": 538.2,
    "deliveryCharge": 0,
    "finalAmount": 538.2,
    "status": "pending"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/orders`

Get the current user's order history.

**Auth:** Required

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Orders retrieved",
  "data": [
    {
      "id": 100,
      "order_number": "ORD-1713178800000-123",
      "vendor_id": 1,
      "store_id": 1,
      "total_amount": 538.2,
      "final_amount": 538.2,
      "status": "delivered",
      "created_at": "2026-04-15T10:00:00.000Z",
      "completed_at": "2026-04-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "pages": 1
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/orders/:orderId`

Get order details with items.

**Auth:** Required

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `orderId` | number | Order ID |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order details retrieved",
  "data": {
    "id": 100,
    "order_number": "ORD-1713178800000-123",
    "user_id": 1,
    "vendor_id": 1,
    "store_id": 1,
    "address_id": 5,
    "total_amount": 538.2,
    "delivery_charge": 0,
    "discount_amount": 0,
    "final_amount": 538.2,
    "payment_method": "cod",
    "status": "delivered",
    "created_at": "2026-04-15T10:00:00.000Z",
    "completed_at": "2026-04-15T11:00:00.000Z",
    "items": [
      {
        "id": 1,
        "order_id": 100,
        "product_id": 5,
        "quantity": 2,
        "price": 269.1,
        "name": "Butter Chicken",
        "description": "Creamy tomato-based chicken curry",
        "image_url": "https://dailyboxapp.com/uploads/menu/butter-chicken.jpg"
      }
    ]
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### PUT `/api/v1/orders/:orderId/status`

Update order status (admin).

**Auth:** Required

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `orderId` | number | Order ID |

**Request Body:**

```json
{
  "status": "confirmed"
}
```

**Valid statuses:** `pending`, `confirmed`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `cancelled`

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order status updated",
  "data": {
    "id": 100,
    "order_number": "ORD-1713178800000-123",
    "status": "confirmed",
    "completed_at": null
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 7. Upload

### POST `/api/upload`

Upload a single image.

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | Yes | Image file (jpg, jpeg, png, webp) |
| `type` | string | Yes | Upload type (e.g., `profile`, `menu`, `restaurant`) |

**Response (201):**

```json
{
  "success": true,
  "imageUrl": "https://dailyboxapp.com/uploads/profile/img_1713178800_abc123.jpg"
}
```

---

### POST `/api/upload/multiple`

Upload multiple images (max 5).

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | file[] | Yes | Image files (max 5) |
| `type` | string | Yes | Upload type |

**Response (201):**

```json
{
  "success": true,
  "images": [
    {
      "imageUrl": "https://dailyboxapp.com/uploads/menu/img_1713178800_abc123.jpg",
      "originalName": "photo1.jpg",
      "size": 204800
    },
    {
      "imageUrl": "https://dailyboxapp.com/uploads/menu/img_1713178801_def456.jpg",
      "originalName": "photo2.jpg",
      "size": 153600
    }
  ]
}
```

---

## 8. Admin

> All admin endpoints require **authentication + admin role**.

### GET `/api/v1/admin/dashboard/metrics`

Get dashboard key metrics.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "customers": {
      "total": 1500,
      "current": 1500,
      "previous": 1350
    },
    "vendors": {
      "total": 120,
      "current": 120,
      "previous": 110
    },
    "deliveryPartners": {
      "total": 80,
      "current": 15,
      "previous": 12
    },
    "revenue": {
      "total": "₹5,00,000",
      "current": 500000,
      "previous": 425000
    },
    "orders": {
      "total": 3000,
      "active": 25
    }
  }
}
```

---

### GET `/api/v1/admin/users`

Get all customers (paginated, searchable).

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `status` | string | — | Filter by user status |
| `search` | string | — | Search by name or email |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "mobile_number": "9876543210",
      "email": "john@example.com",
      "full_name": "John Doe",
      "profile_image_url": null,
      "is_verified": true,
      "is_active": true,
      "status": "active",
      "role": "customer",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-04-01T00:00:00.000Z",
      "last_login": "2026-04-15T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1500,
    "page": 1,
    "limit": 10,
    "pages": 150
  }
}
```

---

### PUT `/api/v1/admin/users/:id`

Update a user by admin.

**Request Body:** (All fields optional)

```json
{
  "full_name": "John Updated",
  "email": "john.new@example.com",
  "status": "active",
  "role": "customer",
  "is_active": true,
  "is_verified": true
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "full_name": "John Updated",
    "email": "john.new@example.com",
    "status": "active",
    "role": "customer"
  }
}
```

---

### PATCH `/api/v1/admin/users/:id/status`

Toggle user status.

**Request Body:**

```json
{
  "status": "blocked"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "User status updated to blocked",
  "data": {
    "id": 1,
    "status": "blocked"
  }
}
```

---

### GET `/api/v1/admin/vendors`

Get all vendor stores (paginated, searchable).

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `status` | string | — | Filter by approval_status |
| `search` | string | — | Search by store or vendor name |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Spice Garden",
      "store_type": "restaurant",
      "owner": "Rajesh Kumar",
      "business_name": "Spice Garden Foods Pvt Ltd",
      "status": "approved",
      "created": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 10,
    "pages": 12
  }
}
```

---

### POST `/api/v1/admin/vendors`

Create a new vendor store.

**Request Body:**

```json
{
  "name": "Fresh Mart",
  "storeType": "grocery",
  "ownerName": "Rajesh Kumar",
  "businessName": "Fresh Mart Pvt Ltd",
  "description": "Premium grocery store",
  "deliveryTime": "15-30 min",
  "deliveryCharge": 25,
  "logoUrl": "https://dailyboxapp.com/uploads/store/logo.jpg",
  "bannerUrl": "https://dailyboxapp.com/uploads/store/banner.jpg",
  "latitude": 17.385,
  "longitude": 78.487
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Vendor store created successfully",
  "data": {
    "id": 10,
    "name": "Fresh Mart",
    "store_type": "grocery",
    "vendor_id": 5,
    "description": "Premium grocery store",
    "delivery_time": "15-30 min",
    "delivery_charge": 25,
    "is_active": true,
    "created_at": "2026-04-15T10:00:00.000Z"
  }
}
```

---

### GET `/api/v1/admin/vendors/:id`

Get vendor store detail by ID.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Spice Garden",
    "store_type": "restaurant",
    "description": "Authentic Indian cuisine",
    "rating": 4.5,
    "delivery_time": "30-45 min",
    "delivery_charge": 30,
    "logo_url": "https://dailyboxapp.com/uploads/restaurant/logo.jpg",
    "banner_url": "https://dailyboxapp.com/uploads/restaurant/banner.jpg",
    "latitude": 17.385,
    "longitude": 78.487,
    "is_active": true,
    "approval_status": "approved",
    "vendor_name": "Rajesh Kumar",
    "business_name": "Spice Garden Foods Pvt Ltd",
    "business_type": "restaurant",
    "gst_number": "GSTIN12345",
    "vendor_verified": true,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-04-01T00:00:00.000Z"
  }
}
```

---

### POST `/api/v1/admin/vendors/:id/approve`

Approve a vendor.

**Response (200):**

```json
{
  "success": true,
  "message": "Vendor approved successfully",
  "data": {
    "id": 1,
    "name": "Spice Garden",
    "approval_status": "approved"
  }
}
```

---

### POST `/api/v1/admin/vendors/:id/reject`

Reject a vendor.

**Response (200):**

```json
{
  "success": true,
  "message": "Vendor rejected successfully",
  "data": {
    "id": 1,
    "name": "Spice Garden",
    "approval_status": "rejected"
  }
}
```

---

### GET `/api/v1/admin/orders`

Get all orders (paginated, searchable).

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `status` | string | — | Filter by order status |
| `search` | string | — | Search by order number or customer name |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "order_number": "ORD-1713178800000-123",
      "customer_name": "John Doe",
      "restaurant_name": "Spice Garden",
      "amount": 538.2,
      "status": "delivered",
      "created_at": "2026-04-15T10:00:00.000Z",
      "delivery_partner_name": "Ravi"
    }
  ],
  "pagination": {
    "total": 3000,
    "page": 1,
    "limit": 10,
    "pages": 300
  }
}
```

---

### GET `/api/v1/admin/orders/:id`

Get order detail with items.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 100,
    "order_number": "ORD-1713178800000-123",
    "user_id": 1,
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "store_id": 1,
    "store_name": "Spice Garden",
    "vendor_id": 1,
    "total_amount": 538.2,
    "delivery_charge": 0,
    "discount_amount": 0,
    "final_amount": 538.2,
    "status": "delivered",
    "payment_method": "cod",
    "created_at": "2026-04-15T10:00:00.000Z",
    "completed_at": "2026-04-15T11:00:00.000Z",
    "address_line1": "123, Main Street",
    "address_line2": "Near Park",
    "city": "Hyderabad",
    "postal_code": "500001",
    "items": [
      {
        "id": 1,
        "product_id": 5,
        "product_name": "Butter Chicken",
        "quantity": 2,
        "price": 269.1
      }
    ]
  }
}
```

---

### GET `/api/v1/admin/reports/orders`

Get orders report.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | string | Yes | Start date (ISO format) |
| `endDate` | string | Yes | End date (ISO format) |
| `granularity` | string | No (default: `daily`) | Granularity |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 500,
      "completedOrders": 420,
      "cancelledOrders": 30,
      "avgOrderValue": "350.50"
    },
    "dailyOrders": [
      { "date": "2026-04-01", "orders": 25 },
      { "date": "2026-04-02", "orders": 30 }
    ],
    "statusDistribution": [
      { "status": "delivered", "count": 420 },
      { "status": "cancelled", "count": 30 },
      { "status": "pending", "count": 50 }
    ]
  }
}
```

---

### GET `/api/v1/admin/reports/revenue`

Get revenue report.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | string | Yes | Start date (ISO format) |
| `endDate` | string | Yes | End date (ISO format) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 500000,
      "commission": 50000,
      "vendorPayouts": 450000,
      "netRevenue": 50000
    },
    "dailyRevenue": [
      { "date": "2026-04-01", "revenue": 15000 },
      { "date": "2026-04-02", "revenue": 18000 }
    ],
    "revenueByCategory": [
      { "name": "Spice Garden", "value": 120000 },
      { "name": "Fresh Mart", "value": 95000 }
    ],
    "topVendors": [
      {
        "id": 1,
        "name": "Spice Garden",
        "orders": 200,
        "revenue": 120000,
        "commission": 12000
      }
    ]
  }
}
```

---

### GET `/api/v1/admin/delivery-partners`

Get all delivery partners (paginated, searchable).

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `status` | string | — | Filter by status or approval_status (`active`, `inactive`, `suspended`, `pending`, `approved`, `rejected`) |
| `search` | string | — | Search by name or mobile number |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ravi Kumar",
      "mobile": "9876543211",
      "email": "ravi@example.com",
      "vehicle": "Bike (TS09AB1234)",
      "rating": 4.8,
      "total_deliveries": 150,
      "status": "active",
      "is_available": true,
      "approval_status": "approved"
    }
  ],
  "pagination": {
    "total": 80,
    "page": 1,
    "limit": 10,
    "pages": 8
  }
}
```

---

### GET `/api/v1/admin/delivery-partners/available`

Get available delivery partners.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ravi Kumar",
      "mobile_number": "9876543211",
      "email": "ravi@example.com",
      "vehicle_type": "Bike",
      "vehicle_number": "TS09AB1234",
      "rating": 4.8,
      "total_deliveries": 150,
      "status": "active",
      "is_available": true,
      "latitude": 17.385,
      "longitude": 78.487,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 35,
    "page": 1,
    "limit": 10,
    "pages": 4
  }
}
```

---

### POST `/api/v1/admin/delivery-partners`

Create a new delivery partner.

**Request Body:**

```json
{
  "name": "Ravi Kumar",
  "mobile_number": "9876543211",
  "email": "ravi@example.com",
  "vehicle_type": "Bike",
  "vehicle_number": "TS09AB1234",
  "latitude": 17.385,
  "longitude": 78.487
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Delivery partner created successfully",
  "data": {
    "id": 5,
    "name": "Ravi Kumar",
    "mobile_number": "9876543211",
    "email": "ravi@example.com",
    "vehicle_type": "Bike",
    "vehicle_number": "TS09AB1234",
    "rating": 5.0,
    "total_deliveries": 0,
    "status": "active",
    "is_available": true,
    "approval_status": "pending",
    "latitude": 17.385,
    "longitude": 78.487,
    "created_at": "2026-04-15T10:00:00.000Z"
  }
}
```

**Error (409):**

```json
{
  "success": false,
  "message": "Mobile number already exists"
}
```

---

### GET `/api/v1/admin/delivery-partners/:id`

Get delivery partner by ID.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ravi Kumar",
    "mobile_number": "9876543211",
    "email": "ravi@example.com",
    "vehicle_type": "Bike",
    "vehicle_number": "TS09AB1234",
    "rating": 4.8,
    "total_deliveries": 150,
    "status": "active",
    "is_available": true,
    "latitude": 17.385,
    "longitude": 78.487,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### PUT `/api/v1/admin/delivery-partners/:id`

Update a delivery partner.

**Request Body:** (All fields optional)

```json
{
  "name": "Ravi Kumar Updated",
  "email": "ravi.new@example.com",
  "vehicle_type": "Car",
  "vehicle_number": "TS09CD5678",
  "status": "active",
  "is_available": true,
  "latitude": 17.386,
  "longitude": 78.488
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Delivery partner updated successfully",
  "data": {
    "id": 1,
    "name": "Ravi Kumar Updated",
    "mobile_number": "9876543211",
    "email": "ravi.new@example.com",
    "vehicle_type": "Car",
    "vehicle_number": "TS09CD5678",
    "rating": 4.8,
    "total_deliveries": 150,
    "status": "active",
    "is_available": true,
    "latitude": 17.386,
    "longitude": 78.488,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### PATCH `/api/v1/admin/delivery-partners/:id/status`

Toggle delivery partner status.

**Request Body:**

```json
{
  "status": "suspended"
}
```

**Valid statuses:** `active`, `inactive`, `suspended`

**Response (200):**

```json
{
  "success": true,
  "message": "Delivery partner status updated successfully",
  "data": {
    "id": 1,
    "name": "Ravi Kumar",
    "status": "suspended"
  }
}
```

---

### PATCH `/api/v1/admin/delivery-partners/:id/availability`

Toggle delivery partner availability.

**Request Body:**

```json
{
  "is_available": false
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Delivery partner availability updated successfully",
  "data": {
    "id": 1,
    "name": "Ravi Kumar",
    "is_available": false
  }
}
```

---

### POST `/api/v1/admin/delivery-partners/:id/approve`

Approve a delivery partner.

**Response (200):**

```json
{
  "success": true,
  "message": "Delivery partner approved successfully",
  "data": {
    "id": 1,
    "name": "Ravi Kumar",
    "approval_status": "approved"
  }
}
```

---

### POST `/api/v1/admin/delivery-partners/:id/reject`

Reject a delivery partner.

**Response (200):**

```json
{
  "success": true,
  "message": "Delivery partner rejected successfully",
  "data": {
    "id": 1,
    "name": "Ravi Kumar",
    "approval_status": "rejected"
  }
}
```

---

### DELETE `/api/v1/admin/delivery-partners/:id`

Delete a delivery partner.

**Response (200):**

```json
{
  "success": true,
  "message": "Delivery partner deleted successfully",
  "data": {
    "id": 1,
    "name": "Ravi Kumar"
  }
}
```

---

## 9. Customer

### Address Management

#### GET `/api/v1/customer/addresses`

Get all addresses for the logged-in user.

**Auth:** Required

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Addresses retrieved",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "address_line1": "123, Main Street",
      "address_line2": "Near Park",
      "city": "Hyderabad",
      "state": "Telangana",
      "postal_code": "500001",
      "latitude": 17.385,
      "longitude": 78.487,
      "is_primary": true,
      "label": "Home",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/customer/addresses`

Create a new address.

**Auth:** Required

**Request Body:**

```json
{
  "addressLine1": "123, Main Street",
  "addressLine2": "Near Park",
  "city": "Hyderabad",
  "state": "Telangana",
  "postalCode": "500001",
  "latitude": 17.385,
  "longitude": 78.487,
  "label": "Home"
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Address created",
  "data": {
    "id": 2,
    "user_id": 1,
    "address_line1": "123, Main Street",
    "address_line2": "Near Park",
    "city": "Hyderabad",
    "state": "Telangana",
    "postal_code": "500001",
    "latitude": 17.385,
    "longitude": 78.487,
    "is_primary": false,
    "label": "Home"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PUT `/api/v1/customer/addresses/:addressId`

Update an address.

**Auth:** Required

**Request Body:** (Same as create, all fields optional)

```json
{
  "addressLine1": "456, New Street",
  "city": "Bangalore"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Address updated",
  "data": {
    "id": 2,
    "address_line1": "456, New Street",
    "city": "Bangalore"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### DELETE `/api/v1/customer/addresses/:addressId`

Delete an address.

**Auth:** Required

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Address deleted",
  "data": null,
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PUT `/api/v1/customer/addresses/:addressId/primary`

Set address as primary.

**Auth:** Required

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Primary address updated",
  "data": null,
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Menu Item Reviews

#### GET `/api/v1/customer/menu/:menuItemId/reviews`

Get paginated reviews for a menu item.

**Auth:** Optional

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Reviews retrieved",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "menu_item_id": 5,
      "rating": 4,
      "comment": "Excellent taste!",
      "user_name": "John Doe",
      "created_at": "2026-04-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/customer/menu/:menuItemId/reviews`

Create or update a review for a menu item.

**Auth:** Required

**Request Body:**

```json
{
  "rating": 5,
  "comment": "Best butter chicken ever!"
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Review saved",
  "data": {
    "id": 10,
    "user_id": 1,
    "menu_item_id": 5,
    "rating": 5,
    "comment": "Best butter chicken ever!",
    "created_at": "2026-04-15T10:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### DELETE `/api/v1/customer/menu/:menuItemId/reviews/:reviewId`

Delete a review.

**Auth:** Required

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Review deleted",
  "data": null,
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### GET `/api/v1/customer/menu/:menuItemId/details`

Get menu item details with review summary.

**Auth:** Optional

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 5,
    "name": "Butter Chicken",
    "description": "Creamy tomato-based chicken curry",
    "price": 299,
    "category": "Main Course",
    "image_url": "https://dailyboxapp.com/uploads/menu/butter-chicken.jpg",
    "is_available": true,
    "avg_rating": 4.5,
    "review_count": 25
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Catalog

#### GET `/api/v1/customer/catalog`

Get catalog home page — top items + stores per domain (grocery, vegetables, pharmacy).

**Auth:** Optional

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Catalog home retrieved",
  "data": {
    "grocery": {
      "items": [
        {
          "id": 1,
          "name": "Organic Rice 5kg",
          "price": 350,
          "discount_percentage": 10,
          "image_url": "https://dailyboxapp.com/uploads/products/rice.jpg",
          "store_name": "Fresh Mart"
        }
      ],
      "stores": [
        {
          "id": 1,
          "name": "Fresh Mart",
          "logo_url": "https://dailyboxapp.com/uploads/store/logo.jpg"
        }
      ]
    },
    "vegetables": {
      "items": [...],
      "stores": [...]
    },
    "pharmacy": {
      "items": [...],
      "stores": [...]
    }
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### GET `/api/v1/customer/catalog/items/:itemId`

Get single product/catalog item details.

**Auth:** Optional

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Organic Rice 5kg",
    "description": "Premium basmati rice",
    "price": 350,
    "discount_percentage": 10,
    "category": "Rice & Grains",
    "domain": "grocery",
    "image_url": "https://dailyboxapp.com/uploads/products/rice.jpg",
    "store_id": 1,
    "store_name": "Fresh Mart",
    "is_available": true
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### GET `/api/v1/customer/catalog/:domain`

Get a catalog domain section (items, stores, categories, total count).

**Auth:** Optional

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `domain` | string | `grocery`, `vegetables`, or `pharmacy` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "grocery section retrieved",
  "data": [
    {
      "id": 1,
      "name": "Organic Rice 5kg",
      "price": 350,
      "discount_percentage": 10,
      "category": "Rice & Grains",
      "store_name": "Fresh Mart"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### GET `/api/v1/customer/catalog/:domain/items`

Get paginated products for a domain with filters.

**Auth:** Optional

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | — | Filter by category |
| `search` | string | — | Search by product name |
| `storeId` | number | — | Filter by store |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Organic Rice 5kg",
      "price": 350,
      "discount_percentage": 10,
      "category": "Rice & Grains",
      "image_url": "https://dailyboxapp.com/uploads/products/rice.jpg",
      "store_id": 1,
      "store_name": "Fresh Mart"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### GET `/api/v1/customer/catalog/:domain/categories`

Get distinct categories for a domain.

**Auth:** Optional

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories retrieved",
  "data": [
    "Rice & Grains",
    "Dairy",
    "Snacks",
    "Beverages",
    "Personal Care"
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### GET `/api/v1/customer/catalog/:domain/search`

Search products within a domain.

**Auth:** Optional

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search term |
| `page` | number | No (default: 1) | Page number |
| `limit` | number | No (default: 20) | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Organic Rice 5kg",
      "price": 350,
      "category": "Rice & Grains"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### Domain-Specific Convenience Endpoints

These follow the same request/response format as the generic `/:domain/` endpoints above:

| Endpoint | Equivalent To |
|----------|---------------|
| GET `/api/v1/customer/catalog/grocery` | `/catalog/grocery/items` (no filters) |
| GET `/api/v1/customer/catalog/grocery/items?category=` | `/catalog/grocery/items` with category filter |
| GET `/api/v1/customer/catalog/grocery/search?query=` | `/catalog/grocery/search` |
| GET `/api/v1/customer/catalog/grocery/categories` | `/catalog/grocery/categories` |
| GET `/api/v1/customer/catalog/grocery/stores/:storeId` | Store detail + its products |
| GET `/api/v1/customer/catalog/vegetables` | Same pattern as grocery |
| GET `/api/v1/customer/catalog/vegetables/items` | Same pattern |
| GET `/api/v1/customer/catalog/vegetables/search` | Same pattern |
| GET `/api/v1/customer/catalog/vegetables/categories` | Same pattern |
| GET `/api/v1/customer/catalog/vegetables/stores/:storeId` | Same pattern |
| GET `/api/v1/customer/catalog/pharmacy` | Same pattern |
| GET `/api/v1/customer/catalog/pharmacy/items` | Same pattern |
| GET `/api/v1/customer/catalog/pharmacy/search` | Same pattern |
| GET `/api/v1/customer/catalog/pharmacy/categories` | Same pattern |
| GET `/api/v1/customer/catalog/pharmacy/stores/:storeId` | Same pattern |

#### GET `/api/v1/customer/catalog/:domain/stores/:storeId`

Get store details with its products.

**Auth:** Optional

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "store": {
      "id": 1,
      "name": "Fresh Mart",
      "description": "Premium grocery store",
      "logo_url": "https://dailyboxapp.com/uploads/store/logo.jpg",
      "rating": 4.5,
      "delivery_time": "15-30 min"
    },
    "products": [
      {
        "id": 1,
        "name": "Organic Rice 5kg",
        "price": 350,
        "discount_percentage": 10,
        "category": "Rice & Grains"
      }
    ],
    "categories": ["Rice & Grains", "Dairy", "Snacks"]
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 10. Vendor

### Vendor Authentication

#### POST `/api/v1/vendor/auth/send-otp`

Send OTP to vendor mobile number.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210"
}
```

**Response (200):** Same as [Auth Send OTP](#post-apiv1authsend-otp)

---

#### POST `/api/v1/vendor/auth/verify-otp`

Verify OTP and login as vendor.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "otpCode": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "mobileNumber": "9876543210",
      "role": "vendor"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/vendor/auth/register`

Register as a new vendor.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "fullName": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "password": "SecurePass123",
  "businessName": "Fresh Mart Pvt Ltd",
  "businessType": "grocery"
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 5,
      "mobileNumber": "9876543210",
      "fullName": "Rajesh Kumar",
      "role": "vendor"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/vendor/auth/login`

Login with mobile number and password.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "password": "SecurePass123"
}
```

**Response (200):** Same as verify-otp response.

---

#### POST `/api/v1/vendor/auth/forgot-password`

Send OTP for password reset.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent for password reset",
  "data": {
    "success": true,
    "message": "OTP sent"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/vendor/auth/reset-password`

Reset password with OTP.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543210",
  "otp": "123456",
  "newPassword": "NewSecurePass456"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successful",
  "data": null,
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Vendor Profile

#### GET `/api/v1/vendor/profile`

Get vendor profile.

**Auth:** Required (Vendor)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 5,
    "mobile_number": "9876543210",
    "full_name": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "vendor_name": "Rajesh Kumar",
    "business_name": "Fresh Mart Pvt Ltd",
    "business_type": "grocery",
    "gst_number": "GSTIN12345",
    "is_verified": true
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PUT `/api/v1/vendor/profile`

Update vendor profile.

**Auth:** Required (Vendor)

**Request Body:**

```json
{
  "vendorName": "Rajesh Kumar Updated",
  "businessName": "Fresh Mart Pvt Ltd",
  "gstNumber": "GSTIN12345"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated",
  "data": { ... },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Vendor Stores

#### GET `/api/v1/vendor/stores`

Get all stores owned by the vendor.

**Auth:** Required (Vendor)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Fresh Mart - Madhapur",
      "store_type": "grocery",
      "description": "Premium grocery store",
      "rating": 4.5,
      "delivery_time": "15-30 min",
      "delivery_charge": 25,
      "logo_url": "https://dailyboxapp.com/uploads/store/logo.jpg",
      "is_active": true,
      "approval_status": "approved",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/vendor/stores`

Create a new store.

**Auth:** Required (Vendor)

**Request Body:**

```json
{
  "name": "Fresh Mart - Gachibowli",
  "storeType": "grocery",
  "description": "Premium grocery store",
  "deliveryTime": "15-30 min",
  "deliveryCharge": 25,
  "logoUrl": "https://dailyboxapp.com/uploads/store/logo.jpg",
  "bannerUrl": "https://dailyboxapp.com/uploads/store/banner.jpg",
  "latitude": 17.440,
  "longitude": 78.348
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Store created",
  "data": {
    "id": 2,
    "name": "Fresh Mart - Gachibowli",
    "store_type": "grocery",
    "is_active": true,
    "created_at": "2026-04-15T10:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PUT `/api/v1/vendor/stores/:id`

Update a store.

**Auth:** Required (Vendor)

**Request Body:** (All fields optional)

```json
{
  "name": "Fresh Mart - Updated",
  "description": "Updated description",
  "deliveryTime": "20-35 min"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Store updated",
  "data": { ... },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PATCH `/api/v1/vendor/stores/:id/status`

Toggle store open/closed status.

**Auth:** Required (Vendor)

**Request Body:**

```json
{
  "isActive": false
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Store is now closed",
  "data": { ... },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Vendor Products

#### GET `/api/v1/vendor/products`

Get all products owned by the vendor.

**Auth:** Required (Vendor)

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `store_id` | number | Optional — filter by store |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Organic Rice 5kg",
      "description": "Premium basmati rice",
      "price": 350,
      "discount_percentage": 10,
      "category": "Rice & Grains",
      "domain": "grocery",
      "store_id": 1,
      "image_url": "https://dailyboxapp.com/uploads/products/rice.jpg",
      "is_available": true,
      "images": [
        {
          "id": 1,
          "image_url": "https://dailyboxapp.com/uploads/products/rice.jpg",
          "is_primary": true
        }
      ]
    }
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/vendor/products`

Create a new product.

**Auth:** Required (Vendor)

**Request Body:**

```json
{
  "name": "Organic Rice 5kg",
  "description": "Premium basmati rice",
  "price": 350,
  "discountPercentage": 10,
  "category": "Rice & Grains",
  "domain": "grocery",
  "storeId": 1,
  "imageUrl": "https://dailyboxapp.com/uploads/products/rice.jpg",
  "isAvailable": true
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Product created",
  "data": {
    "id": 10,
    "name": "Organic Rice 5kg",
    "price": 350,
    "store_id": 1,
    "is_available": true,
    "created_at": "2026-04-15T10:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PUT `/api/v1/vendor/products/:id`

Update a product.

**Auth:** Required (Vendor)

**Request Body:** (All fields optional)

```json
{
  "name": "Organic Rice 10kg",
  "price": 650,
  "discountPercentage": 15
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product updated",
  "data": { ... },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### DELETE `/api/v1/vendor/products/:id`

Delete a product.

**Auth:** Required (Vendor)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product deleted",
  "data": null,
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/vendor/products/:id/images`

Add an image to a product.

**Auth:** Required (Vendor)

**Request Body:**

```json
{
  "imageUrl": "https://dailyboxapp.com/uploads/products/rice2.jpg",
  "isPrimary": false
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Image added",
  "data": {
    "id": 5,
    "product_id": 10,
    "image_url": "https://dailyboxapp.com/uploads/products/rice2.jpg",
    "is_primary": false
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Vendor Orders

#### GET `/api/v1/vendor/orders`

Get orders for the vendor's stores.

**Auth:** Required (Vendor)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter by order status |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 100,
      "order_number": "ORD-1713178800000-123",
      "customer_name": "John Doe",
      "total_amount": 538.2,
      "status": "pending",
      "created_at": "2026-04-15T10:00:00.000Z"
    }
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### GET `/api/v1/vendor/orders/:id`

Get order details.

**Auth:** Required (Vendor)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 100,
    "order_number": "ORD-1713178800000-123",
    "customer_name": "John Doe",
    "total_amount": 538.2,
    "status": "pending",
    "items": [
      {
        "product_id": 5,
        "product_name": "Organic Rice 5kg",
        "quantity": 2,
        "price": 269.1
      }
    ]
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PATCH `/api/v1/vendor/orders/:id/accept`

Accept an order.

**Auth:** Required (Vendor)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order accepted",
  "data": {
    "id": 100,
    "status": "confirmed"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PATCH `/api/v1/vendor/orders/:id/status`

Update order status.

**Auth:** Required (Vendor)

**Request Body:**

```json
{
  "status": "preparing"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order status updated",
  "data": {
    "id": 100,
    "status": "preparing"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Vendor Dashboard

#### GET `/api/v1/vendor/dashboard`

Get vendor dashboard metrics.

**Auth:** Required (Vendor)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "totalOrders": 500,
    "totalRevenue": 175000,
    "pendingOrders": 5,
    "avgRating": 4.5,
    "recentOrders": [...]
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Vendor Reviews

#### GET `/api/v1/vendor/reviews`

Get reviews for vendor's products/stores.

**Auth:** Required (Vendor)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "rating": 4,
      "comment": "Great quality!",
      "user_name": "John Doe",
      "product_name": "Organic Rice 5kg",
      "created_at": "2026-04-10T10:00:00.000Z",
      "reply": null
    }
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/vendor/reviews/:id/reply`

Reply to a review.

**Auth:** Required (Vendor)

**Request Body:**

```json
{
  "reply": "Thank you for your kind feedback!"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Reply added",
  "data": {
    "id": 1,
    "reply": "Thank you for your kind feedback!",
    "replied_at": "2026-04-15T10:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Vendor Upload

#### POST `/api/v1/vendor/upload-image`

Upload an image (vendor-specific).

**Auth:** Required (Vendor)

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | Yes | Image file (jpg, jpeg, png, webp, max 5MB) |

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Image uploaded successfully",
  "data": {
    "image_url": "https://dailyboxapp.com/uploads/img_1713178800_abc123.jpg"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 11. Delivery

### Delivery Authentication

#### POST `/api/v1/delivery/auth/send-otp`

Send OTP to delivery partner mobile number.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543211"
}
```

**Response (200):** Same as [Auth Send OTP](#post-apiv1authsend-otp)

---

#### POST `/api/v1/delivery/auth/verify-otp`

Verify OTP and login as delivery partner.

**Auth:** None

**Request Body:**

```json
{
  "mobileNumber": "9876543211",
  "otpCode": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "mobileNumber": "9876543211",
      "role": "delivery"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### Delivery Operations

> All delivery operations require **authentication + delivery role**.

#### GET `/api/v1/delivery/orders`

Get assigned orders for the delivery partner.

**Auth:** Required (Delivery)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": 100,
      "order_id": 100,
      "order_number": "ORD-1713178800000-123",
      "status": "picked_up",
      "customer_name": "John Doe",
      "customer_phone": "9876543210",
      "delivery_address": "123, Main Street, Hyderabad",
      "store_name": "Spice Garden",
      "store_address": "456, Food Street",
      "total_amount": 538.2,
      "assigned_at": "2026-04-15T10:00:00.000Z"
    }
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PATCH `/api/v1/delivery/orders/:id/status`

Update delivery status for an order.

**Auth:** Required (Delivery)

**Request Body:**

```json
{
  "status": "picked_up"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Status updated",
  "data": {
    "id": 1,
    "order_id": 100,
    "status": "picked_up"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### POST `/api/v1/delivery/location`

Update delivery partner's current location.

**Auth:** Required (Delivery)

**Request Body:**

```json
{
  "latitude": 17.385,
  "longitude": 78.487
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Location updated",
  "data": {
    "latitude": 17.385,
    "longitude": 78.487,
    "updated_at": "2026-04-15T10:00:00.000Z"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### PATCH `/api/v1/delivery/availability`

Toggle delivery partner availability.

**Auth:** Required (Delivery)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Availability toggled",
  "data": {
    "is_available": true
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

#### GET `/api/v1/delivery/earnings`

Get delivery partner earnings.

**Auth:** Required (Delivery)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "totalEarnings": 15000,
    "todayEarnings": 800,
    "weeklyEarnings": 5000,
    "totalDeliveries": 150,
    "todayDeliveries": 5
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 12. Public

> No authentication required for any public endpoint.

### GET `/api/v1/public/cities`

Get list of active cities (derived from vendor stores).

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    "Hyderabad",
    "Bangalore",
    "Mumbai",
    "Delhi"
  ],
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/public/cities/:city/stores`

Get stores in a specific city.

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `city` | string | City name |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "stores": [
      {
        "id": 1,
        "name": "Spice Garden",
        "store_type": "restaurant",
        "description": "Authentic Indian cuisine",
        "rating": 4.5,
        "logo_url": "https://dailyboxapp.com/uploads/store/logo.jpg",
        "city": "Hyderabad"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/public/stores/:id`

Get store detail by ID.

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Spice Garden",
    "store_type": "restaurant",
    "description": "Authentic Indian cuisine",
    "rating": 4.5,
    "delivery_time": "30-45 min",
    "delivery_charge": 30,
    "logo_url": "https://dailyboxapp.com/uploads/store/logo.jpg",
    "banner_url": "https://dailyboxapp.com/uploads/store/banner.jpg",
    "latitude": 17.385,
    "longitude": 78.487,
    "is_active": true,
    "city": "Hyderabad"
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

### GET `/api/v1/public/orders/:id/track`

Track an order by ID.

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": 100,
    "status": "out_for_delivery",
    "total_amount": 538.2,
    "delivery_address": "123, Main Street, Hyderabad",
    "created_at": "2026-04-15T10:00:00.000Z",
    "updated_at": "2026-04-15T10:30:00.000Z",
    "delivery_status": "picked_up",
    "current_latitude": 17.386,
    "current_longitude": 78.488
  },
  "timestamp": "2026-04-15T10:00:00.000Z"
}
```

---

## 13. Health Check

### GET `/health`

Check if the server is running.

**Auth:** None

**Response (200):**

```json
{
  "status": "ok",
  "message": "DailyBox Backend is running",
  "timestamp": "2026-04-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Endpoint Summary

| Module | Method | Count |
|--------|--------|-------|
| Auth | POST, PUT | 5 |
| Users | GET, PUT, POST | 4 |
| Restaurants | GET, POST | 5 |
| Menu | GET | 5 |
| Cart | GET, POST, PUT, DELETE | 5 |
| Orders | GET, POST, PUT | 4 |
| Upload | POST | 2 |
| Admin | GET, POST, PUT, PATCH, DELETE | 18 |
| Customer | GET, POST, PUT, DELETE | 24 |
| Vendor | GET, POST, PUT, PATCH, DELETE | 17 |
| Delivery | GET, POST, PATCH | 5 |
| Public | GET | 4 |
| Health | GET | 1 |
| **Total** | | **~99** |
