# Getting Started with DailyBox Backend

Quick start guide to set up and run the DailyBox backend API.

## 5-Minute Setup

### 1. Install Node.js
Download from https://nodejs.org (v18 or higher)

### 2. Install PostgreSQL
- **Windows**: https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql`

### 3. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# In psql shell
CREATE DATABASE dailybox;
\q
```

### 4. Setup Backend
```bash
cd DailyBox_Backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your database password
# Set: DB_PASSWORD=your_password

# Start server
npm run dev
```

Server runs on **http://localhost:5000**

## First API Call

### 1. Send OTP
```bash
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9999999999"}'
```

You'll get an OTP in the response (development only).

### 2. Verify OTP
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9999999999","otpCode":"123456"}'
```

Save the `token` from response.

### 3. Use Token
```bash
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer {token}"
```

## Project Structure Overview

```
src/
├── server.js              ← Main entry point
├── config/
│   └── database.js        ← Database setup
├── db/
│   └── init.js            ← Create tables
├── controllers/           ← Request handlers
├── services/              ← Business logic
├── models/                ← Database queries
├── routes/                ← API endpoints
├── middleware/            ← Auth, errors
└── utils/                 ← Helpers
```

## Environment Variables

Edit `.env` file:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dailybox
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=7d

# OTP
OTP_EXPIRATION=5
OTP_LENGTH=6
```

## Development Commands

```bash
# Start with auto-reload
npm run dev

# Production start
npm start

# Seed sample data (coming soon)
npm run seed
```

## Common Errors

| Problem | Solution |
|---------|----------|
| `connect ECONNREFUSED` | PostgreSQL not running |
| `database "dailybox" does not exist` | Run `CREATE DATABASE dailybox;` |
| `EADDRINUSE :::5000` | Port 5000 already in use |
| `Authentication failed` | Check JWT token format |

## Testing Endpoints

Use **Postman** or **Insomnia**:

1. Open Postman
2. Create new request
3. Select POST method
4. Enter URL: `http://localhost:5000/api/v1/auth/send-otp`
5. Go to Body → raw → JSON
6. Enter: `{"mobileNumber":"9999999999"}`
7. Click Send

## Database Inspection

```bash
# Connect to database
psql -U postgres -d dailybox

# List tables
\dt

# View users table
SELECT * FROM users;

# Exit
\q
```

## Logs

Check logs in `logs/` directory:
- `info.log` - General info
- `error.log` - Errors
- `access.log` - HTTP requests

## Next Steps

1. ✅ Backend running locally
2. 📱 Set up DailyBox_CustomerApp (Android)
3. 🔗 Connect app to backend
4. 🧪 Test authentication flow
5. 🚀 Deploy to production

## Additional Resources

- [API Reference](./API_REFERENCE.md)
- [README](./README.md)
- [Express.js Docs](https://expressjs.com)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Support

Need help? Check:
1. Logs in `logs/` directory
2. Console output
3. API_REFERENCE.md for endpoint details
4. README.md for detailed info

---

Happy coding! 🎉
