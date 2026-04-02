# 📡 API Reference — Booking Pro LE

Complete REST API documentation with examples and response schemas.

---

## Table of Contents

1. [Authentication](#-authentication)
2. [Booking Endpoints](#-booking-endpoints)
3. [Slot Management](#-slot-management)
4. [Error Handling](#-error-handling)
5. [Rate Limiting](#-rate-limiting)
6. [Examples](#-examples)

---

## 🔐 Authentication

### API Key Authentication

All requests require the `X-API-Key` header:

```http
X-API-Key: dev-api-key
```

**Where to find it:**
- Development: `.env` file `API_KEY` variable
- Production: Environment secrets in your hosting platform

### JWT Authentication (Future)

Optional JWT via `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### CORS Configuration

The API serves preflight requests for these origins:

```dotenv
# apps/api/.env
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## 🎫 Booking Endpoints

### Create Booking

Creates a new booking in the system.

```http
POST /api/tenants/:tenantId/bookings
X-API-Key: dev-api-key
Idempotency-Key: unique-uuid-per-request
Content-Type: application/json

{
  "serviceId": "haircut",
  "startAt": "2024-02-20T09:00:00Z",
  "endAt": "2024-02-20T09:45:00Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1-555-0100",
  "notes": "First time customer"
}
```

#### Request Body Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | string | ✅ | Service/activity identifier |
| `startAt` | ISO8601 | ✅ | Start time (UTC) |
| `endAt` | ISO8601 | ✅ | End time (UTC) |
| `customerName` | string | ✅ | Customer full name |
| `customerEmail` | string | ✅ | Customer email |
| `customerPhone` | string | ⬜ | Customer phone (optional) |
| `notes` | string | ⬜ | Additional notes (optional) |

#### Response (201 Created)

```json
{
  "id": "booking_xyz123",
  "tenantId": "tenant_1",
  "providerId": "mock_provider_1",
  "externalReservationId": "ext_booking_456",
  "status": "CONFIRMED",
  "startAt": "2024-02-20T09:00:00.000Z",
  "endAt": "2024-02-20T09:45:00.000Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1-555-0100",
  "notes": "First time customer",
  "createdAt": "2024-02-20T10:30:00.000Z"
}
```

#### Response (409 Conflict - Duplicate)

If same `Idempotency-Key` sent twice, returns the first booking:

```json
{
  "id": "booking_xyz123",
  "status": "CONFIRMED"
}
```

#### Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "startAt",
      "message": "Must be valid ISO8601 date"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Missing or invalid X-API-Key"
}
```

**429 Too Many Requests:**
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded"
}
```

---

### Get Bookings

List all bookings for a tenant in a date range.

```http
GET /api/tenants/:tenantId/bookings?from=2024-02-20T00:00Z&to=2024-02-21T00:00Z
X-API-Key: dev-api-key
```

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | ISO8601 | ✅ | Start date (inclusive) |
| `to` | ISO8601 | ✅ | End date (inclusive) |
| `status` | string | ⬜ | Filter: CONFIRMED, PENDING, CANCELLED |
| `serviceId` | string | ⬜ | Filter by service |

#### Response (200 OK)

```json
{
  "bookings": [
    {
      "id": "booking_xyz123",
      "tenantId": "tenant_1",
      "status": "CONFIRMED",
      "startAt": "2024-02-20T09:00:00.000Z",
      "endAt": "2024-02-20T09:45:00.000Z",
      "customerName": "John Doe",
      "customerEmail": "john@example.com"
    },
    {
      "id": "booking_abc456",
      "tenantId": "tenant_1",
      "status": "CONFIRMED",
      "startAt": "2024-02-20T14:00:00.000Z",
      "endAt": "2024-02-20T15:00:00.000Z",
      "customerName": "Jane Smith",
      "customerEmail": "jane@example.com"
    }
  ],
  "totalCount": 2,
  "pageInfo": {
    "page": 1,
    "pageSize": 50
  }
}
```

---

### Get Single Booking

Retrieve details of a specific booking.

```http
GET /api/tenants/:tenantId/bookings/:bookingId
X-API-Key: dev-api-key
```

#### Response (200 OK)

```json
{
  "id": "booking_xyz123",
  "tenantId": "tenant_1",
  "providerId": "mock_provider_1",
  "externalReservationId": "ext_booking_456",
  "status": "CONFIRMED",
  "startAt": "2024-02-20T09:00:00.000Z",
  "endAt": "2024-02-20T09:45:00.000Z",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1-555-0100",
  "notes": "First time customer",
  "createdAt": "2024-02-20T10:30:00.000Z",
  "updatedAt": "2024-02-20T10:30:00.000Z",
  "cancelledAt": null
}
```

#### Response (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Booking not found"
}
```

---

### Cancel Booking

Cancel an existing booking.

```http
POST /api/tenants/:tenantId/bookings/:bookingId/cancel
X-API-Key: dev-api-key
Content-Type: application/json
```

#### Response (200 OK)

```json
{
  "id": "booking_xyz123",
  "status": "CANCELLED",
  "cancelledAt": "2024-02-20T11:00:00.000Z"
}
```

#### Response (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Cannot cancel CONFIRMED booking (already in progress)"
}
```

---

### Update Booking (Reschedule)

Update booking time (if supported by provider).

```http
PATCH /api/tenants/:tenantId/bookings/:bookingId
X-API-Key: dev-api-key
Content-Type: application/json

{
  "startAt": "2024-02-21T10:00:00Z",
  "endAt": "2024-02-21T10:45:00Z"
}
```

#### Response (200 OK)

```json
{
  "id": "booking_xyz123",
  "startAt": "2024-02-21T10:00:00.000Z",
  "endAt": "2024-02-21T10:45:00.000Z",
  "status": "CONFIRMED",
  "updatedAt": "2024-02-20T11:05:00.000Z"
}
```

---

## 📅 Slot Management

### Get Available Slots

Retrieve available time slots for booking.

```http
GET /api/tenants/:tenantId/slots?from=2024-02-20T09:00Z&to=2024-02-20T18:00Z&serviceId=haircut
X-API-Key: dev-api-key
```

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | ISO8601 | ✅ | Start datetime |
| `to` | ISO8601 | ✅ | End datetime |
| `serviceId` | string | ⬜ | Filter by service |
| `staffId` | string | ⬜ | Filter by staff member |

#### Response (200 OK)

```json
{
  "slots": [
    {
      "startAt": "2024-02-20T09:00:00.000Z",
      "endAt": "2024-02-20T09:45:00.000Z",
      "available": true,
      "serviceId": "haircut",
      "staffId": "staff_john"
    },
    {
      "startAt": "2024-02-20T09:45:00.000Z",
      "endAt": "2024-02-20T10:30:00.000Z",
      "available": true,
      "serviceId": "haircut",
      "staffId": "staff_john"
    },
    {
      "startAt": "2024-02-20T10:30:00.000Z",
      "endAt": "2024-02-20T11:15:00.000Z",
      "available": false,
      "serviceId": "haircut",
      "staffId": "staff_john",
      "reason": "Already booked"
    }
  ],
  "totalSlots": 20,
  "availableSlots": 18
}
```

---

## ❌ Error Handling

### Unified Error Format

All errors return this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-02-20T11:00:00.000Z",
  "path": "/api/tenants/tenant_1/bookings"
}
```

### Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | OK | Successful request |
| `201` | Created | Booking created |
| `400` | Bad Request | Invalid input validation |
| `401` | Unauthorized | Missing X-API-Key |
| `403` | Forbidden | Access denied |
| `404` | Not Found | Booking doesn't exist |
| `409` | Conflict | Duplicate booking (idempotency key) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Internal error |

### Validation Errors

```http
POST /api/tenants/tenant_1/bookings
X-API-Key: dev-api-key
Content-Type: application/json

{
  "serviceId": "",
  "startAt": "invalid-date",
  "customerName": ""
}
```

Response:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "serviceId",
      "message": "serviceId should not be empty"
    },
    {
      "field": "startAt",
      "message": "startAt must be a valid ISO 8601 date"
    },
    {
      "field": "customerName",
      "message": "customerName should not be empty"
    }
  ]
}
```

---

## 🚦 Rate Limiting

### Limits

- **15 minutes window**: 5 requests per API key
- **Exceeded**: Returns `429 Too Many Requests`

### Headers

Every response includes rate limit info:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1708337400
```

### Retry Strategy

```typescript
// Exponential backoff
const wait = (ms) => new Promise(r => setTimeout(r, ms));

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error.status === 429) {
      await wait(Math.pow(2, attempt - 1) * 1000);
    } else {
      throw error;
    }
  }
}
```

---

## 📝 Examples

### JavaScript/TypeScript

```typescript
const API_BASE = "http://localhost:4000";
const API_KEY = "dev-api-key";
const TENANT_ID = "tenant_1";

