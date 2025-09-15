#!/bin/bash
set -e

# Name of your postgres container
POSTGRES_CONTAINER="postgres_db"

# Test DB connection string (docker host is "postgres")
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flash_sale_test"


echo "🚀 Creating test database (if not exists)..."
docker exec -i $POSTGRES_CONTAINER psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'flash_sale_test'" | grep -q 1 || \
  docker exec -i $POSTGRES_CONTAINER psql -U postgres -c "CREATE DATABASE flash_sale_test;"

echo "🛠 Applying migrations to test DB..."
# Important: use DATABASE_URL for migrations too
DATABASE_URL=$TEST_DATABASE_URL pnpm prisma migrate deploy --schema=./prisma/schema.prisma

echo "🧪 Running tests..."
# Run Jest with the test DB
pnpm cross-env DATABASE_URL=$TEST_DATABASE_URL pnpm jest --detectOpenHandles
