# API Reference Guide

Complete API endpoint documentation for DailyBox Backend.

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer {token}
```

## Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **AUTHENTICATION** | | | |
| POST | `/auth/send-otp` | No | Send OTP to phone |
| POST | `/auth/verify-otp` | No | Verify OTP & login |
| POST | `/auth/register` | No | Register with password |
| POST | `/auth/login` | No | Login with password |
| **USER** | | | |
| GET | `/users/profile` | Yes | Get user profile |
| PUT | `/users/profile` | Yes | Update profile |
| GET | `/users` | Yes | Get all users (admin) |
| **RESTAURANTS** | | | |
| GET | `/restaurants` | No | List all restaurants |
| GET | `/restaurants/:id` | No | Get restaurant details |
| GET | `/restaurants/search` | No | Search restaurants |
| GET | `/restaurants/nearby` | No | Get nearby restaurants |
| **MENU** | | | |
| GET | `/menu/restaurant/:id` | No | Get restaurant menu |
| GET | `/menu/:id` | No | Get menu item details |
| GET | `/menu/restaurant/:id/categories` | No | Get categories |
| GET | `/menu/restaurant/:id/category/:cat` | No | Get items by category |
| GET | `/menu/restaurant/:id/search` | No | Search menu items |
| **CART** | | | |
| POST | `/cart/add` | Yes | Add item to cart |
| GET | `/cart` | Yes | Get cart items |
| PUT | `/cart/:id` | Yes | Update cart item |
| DELETE | `/cart/:id` | Yes | Remove from cart |
| DELETE | `/cart` | Yes | Clear cart |
| **ORDERS** | | | |
| POST | `/orders` | Yes | Place order |
| GET | `/orders` | Yes | Get user orders |
| GET | `/orders/:id` | Yes | Get order details |
| PUT | `/orders/:id/status` | Yes | Update order status |

## Authentication Flow

### 1. Send OTP
```bash
POST /auth/send-otp
{
  "mobileNumber": "9876543210"
}
```

### 2. Verify OTP & Get Token
```bash
POST /auth/verify-otp
{
  "mobileNumber": "9876543210",
  "otpCode": "123456"
}
```

### 3. Use Token in Subsequent Requests
```bash
GET /users/profile
Authorization: Bearer {token_from_step_2}
```

## Request/Response Examples

### Successful Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {...},
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "error": {...},
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Server error |

## Validation Rules

### Phone Number
- Must be exactly 10 digits
- Example: `9876543210`

### OTP
- Must be exactly 6 digits
- Expires after 5 minutes
- Max 3 verification attempts

### Password
- Minimum 6 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Example: `SecurePass123`

### Email (Optional)
- Valid email format
- Example: `user@example.com`

### Pagination
- Default limit: 20
- Max limit: 100
- Page starts at: 1

## Error Messages

| Error | HTTP Code | Description |
|-------|-----------|-------------|
| Mobile number must be 10 digits | 400 | Invalid phone format |
| OTP must be 6 digits | 400 | Invalid OTP format |
| OTP has expired | 400 | OTP validity period passed |
| Invalid OTP | 400 | Wrong OTP code |
| Maximum OTP attempts exceeded | 400 | Too many failed attempts |
| User not found | 404 | User doesn't exist |
| User already registered | 400 | Mobile already registered |
| Invalid password | 400 | Wrong password |
| Missing or invalid authorization header | 401 | No token provided |
| Authentication failed | 401 | Token validation failed |
| Validation error | 400 | Input validation failed |
| Route not found | 404 | Endpoint doesn't exist |

## Search Parameters

### Restaurant Search
```
GET /restaurants/search?query=pizza&page=1&limit=20
```

### Menu Search
```
GET /menu/restaurant/1/search?query=margherita&page=1&limit=20
```

### Location Search
```
GET /restaurants/nearby?latitude=28.7041&longitude=77.1025&radius=5&limit=20
```

## Sample cURL Requests

### Send OTP
```bash
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otpCode":"123456"}'
```

### Get Restaurants
```bash
curl -X GET "http://localhost:5000/api/v1/restaurants?page=1&limit=10"
```

### Add to Cart (with auth)
```bash
curl -X POST http://localhost:5000/api/v1/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "restaurantId":1,
    "menuItemId":10,
    "quantity":2,
    "specialInstructions":"Extra cheese"
  }'
```

### Place Order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "restaurantId":1,
    "deliveryAddressId":1,
    "paymentMethod":"CARD",
    "specialInstructions":"Ring doorbell twice"
  }'
```

## Rate Limiting

Currently no rate limiting implemented. For production, implement rate limiting using:
- express-rate-limit
- redis for distributed rate limiting

## Webhook Events (Future)

Planned webhook events:
- `order.created`
- `order.updated`
- `order.completed`
- `restaurant.added`
- `menu.updated`

## Versioning

Current API Version: **v1**

Future versions will be available at:
- `/api/v2/`
- `/api/v3/`

## Support

For API issues:
- Check status code and error message
- Review request format
- Verify authentication token
- Check server logs

---

Last Updated: January 2024