// Create booking
async function createBooking() {
  const response = await fetch(
    `${API_BASE}/api/tenants/${TENANT_ID}/bookings`,
    {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Idempotency-Key": crypto.randomUUID(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        serviceId: "haircut",
        startAt: "2024-02-20T09:00:00Z",
        endAt: "2024-02-20T09:45:00Z",
        customerName: "John Doe",
        customerEmail: "john@example.com"
      })
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return await response.json();
}

// Get slots
async function getAvailableSlots(date: string) {
  const response = await fetch(
    `${API_BASE}/api/tenants/${TENANT_ID}/slots?from=${date}T09:00Z&to=${date}T18:00Z`,
    {
      headers: { "X-API-Key": API_KEY }
    }
  );

  return await response.json();
}
```

### cURL

```bash
# Get available slots
curl -X GET "http://localhost:4000/api/tenants/tenant_1/slots?from=2024-02-20T09:00Z&to=2024-02-20T18:00Z" \
  -H "X-API-Key: dev-api-key"

# Create booking
curl -X POST "http://localhost:4000/api/tenants/tenant_1/bookings" \
  -H "X-API-Key: dev-api-key" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "haircut",
    "startAt": "2024-02-20T09:00:00Z",
    "endAt": "2024-02-20T09:45:00Z",
    "customerName": "John Doe",
    "customerEmail": "john@example.com"
  }'

