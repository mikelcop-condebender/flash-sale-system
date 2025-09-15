# Flash Sale System

## Tech Stack

- **Backend**: Node.js, Express, Prisma, Redis
- **Frontend**: Next.js, React, TailwindCSS
- **Database**: PostgreSQL
- **Cache & Queue**: Redis
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest, Supertest, Artillery (stress tests)

---

## Design Choices & Trade-offs

1. Database Design

PostgreSQL with Prisma: Chosen for ACID properties and excellent concurrent transaction support
Row-level locking: Prevents race conditions during inventory updates
Atomic transactions: Ensures data consistency during purchase operations

2. Caching Strategy

Redis for session management: Fast user session lookup
In-memory cache for sale status: Reduces database load for frequent status checks
Distributed locking: Prevents duplicate purchases across multiple server instances

3. Concurrency Control

Database-level optimistic locking: Using row versioning for inventory updates
Application-level queue system: Serializes critical purchase operations
Rate limiting: Prevents abuse and reduces system load

4. Scalability Considerations

Stateless API design: Enables horizontal scaling
Connection pooling: Efficient database connection management
Queue-based processing: Handles traffic spikes gracefully

5. Performance Optimizations

Database indexes: Optimized queries for user lookups and inventory checks
Prepared statements: Faster SQL execution
Bulk operations: Efficient data processing where applicable
