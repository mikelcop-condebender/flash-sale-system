# Flash Sale System

A high-throughput flash sale platform built with **Node.js (Express)**, **PostgreSQL (Prisma)**, **Redis**, and **Next.js**.  
This system is designed to handle massive concurrent requests during flash sales, ensuring **fairness**, **scalability**, and **performance**.

---

## Tech Stack

- **Backend**: Node.js, Express, Prisma, Redis
- **Frontend**: Next.js, React, TailwindCSS
- **Database**: PostgreSQL
- **Cache & Queue**: Redis
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest, Supertest, Artillery (stress tests)

---

## Installation

### 1. Assuming you already extracted the file in 'fs-system' folder and your inside of it.

### 2. Start Services with Docker

Make sure you have **Docker** and **Docker Compose** installed.

# run this command to setup and initialize backend, frontend, postgres and redis

```bash
docker compose up --build
```

# This will start:

- PostgreSQL (port **5432**)
- Redis (port **6379**)
- Backend API (port **4000**)
- Frontend (port **3000**)

# To stop:

```bash
docker compose down
```

### If you want individual setup

## Backend Setup

### Install dependencies

```bash
cd backend
pnpm install
```

### Setup Database

Generate Prisma client and apply migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

(Optional) Seed the database:

```bash
pnpm db:seed
```

### Run Backend

```bash
pnpm dev
```

Server will start on [http://localhost:4000](http://localhost:4000)

---

## Frontend Setup

### Install dependencies

```bash
cd frontend
pnpm install
```

### Run Frontend

```bash
pnpm dev
```

Frontend runs on [http://localhost:3000](http://localhost:3000)

---

## Testing

### Unit & Integration Tests

# Go to 'backend folder'

# uncomment this line in .env befor running the test.

# TEST_REDIS_URL="redis://localhost:6379"

```bash
pnpm test
```

### Stress Test

# make application is running before doing the test.

# run the application bye 'docker compose up --build' before running the test

Simulate high concurrency with **Artillery**:

```bash
cd backend
pnpm test:stress
```

---

## Useful Commands

| Command            | Description                  |
| ------------------ | ---------------------------- |
| `pnpm dev`         | Run backend in dev mode      |
| `pnpm build`       | Build backend                |
| `pnpm start`       | Start backend (after build)  |
| `pnpm test`        | Run Unit test                |
| `pnpm test:stress` | Run stress test(after build) |
| `pnpm db:migrate`  | Run Prisma migrations        |
| `pnpm docker:up`   | Start all services in Docker |
| `pnpm docker:down` | Stop all services            |

---

## 📌 Environment Variables

### Backend `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/flashdb"
REDIS_URL="redis://redis:6379"
PORT=4000
```

### Frontend `.env`

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

---

## ✅ Example API Endpoints

- `GET /api/sale/status/:id` → Check flash sale status
- `POST /api/sale/purchase` → Attempt purchase
- `GET /api/health` or `GET /api/health` → Health check

## Trying in Postman.

postman collection is available in 'postman-collection' folder.
