# DailyBox Delivery Partner App — Android Integration Guide

> **Version**: 2.0 | **Last Updated**: April 2026  
> **Backend**: DailyBox Unified Backend | **API Version**: v1

---

## Table of Contents

1. [Overview](#1-overview)
2. [Setup & Configuration](#2-setup--configuration)
3. [Authentication Flow](#3-authentication-flow)
4. [API Endpoints Reference](#4-api-endpoints-reference)
5. [Order Management](#5-order-management)
6. [Live Location Tracking](#6-live-location-tracking)
7. [Availability Toggle](#7-availability-toggle)
8. [Earnings](#8-earnings)
9. [Error Handling](#9-error-handling)
10. [Recommended Architecture](#10-recommended-architecture)
11. [Data Models (Kotlin)](#11-data-models-kotlin)
12. [Background Location & Notifications](#12-background-location--notifications)

---

## 1. Overview

The **Delivery Partner App** allows drivers to:

- Log in via OTP
- View and accept assigned delivery orders
- Update order status (picked up, in transit, delivered)
- Share real-time location for customer tracking
- Toggle availability (online/offline)
- View earnings and delivery history

### Tech Stack (Recommended)

| Layer | Technology |
|-------|-----------|
| Language | Kotlin |
| UI | Jetpack Compose + Material Design 3 |
| Architecture | MVVM + Clean Architecture |
| Networking | Retrofit 2 + OkHttp |
| DI | Hilt |
| Local Storage | DataStore |
| Location | Google Location Services (Fused Location) |
| Maps | Google Maps SDK |
| Notifications | Firebase Cloud Messaging |
| Background | WorkManager + Foreground Service |

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

    val api: DeliveryApiService = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(DeliveryApiService::class.java)
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
            "delivery_secure_prefs",
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

    // Security
    implementation "androidx.security:security-crypto:1.1.0-alpha06"

    // Location
    implementation "com.google.android.gms:play-services-location:21.1.0"

    // Maps
    implementation "com.google.maps.android:maps-compose:4.3.0"

    // Firebase
    implementation platform("com.google.firebase:firebase-bom:32.7.0")
    implementation "com.google.firebase:firebase-messaging-ktx"

    // WorkManager (background tasks)
    implementation "androidx.work:work-runtime-ktx:2.9.0"
}
```

### Android Permissions (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 3. Authentication Flow

### Delivery Partner Login Flow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Splash      │────▶│  Check Token │────▶│  Home Screen  │ (valid token)
└─────────────┘     └──────────────┘     └───────────────┘
                          │ (no token)
                          ▼
                    ┌──────────────┐     ┌───────────────┐
                    │  Enter Mobile│────▶│  Enter OTP    │
                    └──────────────┘     └───────────────┘
                                               │
                                               ▼
                                         ┌───────────────┐
                                         │  Save Token   │
                                         │  → Home       │
                                         └───────────────┘
```

> **Note**: Delivery partners are created by admin. Partners can only log in — they cannot self-register through the app. The admin creates their account via `POST /admin/delivery-partners` and the partner receives OTP to their registered mobile number.

### API Calls

#### Step 1: Send OTP

```
POST /delivery/auth/send-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "message": "OTP sent",
    "expiresIn": "10 minutes"
  }
}
```

#### Step 2: Verify OTP

```
POST /delivery/auth/verify-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "otpCode": "123456"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": 156,
      "name": "Raj Kumar",
      "mobileNumber": "9876543210",
      "role": "delivery",
      "vehicleType": "bike",
      "isAvailable": true,
      "approvalStatus": "approved"
    }
  }
}
```

> **Important**: Store the `token` securely. All subsequent API calls require `Authorization: Bearer <token>`.

> **Approval Check**: If `approvalStatus` is `"pending"`, show a "Your account is under review" screen. If `"rejected"`, show "Your application has been declined."

---

## 4. API Endpoints Reference

### Auth (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/delivery/auth/send-otp` | Send OTP to mobile |
| POST | `/delivery/auth/verify-otp` | Verify OTP & get token |

### Orders (Auth + `delivery` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/delivery/orders` | Get assigned orders |
| PATCH | `/delivery/orders/:id/status` | Update delivery status |

### Location (Auth + `delivery` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/delivery/location` | Update current location |

### Availability (Auth + `delivery` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/delivery/availability` | Toggle online/offline |

### Earnings (Auth + `delivery` Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/delivery/earnings` | Get earnings data |

---

## 5. Order Management

### Get Assigned Orders

```
GET /delivery/orders
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
      "storeName": "Pizza Palace",
      "customerName": "John Doe",
      "customerPhone": "9876543210",
      "pickupAddress": "123 Main Street, Delhi",
      "deliveryAddress": "456 Park Ave, Delhi",
      "pickupLatitude": 28.6139,
      "pickupLongitude": 77.2090,
      "deliveryLatitude": 28.6200,
      "deliveryLongitude": 77.2150,
      "status": "accepted",
      "itemCount": 2,
      "totalAmount": 733.48,
      "paymentMethod": "UPI",
      "createdAt": "2024-04-16T10:30:00Z"
    }
  ]
}
```

### Update Delivery Status

```
PATCH /delivery/orders/1001/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "picked_up"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "status": "picked_up",
    "updatedAt": "2024-04-16T10:55:00Z"
  }
}
```

### Delivery Status Flow

```
assigned → accepted → picked_up → in_transit → delivered
                                                   ↗
                      cancelled ←──────────────────
```

| Status | Meaning | Driver Action | UI |
|--------|---------|---------------|-----|
| `assigned` | Order assigned to you | View details | New order card |
| `accepted` | Driver accepted | Navigate to store | "Navigate to Pickup" button |
| `picked_up` | Food collected from store | Navigate to customer | "Navigate to Delivery" button |
| `in_transit` | En route to customer | Deliver | "Mark Delivered" button |
| `delivered` | Order completed | Done | Success screen |
| `cancelled` | Order cancelled | Provide reason | Cancel dialog |

### Cancel with Reason

```
PATCH /delivery/orders/1001/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "cancelled",
  "cancellationReason": "Customer unreachable"
}
```

### Order Card UI Layout

```
┌─────────────────────────────────────────────┐
│  📦 ORD-2024-04-16-001           ₹733.48   │
│                                              │
│  🏪 Pickup: Pizza Palace                    │
│     123 Main Street, Delhi                   │
│                                              │
│  📍 Deliver: John Doe (9876543210)          │
│     456 Park Ave, Delhi                      │
│                                              │
│  Items: 2 | Payment: UPI                     │
│                                              │
│  [ Navigate to Pickup ]  [ Mark Picked Up ] │
└─────────────────────────────────────────────┘
```

---

## 6. Live Location Tracking

### Update Location API

```
POST /delivery/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 28.6150,
  "longitude": 77.2100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Location updated",
  "data": {
    "latitude": 28.6150,
    "longitude": 77.2100,
    "updatedAt": "2024-04-16T10:45:00Z"
  }
}
```

### Location Update Strategy

| Scenario | Update Frequency | Method |
|----------|-----------------|--------|
| Active delivery | Every 10 seconds | Foreground Service |
| Online (no order) | Every 60 seconds | WorkManager |
| Offline | No updates | Stop location |

### Foreground Service Implementation

```kotlin
@AndroidEntryPoint
class LocationTrackingService : Service() {

    @Inject lateinit var api: DeliveryApiService

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        startLocationUpdates()
        return START_STICKY
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            10_000L  // 10 seconds
        ).setMinUpdateDistanceMeters(10f).build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    scope.launch {
                        try {
                            api.updateLocation(
                                UpdateLocationRequest(
                                    latitude = location.latitude,
                                    longitude = location.longitude
                                )
                            )
                        } catch (e: Exception) {
                            // Log error, retry on next update
                        }
                    }
                }
            }
        }

        fusedLocationClient.requestLocationUpdates(
            locationRequest, callback, Looper.getMainLooper()
        )
    }

    private fun createNotification(): Notification {
        val channel = NotificationChannel(
            "location_tracking",
            "Delivery Tracking",
            NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java)
            .createNotificationChannel(channel)

        return NotificationCompat.Builder(this, "location_tracking")
            .setContentTitle("DailyBox Delivery")
            .setContentText("Tracking your location for active delivery")
            .setSmallIcon(R.drawable.ic_delivery)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        const val NOTIFICATION_ID = 1001
    }
}
```

### When to Start/Stop Tracking

```kotlin
// Start when order is accepted
fun onOrderAccepted() {
    val intent = Intent(context, LocationTrackingService::class.java)
    ContextCompat.startForegroundService(context, intent)
}

// Stop when order is delivered/cancelled
fun onOrderCompleted() {
    val intent = Intent(context, LocationTrackingService::class.java)
    context.stopService(intent)
}
```

---

## 7. Availability Toggle

### Toggle Online/Offline

```
PATCH /delivery/availability
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isAvailable": true,
    "updatedAt": "2024-04-16T10:00:00Z"
  }
}
```

### UI Implementation

```
┌─────────────────────────────────────┐
│                                     │
│    🟢 You are ONLINE               │
│    [  Toggle Offline  ]             │
│                                     │
│    Waiting for orders...            │
│                                     │
└─────────────────────────────────────┘
```

```
┌─────────────────────────────────────┐
│                                     │
│    🔴 You are OFFLINE              │
│    [  Go Online  ]                  │
│                                     │
│    Go online to receive orders      │
│                                     │
└─────────────────────────────────────┘
```

### Logic

```kotlin
class HomeViewModel @Inject constructor(
    private val api: DeliveryApiService
) : ViewModel() {

    private val _isAvailable = MutableStateFlow(false)
    val isAvailable: StateFlow<Boolean> = _isAvailable

    fun toggleAvailability() {
        viewModelScope.launch {
            val result = safeApiCall { api.toggleAvailability() }
            if (result is Resource.Success) {
                _isAvailable.value = result.data.data.isAvailable

                // Start/stop location tracking based on availability
                if (_isAvailable.value) {
                    startLocationTracking()
                } else {
                    stopLocationTracking()
                }
            }
        }
    }
}
```

---

## 8. Earnings

### Get Earnings

```
GET /delivery/earnings
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalEarnings": 15420.00,
    "completedDeliveries": 245,
    "pendingEarnings": 2340.00,
    "settledEarnings": 13080.00,
    "monthlyEarnings": 5240.00,
    "averagePerDelivery": 63.00
  }
}
```

### Earnings Screen Layout

```
┌─────────────────────────────────────┐
│  💰 Your Earnings                   │
│                                     │
│  Total Earnings     ₹15,420.00      │
│  This Month         ₹5,240.00       │
│  Avg per Delivery   ₹63.00          │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Completed Deliveries   245         │
│  Pending Payout         ₹2,340.00   │
│  Settled                ₹13,080.00  │
│                                     │
└─────────────────────────────────────┘
```

---

## 9. Error Handling

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

| Code | Meaning | App Action |
|------|---------|------------|
| 200 | Success | Parse data |
| 201 | Created | Show success |
| 400 | Bad Request | Show error message |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show "Access denied" (not delivery role) |
| 404 | Not Found | Show "Order not found" |
| 500 | Server Error | Show retry |

### Kotlin Error Handler

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
                403 -> Resource.Error("Delivery partner access required.", 403)
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

## 10. Recommended Architecture

### Project Structure

```
com.dailybox.delivery/
├── data/
│   ├── remote/
│   │   ├── DeliveryApiService.kt   # Retrofit interface
│   │   ├── AuthInterceptor.kt      # JWT injection
│   │   └── dto/                     # DTOs
│   └── repository/
│       ├── AuthRepository.kt
│       ├── OrderRepository.kt
│       ├── LocationRepository.kt
│       └── EarningsRepository.kt
├── service/
│   └── LocationTrackingService.kt   # Foreground service
├── ui/
│   ├── auth/                        # Login, OTP screens
│   ├── home/                        # Home + availability toggle
│   ├── orders/                      # Order list, detail, status
│   ├── earnings/                    # Earnings screen
│   ├── navigation/                  # Navigation with maps
│   └── components/                  # Shared composables
├── di/
│   └── AppModule.kt
├── navigation/
│   └── NavGraph.kt
└── util/
    ├── TokenManager.kt
    ├── Resource.kt
    ├── LocationHelper.kt
    └── Extensions.kt
```

### Screen List

| # | Screen | Key APIs |
|---|--------|----------|
| 1 | Splash | Check token + approval status |
| 2 | Login (Mobile) | `POST /delivery/auth/send-otp` |
| 3 | OTP Verification | `POST /delivery/auth/verify-otp` |
| 4 | Pending Approval | (check `approvalStatus` from login) |
| 5 | Home | Availability toggle + order count |
| 6 | Active Orders | `GET /delivery/orders` |
| 7 | Order Detail | Order info + map view |
| 8 | Navigation | Google Maps directions |
| 9 | Delivery Confirmation | `PATCH /delivery/orders/:id/status` |
| 10 | Earnings | `GET /delivery/earnings` |

### Navigation Flow

```
Splash
  ├── (no token) → Login → OTP → Home
  ├── (pending approval) → PendingScreen
  └── (approved) → Home
        ├── Active Orders ← → Order Detail → Navigation → Confirm
        └── Earnings
```

---

## 11. Data Models (Kotlin)

### API Response Wrapper

```kotlin
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val message: String?
)
```

### Auth Models

```kotlin
data class SendOtpRequest(val mobileNumber: String)
data class VerifyOtpRequest(val mobileNumber: String, val otpCode: String)

data class DeliveryAuthResponse(
    val token: String,
    val user: DeliveryUser
)

data class DeliveryUser(
    val userId: Int,
    val name: String,
    val mobileNumber: String,
    val role: String,               // "delivery"
    val vehicleType: String?,
    val isAvailable: Boolean,
    val approvalStatus: String      // "pending", "approved", "rejected"
)
```

### Order Models

```kotlin
data class DeliveryOrder(
    val id: Int,
    val orderNumber: String,
    val storeName: String,
    val customerName: String,
    val customerPhone: String?,
    val pickupAddress: String,
    val deliveryAddress: String,
    val pickupLatitude: Double?,
    val pickupLongitude: Double?,
    val deliveryLatitude: Double?,
    val deliveryLongitude: Double?,
    val status: String,
    val itemCount: Int,
    val totalAmount: Double,
    val paymentMethod: String?,
    val createdAt: String
)

data class UpdateStatusRequest(
    val status: String,                     // "accepted", "picked_up", "in_transit", "delivered", "cancelled"
    val cancellationReason: String? = null
)

data class StatusUpdateResponse(
    val id: Int,
    val status: String,
    val updatedAt: String
)
```

### Location Model

```kotlin
data class UpdateLocationRequest(
    val latitude: Double,
    val longitude: Double
)

data class LocationResponse(
    val latitude: Double,
    val longitude: Double,
    val updatedAt: String
)
```

### Availability Model

```kotlin
data class AvailabilityResponse(
    val isAvailable: Boolean,
    val updatedAt: String
)
```

### Earnings Model

```kotlin
data class DeliveryEarnings(
    val totalEarnings: Double,
    val completedDeliveries: Int,
    val pendingEarnings: Double,
    val settledEarnings: Double,
    val monthlyEarnings: Double,
    val averagePerDelivery: Double
)
```

### Retrofit API Interface

```kotlin
interface DeliveryApiService {

    // ── Auth ─────────────────────────────────────────────
    @POST("delivery/auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): Response<ApiResponse<Any>>

    @POST("delivery/auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<ApiResponse<DeliveryAuthResponse>>

    // ── Orders ───────────────────────────────────────────
    @GET("delivery/orders")
    suspend fun getOrders(): Response<ApiResponse<List<DeliveryOrder>>>

    @PATCH("delivery/orders/{id}/status")
    suspend fun updateOrderStatus(
        @Path("id") orderId: Int,
        @Body request: UpdateStatusRequest
    ): Response<ApiResponse<StatusUpdateResponse>>

    // ── Location ─────────────────────────────────────────
    @POST("delivery/location")
    suspend fun updateLocation(
        @Body request: UpdateLocationRequest
    ): Response<ApiResponse<LocationResponse>>

    // ── Availability ─────────────────────────────────────
    @PATCH("delivery/availability")
    suspend fun toggleAvailability(): Response<ApiResponse<AvailabilityResponse>>

    // ── Earnings ─────────────────────────────────────────
    @GET("delivery/earnings")
    suspend fun getEarnings(): Response<ApiResponse<DeliveryEarnings>>
}
```

---

## 12. Background Location & Notifications

### Firebase Cloud Messaging Setup

```kotlin
@AndroidEntryPoint
class DeliveryFCMService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data

        when (data["type"]) {
            "new_order" -> {
                showNewOrderNotification(
                    orderId = data["orderId"] ?: "",
                    storeName = data["storeName"] ?: "",
                    amount = data["amount"] ?: ""
                )
            }
            "order_cancelled" -> {
                showCancellationNotification(data["orderId"] ?: "")
            }
        }
    }

    override fun onNewToken(token: String) {
        // Send FCM token to backend for push notifications
        // POST /delivery/fcm-token { "fcmToken": token }
    }

    private fun showNewOrderNotification(orderId: String, storeName: String, amount: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("orderId", orderId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, "orders")
            .setContentTitle("New Delivery Order!")
            .setContentText("Pickup from $storeName — ₹$amount")
            .setSmallIcon(R.drawable.ic_delivery)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        NotificationManagerCompat.from(this).notify(orderId.hashCode(), notification)
    }
}
```

### Polling Fallback (if FCM is not set up)

```kotlin
class OrderPollingWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val response = RetrofitClient.api.getOrders()
            if (response.isSuccessful) {
                val orders = response.body()?.data ?: emptyList()
                val newOrders = orders.filter { it.status == "assigned" }
                if (newOrders.isNotEmpty()) {
                    showNewOrderNotification(newOrders.first())
                }
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}

// Schedule polling every 30 seconds when online
fun startOrderPolling(context: Context) {
    val request = PeriodicWorkRequestBuilder<OrderPollingWorker>(
        30, TimeUnit.SECONDS
    ).setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
    ).build()

    WorkManager.getInstance(context)
        .enqueueUniquePeriodicWork("order_polling", ExistingPeriodicWorkPolicy.KEEP, request)
}

fun stopOrderPolling(context: Context) {
    WorkManager.getInstance(context).cancelUniqueWork("order_polling")
}
```

---

## Quick Reference Card

| Action | Endpoint | Auth |
|--------|----------|------|
| Login (OTP) | `POST /delivery/auth/send-otp` → `verify-otp` | No |
| My orders | `GET /delivery/orders` | Yes (delivery) |
| Accept order | `PATCH /delivery/orders/:id/status` `{"status":"accepted"}` | Yes (delivery) |
| Mark picked up | `PATCH /delivery/orders/:id/status` `{"status":"picked_up"}` | Yes (delivery) |
| Mark in transit | `PATCH /delivery/orders/:id/status` `{"status":"in_transit"}` | Yes (delivery) |
| Mark delivered | `PATCH /delivery/orders/:id/status` `{"status":"delivered"}` | Yes (delivery) |
| Cancel | `PATCH /delivery/orders/:id/status` `{"status":"cancelled","cancellationReason":"..."}` | Yes (delivery) |
| Update location | `POST /delivery/location` `{"latitude":..,"longitude":..}` | Yes (delivery) |
| Go online/offline | `PATCH /delivery/availability` | Yes (delivery) |
| My earnings | `GET /delivery/earnings` | Yes (delivery) |

---

## Delivery Lifecycle Summary

```
1. Partner goes ONLINE        → PATCH /delivery/availability
2. Location tracking starts   → POST /delivery/location (every 10-60s)
3. New order assigned (FCM)   → GET /delivery/orders
4. Accept order               → PATCH /delivery/orders/:id/status {"status":"accepted"}
5. Navigate to store          → Google Maps directions (pickup coordinates)
6. Pick up food               → PATCH /delivery/orders/:id/status {"status":"picked_up"}
7. Navigate to customer       → Google Maps directions (delivery coordinates)
8. Deliver order              → PATCH /delivery/orders/:id/status {"status":"delivered"}
9. View earnings              → GET /delivery/earnings
10. Go OFFLINE                → PATCH /delivery/availability
```
