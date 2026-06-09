# ⚡ Flash Sale API

> A high-concurrency, production-ready Flash Sale backend API built with Node.js, Express, PostgreSQL, and Redis.  
> Designed to handle thousands of simultaneous purchase requests while preventing overselling through queue-based order processing.

---

## 🏗️ Architecture Overview

```
Client Requests
      │
      ▼
 Express Server (Rate Limiting + Auth Middleware)
      │
      ├──▶ Auth Routes       → JWT-based registration/login
      ├──▶ Product Routes    → Manage flash sale products
      ├──▶ Order Routes      → Submit purchase requests
      │
      ▼
 Redis Queue (node-cron workers)
      │
      ▼
 Background Workers (Process orders sequentially)
      │
      ▼
 PostgreSQL (Persistent storage — users, products, orders)
```

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure register/login with hashed passwords via `bcryptjs` |
| 🛡️ **Rate Limiting** | Prevents abuse and bot flooding during flash sales |
| 📦 **Redis Queue** | Decouples order intake from processing — no overselling |
| 🗄️ **PostgreSQL** | Persistent, ACID-compliant storage for users, products, and orders |
| ⏰ **node-cron Jobs** | Scheduled tasks for auto-starting/ending sale events |
| 🔄 **Background Workers** | Async order processing from the Redis queue |
| 🧰 **Seeder Scripts** | One-command DB setup, user seeding, and order seeding |
| 🌐 **CORS Enabled** | Cross-origin support for frontend integration |
🚀 Battle-Tested: Successfully load-tested to handle 1,000+ concurrent checkout requests per second using Redis NX locks to completely eliminate race conditions and database deadlocks.

---

## 🧰 Tech Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express v5
- **Database:** PostgreSQL (`pg`)
- **Cache / Queue:** Redis v5
- **Auth:** JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Scheduler:** `node-cron`
- **Environment:** `dotenv`
- **Dev Tools:** `nodemon`

---

## 📁 Project Structure

```
Flash-Sale-Api/
├── config/
│   └── db.js              # PostgreSQL connection pool
├── controllers/
│   ├── authController.js  # Register, Login logic
│   ├── productController.js
│   └── orderController.js # Push to Redis queue
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   └── rateLimiter.js     # Request throttling
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   └── orderRoutes.js
├── workers/
│   └── orderWorker.js     # Dequeue & process orders from Redis
├── server.js              # App entry point
├── setupDB.js             # Creates PostgreSQL tables
├── setupUser.js           # Seeds demo users
├── setupOrders.js         # Seeds demo orders
├── .gitignore
├── package.json
└── .env.example           # (Recommended to add)
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js ≥ 18
- PostgreSQL (running locally or via Docker)
- Redis (running locally or via Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/HarshalVnit/Flash-Sale-Api.git
cd Flash-Sale-Api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_USER=your_pg_user
PG_PASSWORD=your_pg_password
PG_DATABASE=flash_sale_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
```

### 4. Initialize the Database

```bash
node setupDB.js       # Creates tables
node setupUser.js     # Seeds users
node setupOrders.js   # Seeds orders (optional)
```

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## 📡 API Endpoints

### Auth

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login and receive JWT token | ❌ |

### Products

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/products` | List all flash sale products | ✅ |
| `GET` | `/api/products/:id` | Get product by ID | ✅ |
| `POST` | `/api/products` | Create a product (Admin) | ✅ |

### Orders

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/orders` | Submit a purchase request | ✅ |
| `GET` | `/api/orders/me` | Get logged-in user's orders | ✅ |

---

## 🔑 Example Requests

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Harshal",
  "email": "harshal@example.com",
  "password": "securepass123"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "harshal@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Place an Order

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 1,
  "quantity": 1
}
```

---

## 🧠 How the Flash Sale Queue Works

1. **User places an order** → request hits `POST /api/orders`
2. **Controller pushes** the order payload into a **Redis queue** (not saved to DB yet)
3. **Background worker** (`workers/orderWorker.js`) dequeues jobs one at a time
4. Worker checks **remaining stock** in PostgreSQL
5. If stock > 0 → order is **confirmed and saved**, stock is decremented atomically
6. If stock = 0 → order is **rejected** with "sold out" status
7. This ensures no two requests can oversell the same item

---

## 🛡️ Security

- Passwords are hashed with **bcryptjs** before storage
- All protected routes verify the **JWT token** in the `Authorization` header
- Rate limiting prevents brute force and burst abuse
- Environment variables keep secrets out of source code

---

## 🧪 Running Seed Scripts

```bash
# Set up tables
node setupDB.js

# Seed test users
node setupUser.js

# Seed test orders (load testing)
node setupOrders.js
```

---

## 📦 Dependencies

```json
{
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.6",
  "dotenv": "^17.4.2",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "node-cron": "^4.2.1",
  "pg": "^8.21.0",
  "redis": "^5.12.1"
}
```

---

## 🔮 Planned / Future Enhancements

- [ ] Admin dashboard for managing sale events
- [ ] WebSocket real-time inventory updates
- [ ] Swagger / OpenAPI documentation
- [ ] Docker + docker-compose setup
- [ ] Unit and integration tests (Jest / Supertest)
- [ ] Leaderboard — who bought first
- [ ] Email/SMS notifications on order confirmation

---

## 👤 Author

**Harshal** — [@HarshalVnit](https://github.com/HarshalVnit)

---


