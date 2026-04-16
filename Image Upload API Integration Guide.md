# Image Upload API Integration Guide

## Endpoint

```
POST https://dailyboxapp.com/api/upload
```

## Headers

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

## Request Body (multipart/form-data)

| Field   | Type   | Required | Description                      |
| ------- | ------ | -------- | -------------------------------- |
| `image` | File   | Yes      | Image file (JPG, JPEG, PNG only) |
| `type`  | String | Yes      | Folder category (see below)      |

## Allowed `type` Values Per App

| App          | Use `type`  | When                                    |
| ------------ | ----------- | --------------------------------------- |
| **Customer** | `users`     | Profile photo upload                    |
| **Vendor**   | `vendors`   | Store logo, banner                      |
| **Vendor**   | `products`  | Product/menu item images                |
| **Delivery** | `delivery`  | Delivery partner profile, documents     |
| **Admin**    | `admin`     | Admin-uploaded assets                   |

## Success Response (201)

```json
{
  "success": true,
  "imageUrl": "https://dailyboxapp.com/uploads/users/1713012345678-123456.jpg"
}
```

## Error Responses

| Status | Scenario             | Response                                                                                              |
| ------ | -------------------- | ----------------------------------------------------------------------------------------------------- |
| 400    | No file sent         | `{ "success": false, "message": "No image file provided. Use field name \"image\"." }`                |
| 400    | Wrong file type      | `{ "success": false, "message": "Invalid file type. Only JPG, JPEG, and PNG images are allowed." }`   |
| 400    | File > 5MB           | `{ "success": false, "message": "File too large. Maximum size is 5MB." }`                             |
| 400    | Missing `type`       | `{ "success": false, "message": "Missing required field: type" }`                                     |
| 400    | Invalid `type`       | `{ "success": false, "message": "Invalid type \"xyz\". Allowed types: users, vendors, products, delivery, admin" }` |
| 401    | No/invalid token     | Unauthorized                                                                                          |

---

## Code Examples for Mobile Teams

### Android (Kotlin — Retrofit)

```kotlin
@Multipart
@POST("api/upload")
suspend fun uploadImage(
    @Part image: MultipartBody.Part,
    @Part("type") type: RequestBody
): Response<UploadResponse>

// Usage
val file = File(imagePath)
val requestFile = file.asRequestBody("image/jpeg".toMediaType())
val imagePart = MultipartBody.Part.createFormData("image", file.name, requestFile)
val typePart = "users".toRequestBody("text/plain".toMediaType())
val response = api.uploadImage(imagePart, typePart)
```

### iOS (Swift — Alamofire)

```swift
AF.upload(multipartFormData: { formData in
    formData.append(imageData, withName: "image", fileName: "photo.jpg", mimeType: "image/jpeg")
    formData.append("users".data(using: .utf8)!, withName: "type")
}, to: "https://dailyboxapp.com/api/upload",
   headers: ["Authorization": "Bearer \(token)"])
.responseDecodable(of: UploadResponse.self) { response in
    // handle response.value?.imageUrl
}
```

### Flutter (Dart — Dio)

```dart
final formData = FormData.fromMap({
  'image': await MultipartFile.fromFile(filePath, filename: 'photo.jpg'),
  'type': 'users',
});
final response = await dio.post('/api/upload', data: formData);
// response.data['imageUrl']
```

---

## Integration Flow

```
1. User picks/captures image in app
2. Validate: JPG/JPEG/PNG, ≤ 5MB (client-side)
3. POST /api/upload with image + type
4. Store returned imageUrl
5. Use imageUrl in subsequent API calls (e.g. update profile)
```

---

## Key Points

- Field name **must** be `image` (not `file`, `photo`, etc.)
- `type` **must** be sent as a form field, not a query param
- Auth token is **required** — user must be logged in
- The returned `imageUrl` is a **permanent public URL** — store it and use it directly in `<img>` tags or image loaders
- Max **5MB** per image — compress before uploading if needed
- **Multiple upload** endpoint (`POST /api/upload/multiple`, field: `images`, max 5 files) is available for future use
