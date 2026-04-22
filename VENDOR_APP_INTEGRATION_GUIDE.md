# DailyBox Vendor App — Android Integration Guide

> **Version**: 2.0 | **Last Updated**: April 2026  
> **Backend**: DailyBox Unified Backend | **API Version**: v1

---

## Table of Contents

1. [Overview](#1-overview)
2. [Setup & Configuration](#2-setup--configuration)
3. [Authentication Flow](#3-authentication-flow)
4. [API Endpoints Reference](#4-api-endpoints-reference)
5. [Vendor Profile](#5-vendor-profile)
6. [Store Management](#6-store-management)
7. [Product / Menu Management](#7-product--menu-management)
8. [Order Management](#8-order-management)
9. [Dashboard & Analytics](#9-dashboard--analytics)
10. [Reviews Management](#10-reviews-management)
11. [Image Uploads](#11-image-uploads)
12. [Error Handling](#12-error-handling)
13. [Recommended Architecture](#13-recommended-architecture)
14. [Data Models (Kotlin)](#14-data-models-kotlin)

---

## 1. Overview

The **Vendor App** allows store owners to:

- Register and manage their vendor account
- Create and manage one or more stores
- Add, edit, and delete products/menu items
- Receive and process incoming orders
- View dashboard analytics (revenue, ratings, order stats)
- Respond to customer reviews
- Upload product and store images

### Tech Stack (Recommended)

| Layer | Technology |
|-------|-----------|
| Language | Kotlin |
| UI | Jetpack Compose + Material Design 3 |
| Architecture | MVVM + Clean Architecture |
| Networking | Retrofit 2 + OkHttp |
| DI | Hilt |
| Local Storage | Room + DataStore |
| Image Loading | Coil |
| Notifications | Firebase Cloud Messaging |

---

## 2. Setup & Configuration

### Base URL

```
Production : https://api.dailyboxapp.com/api/v1
Development: http://<YOUR_SERVER_IP>:5000/api/v1
```

### Retrofit Setup

```kotlin
object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:5000/api/v1/"

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor())
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    val api: VendorApiService = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(VendorApiService::class.java)
}
```

### Auth Interceptor

```kotlin
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = TokenManager.getToken()
        val request = chain.request().newBuilder()
        if (token != null) {
            request.addHeader("Authorization", "Bearer $token")
        }
        return chain.proceed(request.build())
    }
}
```

### Token Manager

```kotlin
object TokenManager {
    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        prefs = EncryptedSharedPreferences.create(
            "vendor_secure_prefs",
            MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC),
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun saveToken(token: String) = prefs.edit().putString("jwt_token", token).apply()
    fun getToken(): String? = prefs.getString("jwt_token", null)
    fun clearToken() = prefs.edit().remove("jwt_token").apply()
}
```

### Required Dependencies (build.gradle)

```groovy
dependencies {
    // Networking
    implementation "com.squareup.retrofit2:retrofit:2.9.0"
    implementation "com.squareup.retrofit2:converter-gson:2.9.0"
    implementation "com.squareup.okhttp3:logging-interceptor:4.12.0"

    // DI
    implementation "com.google.dagger:hilt-android:2.50"
    kapt "com.google.dagger:hilt-compiler:2.50"

    // Jetpack Compose
    implementation platform("androidx.compose:compose-bom:2024.02.00")
    implementation "androidx.compose.material3:material3"
    implementation "androidx.navigation:navigation-compose:2.7.7"

    // Room
    implementation "androidx.room:room-runtime:2.6.1"
    implementation "androidx.room:room-ktx:2.6.1"
    kapt "androidx.room:room-compiler:2.6.1"

    // Security
    implementation "androidx.security:security-crypto:1.1.0-alpha06"

    // Image Loading
    implementation "io.coil-kt:coil-compose:2.5.0"

    // Charts (for dashboard)
    implementation "com.github.PhilJay:MPAndroidChart:v3.1.0"
}
```

---

## 3. Authentication Flow

### Vendor Registration Flow

```
┌────────────────┐     ┌───────────────┐     ┌───────────────┐
│  Welcome Screen│────▶│  Enter Mobile  │────▶│  Enter OTP    │
└────────────────┘     │  + Business    │     └───────────────┘
                       │    Details     │            │
                       └───────────────┘            ▼
                                              ┌───────────────┐
          ┌───────────────┐                   │  Registration  │
          │  Dashboard    │◀──────────────────│  Complete      │
          │  (pending     │                   │  (Token saved) │
          │   approval)   │                   └───────────────┘
          └───────────────┘
```

### Vendor Login Flow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Splash      │────▶│  Check Token │────▶│  Dashboard    │ (valid)
└─────────────┘     └──────────────┘     └───────────────┘
                          │ (no token)
                          ▼
                    ┌──────────────┐
                    │  Login       │
                    │  (OTP or     │
                    │   Password)  │
                    └──────────────┘
```

### Vendor Auth API Calls

#### Register New Vendor

```
POST /vendor/auth/register
Content-Type: application/json

{
  "fullName": "Rajesh Sharma",
  "mobileNumber": "9876543210",
  "email": "rajesh@pizzapalace.com",
  "password": "SecurePass123",
  "businessName": "Pizza Palace",
  "businessType": "food",
  "city": "Delhi"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "vendor": {
      "userId": 45,
      "vendorName": "Rajesh Sharma",
      "businessName": "Pizza Palace",
      "mobileNumber": "9876543210",
      "role": "vendor"
    }
  }
}
```

#### Send OTP

```
POST /vendor/auth/send-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}
```

#### Verify OTP

```
POST /vendor/auth/verify-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "otpCode": "123456"
}
```

**Response**: Same as registration (returns token + vendor info).

#### Password Login

```
POST /vendor/auth/login
Content-Type: application/json

{
  "username": "9876543210",
  "password": "SecurePass123"
}
```

#### Forgot Password

```
POST /vendor/auth/forgot-password
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}
```

#### Reset Password

```
POST /vendor/auth/reset-password
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "otpCode": "123456",
  "newPassword": "NewSecurePass123"
}
```

> **Important**: After authentication, store the JWT token securely. All subsequent vendor API calls require the `Authorization: Bearer <token>` header.

---

## 4. API Endpoints Reference

### Auth (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/vendor/auth/send-otp` | Send OTP |
| POST | `/vendor/auth/verify-otp` | Verify OTP & login |
| POST | `/vendor/auth/register` | Register vendor |
| POST | `/vendor/auth/login` | Password login |
| POST | `/vendor/auth/forgot-password` | Request password reset |
| POST | `/vendor/auth/reset-password` | Reset with OTP |

### Profile (Auth + `vendor` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/profile` | Get vendor profile |
| PUT | `/vendor/profile` | Update vendor profile |

### Store Management (Auth + `vendor` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/stores` | List vendor's stores |
| POST | `/vendor/stores` | Create new store |
| PUT | `/vendor/stores/:id` | Update store |
| PATCH | `/vendor/stores/:id/status` | Toggle store open/close |

### Product Management (Auth + `vendor` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/products` | List vendor's products |
| POST | `/vendor/products` | Create product |
| PUT | `/vendor/products/:id` | Update product |
| DELETE | `/vendor/products/:id` | Delete product |
| POST | `/vendor/products/:id/images` | Upload product images |

### Order Management (Auth + `vendor` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/orders` | Get incoming orders |
| GET | `/vendor/orders/:id` | Get order details |
| PATCH | `/vendor/orders/:id/accept` | Accept order |
| PATCH | `/vendor/orders/:id/status` | Update order status |

### Dashboard (Auth + `vendor` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/dashboard` | Get dashboard stats |

### Reviews (Auth + `vendor` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vendor/reviews` | Get product reviews |
| POST | `/vendor/reviews/:id/reply` | Reply to a review |

### Uploads (Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/vendor/upload-image` | Upload image |
| POST | `/api/upload` | Upload single image |
| POST | `/api/upload/multiple` | Upload multiple images (max 5) |

---

## 5. Vendor Profile

### Get Profile

```
GET /vendor/profile
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": 45,
    "fullName": "Rajesh Sharma",
    "email": "rajesh@pizzapalace.com",
    "mobileNumber": "9876543210",
    "businessName": "Pizza Palace",
    "businessType": "food",
    "city": "Delhi",
    "gstNumber": "07AABCU1234H1Z0",
    "panNumber": "AAAAA1234A",
    "bankAccountNumber": "1234567890",
    "ifscCode": "HDFC0000123",
    "openingTime": "10:00",
    "closingTime": "23:00",
    "isVerified": true
  }
}
```

### Update Profile

```
PUT /vendor/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Rajesh Sharma Updated",
  "email": "rajesh.updated@pizzapalace.com",
  "businessName": "Pizza Palace Premium",
  "gstNumber": "07AABCU1234H1Z0",
  "panNumber": "AAAAA1234A",
  "bankAccountNumber": "9876543210",
  "ifscCode": "HDFC0000456",
  "openingTime": "09:00",
  "closingTime": "23:30"
}
```

---

## 6. Store Management

### List My Stores

```
GET /vendor/stores
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 234,
      "name": "Pizza Palace Downtown",
      "storeType": "food",
      "description": "Best pizzas in Delhi",
      "logoUrl": "https://...",
      "bannerUrl": "https://...",
      "rating": 4.5,
      "deliveryTime": 30,
      "deliveryCharge": 50.00,
      "latitude": 28.6139,
      "longitude": 77.2090,
      "isActive": true,
      "approvalStatus": "approved",
      "city": "Delhi",
      "openingTime": "10:00",
      "closingTime": "23:00",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Store Approval Status

| Status | Meaning | What Vendor Sees |
|--------|---------|------------------|
| `pending` | Awaiting admin review | "Under Review" banner |
| `approved` | Active and visible | Normal operations |
| `rejected` | Denied by admin | "Rejected" with reason |

### Create New Store

```
POST /vendor/stores
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Pizza Palace South Delhi",
  "storeType": "food",
  "description": "Authentic Italian pizzas and pastas",
  "logoUrl": "https://...",
  "bannerUrl": "https://...",
  "deliveryTime": 35,
  "deliveryCharge": 45.00,
  "latitude": 28.5500,
  "longitude": 77.2100
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": 235,
    "name": "Pizza Palace South Delhi",
    "vendorId": 45,
    "isActive": true,
    "approvalStatus": "pending",
    "createdAt": "2024-04-16T10:00:00Z"
  }
}
```

### Update Store

```
PUT /vendor/stores/234
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Pizza Palace Downtown (Updated)",
  "deliveryTime": 25,
  "deliveryCharge": 40.00,
  "description": "Updated description"
}
```

### Toggle Store Open/Close

```
PATCH /vendor/stores/234/status
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 234,
    "isActive": false,
    "updatedAt": "2024-04-16T11:00:00Z"
  }
}
```

---

## 7. Product / Menu Management

### List Products

```
GET /vendor/products
GET /vendor/products?store_id=234
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 501,
      "storeId": 234,
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato and mozzarella",
      "category": "Pizza",
      "price": 299.00,
      "originalPrice": 399.00,
      "discountPercentage": 25,
      "imageUrl": "https://...",
      "isVegetarian": true,
      "isAvailable": true,
      "stockQuantity": 50,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Product

```
POST /vendor/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "storeId": 234,
  "name": "Pepperoni Pizza",
  "description": "Loaded with pepperoni and cheese",
  "category": "Pizza",
  "price": 349.00,
  "originalPrice": 449.00,
  "imageUrl": "https://...",
  "isVegetarian": false,
  "discountPercentage": 22,
  "stockQuantity": 100
}
```

### Update Product

```
PUT /vendor/products/501
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Margherita Pizza (Large)",
  "price": 349.00,
  "isAvailable": true,
  "stockQuantity": 75
}
```

### Delete Product

```
DELETE /vendor/products/501
Authorization: Bearer <token>
```

### Upload Product Images

```
POST /vendor/products/501/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
  images: <file[]> (JPG/PNG, max 5MB each, max 5 files)
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "imageUrl": "https://api.dailyboxapp.com/uploads/product/img_1.jpg",
      "isPrimary": true
    },
    {
      "imageUrl": "https://api.dailyboxapp.com/uploads/product/img_2.jpg",
      "isPrimary": false
    }
  ]
}
```

---

## 8. Order Management

### Get Incoming Orders

```
GET /vendor/orders
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "orderNumber": "ORD-2024-04-16-001",
      "customerName": "John Doe",
      "customerPhone": "9876543210",
      "storeId": 234,
      "storeName": "Pizza Palace Downtown",
      "items": [
        {
          "name": "Margherita Pizza",
          "quantity": 2,
          "price": 299.00
        }
      ],
      "totalAmount": 733.48,
      "status": "pending",
      "paymentMethod": "UPI",
      "deliveryAddress": "123 Main Street, Delhi",
      "specialInstructions": "Extra cheese",
      "createdAt": "2024-04-16T10:30:00Z"
    }
  ]
}
```

### Get Order Details

```
GET /vendor/orders/1001
Authorization: Bearer <token>
```

### Accept Order

```
PATCH /vendor/orders/1001/accept
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "status": "accepted",
    "updatedAt": "2024-04-16T10:35:00Z"
  }
}
```

### Update Order Status

```
PATCH /vendor/orders/1001/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```

### Vendor Order Status Flow

```
pending → accepted → preparing → ready → (handed to delivery)

OR

pending → rejected (with reason)
```

| Status | Meaning | Vendor Action |
|--------|---------|---------------|
| `pending` | New order received | Accept or Reject |
| `accepted` | Order accepted | Start preparing |
| `preparing` | Being cooked/packed | Update when done |
| `ready` | Ready for pickup | Wait for delivery partner |
| `rejected` | Order declined | Provide reason |

> **Real-time Updates**: Consider polling `GET /vendor/orders` every 30 seconds or implement WebSocket/FCM push notifications for new order alerts.

---

## 9. Dashboard & Analytics

### Get Dashboard

```
GET /vendor/dashboard
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalOrders": 234,
    "totalRevenue": 45670.00,
    "activeOrders": 5,
    "averageRating": 4.6,
    "totalReviews": 128,
    "topRatedProduct": "Margherita Pizza",
    "orderStats": {
      "pending": 3,
      "preparing": 2,
      "ready": 0,
      "completed": 229
    }
  }
}
```

### Dashboard Screen Sections

| Section | Data Source | Display |
|---------|-----------|---------|
| Active Orders | `orderStats.pending + preparing + ready` | Badge count |
| Today's Revenue | `totalRevenue` | Currency format |
| Rating | `averageRating` | Star rating (out of 5) |
| Total Orders | `totalOrders` | Count |
| New Orders Alert | `orderStats.pending` | Notification dot |

---

## 10. Reviews Management

### Get Product Reviews

```
GET /vendor/reviews
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 78,
      "productId": 501,
      "productName": "Margherita Pizza",
      "customerName": "John Doe",
      "rating": 4,
      "comment": "Great taste, slightly slow delivery",
      "reply": null,
      "createdAt": "2024-04-15T14:30:00Z"
    }
  ]
}
```

### Reply to Review

```
POST /vendor/reviews/78/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "reply": "Thank you for your feedback! We are working on improving our delivery times."
}
```

---

## 11. Image Uploads

### Upload Store Logo/Banner

```
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
  image: <file> (JPG/PNG, max 5MB)
  type: "store"
```

**Response**:
```json
{
  "success": true,
  "imageUrl": "https://api.dailyboxapp.com/uploads/store/logo_12345.jpg"
}
```

### Upload Product Images

```
POST /api/upload/multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
  images: <file[]> (max 5 files, each max 5MB)
  type: "product"
```

### Kotlin Upload Helper

```kotlin
suspend fun uploadStoreImage(file: File): String {
    val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
    val body = MultipartBody.Part.createFormData("image", file.name, requestFile)
    val type = "store".toRequestBody("text/plain".toMediaTypeOrNull())

    val response = api.uploadImage(body, type)
    return response.imageUrl
}
```

---

## 12. Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "ErrorType",
  "statusCode": 400
}
```

### HTTP Status Codes

| Code | Meaning | Vendor App Action |
|------|---------|-------------------|
| 200 | Success | Parse data |
| 201 | Created | Show success toast |
| 400 | Bad Request | Show field validation errors |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show "Vendor access only" |
| 404 | Not Found | Show "Not found" |
| 409 | Conflict | Show duplicate error |
| 500 | Server Error | Show retry dialog |

### Kotlin Error Handling

```kotlin
sealed class Resource<T> {
    class Loading<T> : Resource<T>()
    data class Success<T>(val data: T) : Resource<T>()
    data class Error<T>(val message: String, val code: Int = 0) : Resource<T>()
}

suspend fun <T> safeApiCall(apiCall: suspend () -> Response<T>): Resource<T> {
    return try {
        val response = apiCall()
        if (response.isSuccessful) {
            Resource.Success(response.body()!!)
        } else {
            when (response.code()) {
                401 -> {
                    TokenManager.clearToken()
                    Resource.Error("Session expired. Please login again.", 401)
                }
                403 -> Resource.Error("Vendor access required.", 403)
                else -> {
                    val errorBody = response.errorBody()?.string()
                    val message = parseErrorMessage(errorBody) ?: "Something went wrong"
                    Resource.Error(message, response.code())
                }
            }
        }
    } catch (e: IOException) {
        Resource.Error("Network error. Check your internet connection.")
    } catch (e: Exception) {
        Resource.Error("Unexpected error: ${e.localizedMessage}")
    }
}
```

---

## 13. Recommended Architecture

### Project Structure

```
com.dailybox.vendor/
├── data/
│   ├── remote/
│   │   ├── VendorApiService.kt    # Retrofit interface
│   │   ├── AuthInterceptor.kt     # JWT injection
│   │   └── dto/                    # DTOs
│   ├── local/
│   │   ├── AppDatabase.kt         # Room (cache orders, products)
│   │   └── dao/
│   └── repository/
│       ├── AuthRepository.kt
│       ├── StoreRepository.kt
│       ├── ProductRepository.kt
│       ├── OrderRepository.kt
│       └── DashboardRepository.kt
├── ui/
│   ├── auth/                       # Login, Register, OTP
│   ├── dashboard/                  # Dashboard home
│   ├── stores/                     # Store list, create/edit
│   ├── products/                   # Product CRUD
│   ├── orders/                     # Order list, detail, status
│   ├── reviews/                    # Review list, reply
│   ├── profile/                    # Vendor profile
│   └── components/                 # Shared composables
├── di/
│   └── AppModule.kt
├── navigation/
│   └── NavGraph.kt
└── util/
    ├── TokenManager.kt
    ├── Resource.kt
    └── Extensions.kt
```

### Screen List

| # | Screen | Key APIs |
|---|--------|----------|
| 1 | Splash | Check token |
| 2 | Login | `POST /vendor/auth/login` or OTP flow |
| 3 | Register | `POST /vendor/auth/register` |
| 4 | Dashboard | `GET /vendor/dashboard` |
| 5 | Store List | `GET /vendor/stores` |
| 6 | Create Store | `POST /vendor/stores` |
| 7 | Edit Store | `PUT /vendor/stores/:id` |
| 8 | Product List | `GET /vendor/products` |
| 9 | Create Product | `POST /vendor/products` |
| 10 | Edit Product | `PUT /vendor/products/:id` |
| 11 | Order List | `GET /vendor/orders` |
| 12 | Order Detail | `GET /vendor/orders/:id` |
| 13 | Order Actions | `PATCH /vendor/orders/:id/accept`, `/status` |
| 14 | Reviews | `GET /vendor/reviews` |
| 15 | Reply to Review | `POST /vendor/reviews/:id/reply` |
| 16 | Vendor Profile | `GET/PUT /vendor/profile` |

---

## 14. Data Models (Kotlin)

### API Response Wrapper

```kotlin
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String?,
    val pagination: Pagination?
)

data class Pagination(
    val total: Int,
    val page: Int,
    val limit: Int,
    val pages: Int
)
```

### Auth Models

```kotlin
data class VendorRegisterRequest(
    val fullName: String,
    val mobileNumber: String,
    val email: String,
    val password: String,
    val businessName: String,
    val businessType: String,       // "food", "grocery", "pharmacy"
    val city: String
)

data class SendOtpRequest(val mobileNumber: String)
data class VerifyOtpRequest(val mobileNumber: String, val otpCode: String)
data class LoginRequest(val username: String, val password: String)
data class ForgotPasswordRequest(val mobileNumber: String)
data class ResetPasswordRequest(
    val mobileNumber: String,
    val otpCode: String,
    val newPassword: String
)

data class VendorAuthResponse(
    val token: String,
    val vendor: VendorUser
)

data class VendorUser(
    val userId: Int,
    val vendorName: String,
    val businessName: String,
    val mobileNumber: String,
    val role: String                // "vendor"
)
```

### Vendor Profile Model

```kotlin
data class VendorProfile(
    val userId: Int,
    val fullName: String,
    val email: String?,
    val mobileNumber: String,
    val businessName: String,
    val businessType: String,
    val city: String?,
    val gstNumber: String?,
    val panNumber: String?,
    val bankAccountNumber: String?,
    val ifscCode: String?,
    val openingTime: String?,
    val closingTime: String?,
    val isVerified: Boolean
)
```

### Store Models

```kotlin
data class VendorStore(
    val id: Int,
    val name: String,
    val storeType: String,
    val description: String?,
    val logoUrl: String?,
    val bannerUrl: String?,
    val rating: Double?,
    val deliveryTime: Int?,
    val deliveryCharge: Double?,
    val latitude: Double?,
    val longitude: Double?,
    val isActive: Boolean,
    val approvalStatus: String,     // "pending", "approved", "rejected"
    val city: String?,
    val openingTime: String?,
    val closingTime: String?,
    val createdAt: String
)

data class CreateStoreRequest(
    val name: String,
    val storeType: String,
    val description: String? = null,
    val logoUrl: String? = null,
    val bannerUrl: String? = null,
    val deliveryTime: Int? = null,
    val deliveryCharge: Double? = null,
    val latitude: Double? = null,
    val longitude: Double? = null
)
```

### Product Models

```kotlin
data class Product(
    val id: Int,
    val storeId: Int,
    val name: String,
    val description: String?,
    val category: String,
    val price: Double,
    val originalPrice: Double?,
    val discountPercentage: Double?,
    val imageUrl: String?,
    val isVegetarian: Boolean,
    val isAvailable: Boolean,
    val stockQuantity: Int?,
    val createdAt: String
)

data class CreateProductRequest(
    val storeId: Int,
    val name: String,
    val description: String? = null,
    val category: String,
    val price: Double,
    val originalPrice: Double? = null,
    val imageUrl: String? = null,
    val isVegetarian: Boolean = false,
    val discountPercentage: Double? = null,
    val stockQuantity: Int? = null
)
```

### Order Models

```kotlin
data class VendorOrder(
    val id: Int,
    val orderNumber: String,
    val customerName: String,
    val customerPhone: String?,
    val storeId: Int,
    val storeName: String,
    val items: List<OrderItem>,
    val totalAmount: Double,
    val status: String,
    val paymentMethod: String,
    val deliveryAddress: String?,
    val specialInstructions: String?,
    val createdAt: String
)

data class OrderItem(
    val name: String,
    val quantity: Int,
    val price: Double
)

data class UpdateOrderStatusRequest(
    val status: String              // "accepted", "preparing", "ready", "rejected"
)
```

### Dashboard Model

```kotlin
data class VendorDashboard(
    val totalOrders: Int,
    val totalRevenue: Double,
    val activeOrders: Int,
    val averageRating: Double,
    val totalReviews: Int,
    val topRatedProduct: String?,
    val orderStats: OrderStats
)

data class OrderStats(
    val pending: Int,
    val preparing: Int,
    val ready: Int,
    val completed: Int
)
```

### Review Models

```kotlin
data class VendorReview(
    val id: Int,
    val productId: Int,
    val productName: String,
    val customerName: String,
    val rating: Int,
    val comment: String?,
    val reply: String?,
    val createdAt: String
)

data class ReplyRequest(
    val reply: String
)
```

### Retrofit API Interface

```kotlin
interface VendorApiService {

    // ── Auth ─────────────────────────────────────────────
    @POST("vendor/auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): Response<ApiResponse<Any>>

    @POST("vendor/auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<ApiResponse<VendorAuthResponse>>

    @POST("vendor/auth/register")
    suspend fun register(@Body request: VendorRegisterRequest): Response<ApiResponse<VendorAuthResponse>>

    @POST("vendor/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<VendorAuthResponse>>

    @POST("vendor/auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): Response<ApiResponse<Any>>

    @POST("vendor/auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): Response<ApiResponse<Any>>

    // ── Profile ──────────────────────────────────────────
    @GET("vendor/profile")
    suspend fun getProfile(): Response<ApiResponse<VendorProfile>>

    @PUT("vendor/profile")
    suspend fun updateProfile(@Body body: Map<String, Any>): Response<ApiResponse<VendorProfile>>

    // ── Stores ───────────────────────────────────────────
    @GET("vendor/stores")
    suspend fun getStores(): Response<ApiResponse<List<VendorStore>>>

    @POST("vendor/stores")
    suspend fun createStore(@Body request: CreateStoreRequest): Response<ApiResponse<VendorStore>>

    @PUT("vendor/stores/{id}")
    suspend fun updateStore(@Path("id") id: Int, @Body request: CreateStoreRequest): Response<ApiResponse<VendorStore>>

    @PATCH("vendor/stores/{id}/status")
    suspend fun toggleStoreStatus(@Path("id") id: Int): Response<ApiResponse<VendorStore>>

    // ── Products ─────────────────────────────────────────
    @GET("vendor/products")
    suspend fun getProducts(@Query("store_id") storeId: Int? = null): Response<ApiResponse<List<Product>>>

    @POST("vendor/products")
    suspend fun createProduct(@Body request: CreateProductRequest): Response<ApiResponse<Product>>

    @PUT("vendor/products/{id}")
    suspend fun updateProduct(@Path("id") id: Int, @Body request: CreateProductRequest): Response<ApiResponse<Product>>

    @DELETE("vendor/products/{id}")
    suspend fun deleteProduct(@Path("id") id: Int): Response<ApiResponse<Any>>

    @Multipart
    @POST("vendor/products/{id}/images")
    suspend fun uploadProductImages(
        @Path("id") productId: Int,
        @Part images: List<MultipartBody.Part>
    ): Response<ApiResponse<Any>>

    // ── Orders ───────────────────────────────────────────
    @GET("vendor/orders")
    suspend fun getOrders(): Response<ApiResponse<List<VendorOrder>>>

    @GET("vendor/orders/{id}")
    suspend fun getOrderDetails(@Path("id") id: Int): Response<ApiResponse<VendorOrder>>

    @PATCH("vendor/orders/{id}/accept")
    suspend fun acceptOrder(@Path("id") id: Int): Response<ApiResponse<VendorOrder>>

    @PATCH("vendor/orders/{id}/status")
    suspend fun updateOrderStatus(@Path("id") id: Int, @Body request: UpdateOrderStatusRequest): Response<ApiResponse<VendorOrder>>

    // ── Dashboard ────────────────────────────────────────
    @GET("vendor/dashboard")
    suspend fun getDashboard(): Response<ApiResponse<VendorDashboard>>

    // ── Reviews ──────────────────────────────────────────
    @GET("vendor/reviews")
    suspend fun getReviews(): Response<ApiResponse<List<VendorReview>>>

    @POST("vendor/reviews/{id}/reply")
    suspend fun replyToReview(@Path("id") id: Int, @Body request: ReplyRequest): Response<ApiResponse<VendorReview>>

    // ── Upload ───────────────────────────────────────────
    @Multipart
    @POST("../upload")
    suspend fun uploadImage(
        @Part image: MultipartBody.Part,
        @Part("type") type: RequestBody
    ): Response<ApiResponse<Any>>
}
```

---

## Quick Reference Card

| Action | Endpoint | Auth |
|--------|----------|------|
| Register | `POST /vendor/auth/register` | No |
| Login (OTP) | `POST /vendor/auth/send-otp` → `verify-otp` | No |
| Login (Password) | `POST /vendor/auth/login` | No |
| Dashboard | `GET /vendor/dashboard` | Yes (vendor) |
| My stores | `GET /vendor/stores` | Yes (vendor) |
| Create store | `POST /vendor/stores` | Yes (vendor) |
| Open/Close store | `PATCH /vendor/stores/:id/status` | Yes (vendor) |
| My products | `GET /vendor/products` | Yes (vendor) |
| Add product | `POST /vendor/products` | Yes (vendor) |
| Incoming orders | `GET /vendor/orders` | Yes (vendor) |
| Accept order | `PATCH /vendor/orders/:id/accept` | Yes (vendor) |
| Update order | `PATCH /vendor/orders/:id/status` | Yes (vendor) |
| My reviews | `GET /vendor/reviews` | Yes (vendor) |
| Reply to review | `POST /vendor/reviews/:id/reply` | Yes (vendor) |