# List bookings
curl -X GET "http://localhost:4000/api/tenants/tenant_1/bookings?from=2024-02-20T00:00Z&to=2024-02-21T00:00Z" \
  -H "X-API-Key: dev-api-key"

# Cancel booking
curl -X POST "http://localhost:4000/api/tenants/tenant_1/bookings/booking_xyz123/cancel" \
  -H "X-API-Key: dev-api-key"
```

### Python

```python
import requests
import json
from datetime import datetime
from uuid import uuid4

API_BASE = "http://localhost:4000"
API_KEY = "dev-api-key"
TENANT_ID = "tenant_1"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Create booking
def create_booking():
    payload = {
        "serviceId": "haircut",
        "startAt": "2024-02-20T09:00:00Z",
        "endAt": "2024-02-20T09:45:00Z",
        "customerName": "John Doe",
        "customerEmail": "john@example.com"
    }
    
    headers_with_idempotency = {
        **headers,
        "Idempotency-Key": str(uuid4())
    }
    
    response = requests.post(
        f"{API_BASE}/api/tenants/{TENANT_ID}/bookings",
        json=payload,
        headers=headers_with_idempotency
    )
    
    return response.json()

# Get slots
def get_slots():
    params = {
        "from": "2024-02-20T09:00Z",
        "to": "2024-02-20T18:00Z"
    }
    
    response = requests.get(
        f"{API_BASE}/api/tenants/{TENANT_ID}/slots",
        params=params,
        headers=headers
    )
    
    return response.json()
```

---

## 🔗 Related Docs

- **[Setup Guide](SETUP.md)** — How to get the API running
- **[User Manual](USER-MANUAL.md)** — Dashboard guide
- **[Architecture](../README.md#-architecture)** — System design

---

**Last Updated:** February 2026  
**API Version:** 1.0.0  
**Status:** ✅ Stable
