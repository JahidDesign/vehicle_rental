# 🚗 Vehicle Rental System API

A fully-featured backend REST API for a vehicle rental management system built with **Node.js**, **TypeScript**, **Express.js**, and **PostgreSQL**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| Password Hashing | bcrypt |
| Scheduler | node-cron |

---

## 📁 Project Structure

```
src/
├── config/
│   ├── env.ts                  # Environment config loader
│   ├── database.ts             # PostgreSQL connection pool
│   └── database.init.ts       # DB schema initializer (run once)
├── middleware/
│   ├── auth.middleware.ts      # JWT authenticate + role authorize
│   └── error.middleware.ts    # 404 & global error handlers
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.routes.ts
│   ├── users/
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.routes.ts
│   ├── vehicles/
│   │   ├── vehicles.service.ts
│   │   ├── vehicles.controller.ts
│   │   └── vehicles.routes.ts
│   └── bookings/
│       ├── bookings.service.ts
│       ├── bookings.controller.ts
│       └── bookings.routes.ts
├── types/
│   └── index.ts               # Shared TypeScript interfaces & types
├── utils/
│   └── response.ts            # Standardised success/error helpers
├── app.ts                      # Express app setup & route mounting
└── server.ts                   # Entry point, DB check, cron job
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- npm >= 8

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd vehicle-rental-api
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=vehicle_rental_db
DB_USER=postgres
DB_PASSWORD=yourpassword

JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

### 3. Create the PostgreSQL database

```sql
CREATE DATABASE vehicle_rental_db;
```

### 4. Initialize database tables

```bash
npm run db:init
```

This creates all required tables (`users`, `vehicles`, `bookings`) with constraints and indexes.

### 5. Run the server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

Server starts at: `http://localhost:5000`

---

## 🌐 API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### 🔐 Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/signup` | Public | Register new user |
| POST | `/auth/signin` | Public | Login, receive JWT |

**Signup body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "01712345678",
  "role": "customer"
}
```

**Signin body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### 🚗 Vehicles

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/vehicles` | Public | List all vehicles |
| GET | `/vehicles/:vehicleId` | Public | Get vehicle by ID |
| POST | `/vehicles` | Admin | Create vehicle |
| PUT | `/vehicles/:vehicleId` | Admin | Update vehicle |
| DELETE | `/vehicles/:vehicleId` | Admin | Delete vehicle (no active bookings) |

---

### 👥 Users

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users` | Admin | List all users |
| PUT | `/users/:userId` | Admin or Own | Update user profile / role |
| DELETE | `/users/:userId` | Admin | Delete user (no active bookings) |

---

### 📅 Bookings

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/bookings` | Auth | Create booking |
| GET | `/bookings` | Auth | Admin: all bookings. Customer: own only |
| PUT | `/bookings/:bookingId` | Auth | Customer: cancel. Admin: return |

**Create booking body:**
```json
{
  "customer_id": 1,
  "vehicle_id": 2,
  "rent_start_date": "2024-01-15",
  "rent_end_date": "2024-01-20"
}
```

---

## 💡 Business Logic

### Price Calculation
```
total_price = daily_rent_price × (rent_end_date - rent_start_date in days)
```

### Vehicle Availability
- **Booking created** → vehicle status → `booked`
- **Booking cancelled** → vehicle status → `available`
- **Booking returned** → vehicle status → `available`

### Role Permissions
| Action | Admin | Customer |
|--------|-------|----------|
| Manage vehicles | ✅ | ❌ |
| View all users | ✅ | ❌ |
| Update any user | ✅ | Own only |
| Delete users | ✅ | ❌ |
| View all bookings | ✅ | Own only |
| Cancel booking | ✅ | Before start date only |
| Mark as returned | ✅ | ❌ |

### Auto-Return Cron Job
A scheduled job runs **daily at midnight** and automatically marks bookings as `returned` when `rent_end_date` has passed, freeing up the vehicle.

---

## 📋 Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": "Detail"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |
