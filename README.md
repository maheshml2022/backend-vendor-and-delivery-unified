# DailyBox Backend API

**A scalable Node.js/Express API for a food delivery platform with OTP authentication, JWT tokens, and PostgreSQL database.**

## Overview

DailyBox Backend is a REST API service that powers the DailyBox food delivery platform. It handles user authentication with OTP, restaurant management, menu browsing, cart operations, and order management.

### Key Features

- ✅ OTP-based user authentication
- ✅ JWT token-based authorization
- ✅ Password-based login after initial verification
- ✅ Restaurant discovery and search
- ✅ Menu item browsing and categorization
- ✅ Shopping cart management
- ✅ Order placement and tracking
- ✅ Location-based restaurant search
- ✅ Request validation and error handling
- ✅ Production-ready code with comprehensive logging

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 12+
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Security**: 
  - bcryptjs for password hashing
  - helmet for secure headers
  - cors for cross-origin requests
- **Logging**: Custom logger with file output
- **Development**: nodemon for auto-restart

## Project Structure

```
DailyBox_Backend/
├── src/
│   ├── config/
│   │   └── database.js              # Database connection and queries
│   ├── controllers/
│   │   ├── authController.js        # Authentication endpoints
│   │   ├── userController.js        # User profile endpoints
│   │   ├── restaurantController.js  # Restaurant endpoints
│   │   ├── menuController.js        # Menu endpoints
│   │   ├── cartController.js        # Cart endpoints
│   │   └── orderController.js       # Order endpoints
│   ├── db/
│   │   ├── init.js                  # Database initialization
│   │   └── seed.js                  # Sample data seeding
│   ├── middleware/
│   │   ├── authentication.js        # JWT verification
│   │   └── errorHandler.js          # Error handling
│   ├── models/
│   │   ├── userRepository.js        # User database queries
│   │   ├── otpRepository.js         # OTP database queries
│   │   ├── restaurantRepository.js  # Restaurant queries
│   │   └── menuRepository.js        # Menu queries
│   ├── routes/
│   │   ├── auth.routes.js           # Authentication routes
│   │   ├── user.routes.js           # User routes
│   │   ├── restaurant.routes.js     # Restaurant routes
│   │   ├── menu.routes.js           # Menu routes
│   │   ├── cart.routes.js           # Cart routes
│   │   └── order.routes.js          # Order routes
│   ├── services/
│   │   ├── authService.js           # Authentication business logic
│   │   ├── userService.js           # User business logic
│   │   ├── restaurantService.js     # Restaurant business logic
│   │   ├── menuService.js           # Menu business logic
│   │   ├── cartService.js           # Cart business logic
│   │   └── orderService.js          # Order business logic
│   ├── utils/
│   │   ├── jwt.js                   # JWT utilities
│   │   ├── otp.js                   # OTP utilities
│   │   ├── logger.js                # Logging utility
│   │   └── response.js              # Response formatting
│   ├── validators/
│   │   └── index.js                 # Input validation schemas
│   └── server.js                    # Main entry point
├── logs/                            # Application logs
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies
└── README.md                        # This file
```

## Installation

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn package manager

### Steps

1. **Clone the repository**
   ```bash
   cd DailyBox_Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   API_VERSION=v1
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=dailybox
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRATION=7d
   
   OTP_EXPIRATION=5
   OTP_LENGTH=6
   ```

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE dailybox;
   ```

5. **Start the server**
   ```bash
   # Development (with auto-restart)
   npm run dev
   
   # Production
   npm start
   ```

The server will start on http://localhost:5000

## Database Setup

The database tables are automatically created when the server starts. The following tables are created:

- `users` - User accounts and profiles
- `otps` - OTP verification records
- `addresses` - Delivery addresses
- `restaurants` - Restaurant information
- `menu_items` - Menu items with pricing
- `cart` - User shopping carts
- `orders` - Order records
- `order_items` - Items within orders

## API Documentation

### Authentication Endpoints

#### Send OTP
```
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}

Response: 200 OK
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresAt": "2024-01-15T10:30:00Z",
    "debug_otp": "123456"  // Only in development
  }
}
```

#### Verify OTP
```
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "otpCode": "123456"
}

Response: 200 OK
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "id": 1,
      "mobileNumber": "9876543210",
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Register
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {...},
    "token": "..."
  }
}
```

#### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "password": "SecurePass123"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "token": "..."
  }
}
```

### User Endpoints

