# Flash Sale System

## Simple System Arch is in image format located the root dir named 'System-Arch.png'

## Design Choices & Trade-offs is in separate file named 'system-overview.md'

## Installation

### 1. Clone the project repository from git hub.

```bash
git clone https://github.com/mikelcop-condebender/flash-sale-system.git

```

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