#### Get Profile
```
GET /api/v1/users/profile
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": 1,
    "mobileNumber": "9876543210",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

#### Update Profile
```
PUT /api/v1/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John Updated",
  "email": "newemail@example.com",
  "profileImageUrl": "https://..."
}
```

### Restaurant Endpoints

#### Get All Restaurants
```
GET /api/v1/restaurants?page=1&limit=20

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Pizza Palace",
      "cuisineType": "Italian",
      "rating": 4.5,
      "deliveryTime": 30,
      "deliveryCharge": 2.99
    }
  ],
  "pagination": { "total": 50, "page": 1, "limit": 20, "pages": 3 }
}
```

#### Search Restaurants
```
GET /api/v1/restaurants/search?query=pizza&page=1&limit=10
```

#### Get Nearby Restaurants
```
GET /api/v1/restaurants/nearby?latitude=28.7041&longitude=77.1025&radius=5&limit=20
```

#### Get Restaurant Details
```
GET /api/v1/restaurants/:restaurantId
```

### Menu Endpoints

#### Get Restaurant Menu
```
GET /api/v1/menu/restaurant/:restaurantId?page=1&limit=50
```

#### Get Menu Categories
```
GET /api/v1/menu/restaurant/:restaurantId/categories
```

#### Get Menu by Category
```
GET /api/v1/menu/restaurant/:restaurantId/category/Appetizers?page=1&limit=20
```

#### Search Menu Items
```
GET /api/v1/menu/restaurant/:restaurantId/search?query=pasta&page=1&limit=20
```

#### Get Menu Item Details
```
GET /api/v1/menu/:menuItemId
```

### Cart Endpoints

#### Add to Cart
```
POST /api/v1/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "restaurantId": 1,
  "menuItemId": 10,
  "quantity": 2,
  "specialInstructions": "Extra cheese"
}

Response: 201 Created
```

#### Get Cart
```
GET /api/v1/cart
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "name": "Margherita Pizza",
        "price": 12.99,
        "discount_percentage": 10,
        "discounted_price": 11.69
      }
    ],
    "totals": {
      "subtotal": 23.38,
      "restaurantCount": 1
    }
  }
}
```

#### Update Cart Item
```
PUT /api/v1/cart/{cartId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove from Cart
```
DELETE /api/v1/cart/{cartId}
Authorization: Bearer {token}
```

#### Clear Cart
```
DELETE /api/v1/cart
Authorization: Bearer {token}
```

### Order Endpoints

#### Place Order
```
POST /api/v1/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "restaurantId": 1,
  "deliveryAddressId": 1,
  "paymentMethod": "CARD",
  "specialInstructions": "Ring doorbell twice"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "orderId": 1,
    "orderNumber": "ORD-1705056000000-123",
    "totalAmount": 25.99,
    "finalAmount": 28.98,
    "status": "pending"
  }
}
```

#### Get User Orders
```
GET /api/v1/orders?page=1&limit=20
Authorization: Bearer {token}
```

#### Get Order Details
```
GET /api/v1/orders/:orderId
Authorization: Bearer {token}
```

#### Update Order Status (Admin)
```
PUT /api/v1/orders/:orderId/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Valid Statuses**: pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "error": {},
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## Environment Variables

See `.env.example` for all available options:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `PORT` | 5000 | Server port |
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | dailybox | Database name |
| `DB_USER` | postgres | Database user |
| `JWT_SECRET` | secret_key | JWT signing secret |
| `JWT_EXPIRATION` | 7d | Token expiration time |
| `OTP_EXPIRATION` | 5 | OTP validity in minutes |
| `OTP_LENGTH` | 6 | OTP length in digits |

## Security Best Practices

1. **Environment Variables**: Store sensitive data in `.env` files (never commit to git)
2. **Password Hashing**: All passwords are hashed using bcryptjs
3. **JWT Tokens**: Secure token-based authentication
4. **Input Validation**: All inputs validated with Joi
5. **CORS**: Configured for cross-origin requests
6. **Helmet**: Additional security headers added
7. **Rate Limiting**: Recommended to add in production

## Development

### Running in Development Mode
```bash
npm run dev
```

Watches for changes and auto-restarts the server.

### Logging
Logs are written to:
- Console (for development)
- `logs/info.log` (info level)
- `logs/error.log` (error level)
- `logs/access.log` (HTTP access logs)

### API Testing

Use tools like Postman or cURL to test endpoints:

```bash
# Test send OTP
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Setup PostgreSQL on production server
- [ ] Configure environment variables
- [ ] Enable HTTPS/SSL
- [ ] Setup rate limiting
- [ ] Enable request logging
- [ ] Setup monitoring and alerts
- [ ] Backup database regularly
- [ ] Use reverse proxy (Nginx)

### Deployment Platforms

- Heroku
- AWS EC2
- DigitalOcean
- Railway.app
- Render

## Scalability Considerations

The backend is designed to support:

1. **Multiple Applications**
   - Customer App (current)
   - Vendor/Restaurant App (future)
   - Delivery Partner App (future)

2. **High Traffic**
   - Connection pooling for database
   - Stateless API design
   - Ready for load balancing

3. **Future Enhancements**
   - Admin Dashboard APIs
   - Real-time order tracking with WebSockets
   - Payment integration
   - Analytics and reporting
   - Notification system (SMS/Email)

## Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running
- Verify DB credentials in `.env`
- Check database exists: `psql -l`

### Port Already in Use
```bash
# Change PORT in .env or
lsof -i :5000  # Find process
kill -9 <PID>  # Kill process
```

### OTP Not Received
- Check logs in `logs/` directory
- Verify phone number format
- In development, check `debug_otp` in response

### JWT Token Expired
- User needs to login again and get a new token
- Token expiration is set by `JWT_EXPIRATION`

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Create Pull Request

## License

ISC

## Support

For issues and support, contact: support@dailybox.com

---

**Made with ❤️ by DailyBox Team**
