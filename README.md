# CRUD API - User Management

A RESTful CRUD API built with Node.js and TypeScript for managing user records with horizontal scaling support.

## Features

- ✅ Full CRUD operations for users
- ✅ UUID-based user identification
- ✅ Input validation
- ✅ Error handling with appropriate HTTP status codes
- ✅ TypeScript for type safety
- ✅ Development and production modes
- ✅ In-memory database with shared state across workers
- ✅ Horizontal scaling with Node.js Cluster API
- ✅ Load balancer with Round-robin algorithm
- ✅ Comprehensive test suite

## Prerequisites

- Node.js version 24.10.0 or higher

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Configure the PORT in `.env` file (default is 4000)

## Running the Application

### Development Mode

Run with auto-reload on file changes:

```bash
npm run start:dev
```

### Production Mode

Build and run the optimized version:

```bash
npm run start:prod
```

### Multi-Instance Mode (Horizontal Scaling)

Run with load balancer and multiple worker instances:

```bash
npm run start:multi
```

This mode starts:

- **Load Balancer** on `localhost:4000` (or your configured PORT)
- **Worker Instances** on `localhost:4001`, `localhost:4002`, `localhost:4003`, etc.
- Number of workers = CPU cores - 1

**How it works:**

1. Load balancer receives requests on port 4000
2. Requests are distributed to workers using Round-robin algorithm
3. All workers share the same database state via IPC (Inter-Process Communication)
4. If a worker crashes, it's automatically restarted

**Example with 4 CPU cores:**

```
Available parallelism: 4
Number of workers: 3

🚀 Load Balancer listening on port 4000
   ↓
   ├─ Worker 1 on port 4001
   ├─ Worker 2 on port 4002
   └─ Worker 3 on port 4003
```

**Request flow:**

```
User → localhost:4000 → Worker on 4001
User → localhost:4000 → Worker on 4002
User → localhost:4000 → Worker on 4003
User → localhost:4000 → Worker on 4001 (cycle repeats)
```

**Database consistency example:**

1. POST request to `localhost:4000` → routed to Worker 1 → creates user
2. GET request to `localhost:4000` → routed to Worker 2 → returns created user
3. DELETE request to `localhost:4000` → routed to Worker 3 → deletes user
4. GET request to `localhost:4000` → routed to Worker 1 → returns 404

### Other Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run test suite

## API Endpoints

Base URL: `http://localhost:{PORT}/api`

### Get All Users

```
GET /api/users
```

**Response:** `200 OK`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "John Doe",
    "age": 30,
    "hobbies": ["reading", "gaming"]
  }
]
```

### Get User by ID

```
GET /api/users/{userId}
```

**Responses:**

- `200 OK` - User found
- `400 Bad Request` - Invalid UUID
- `404 Not Found` - User doesn't exist

### Create User

```
POST /api/users
Content-Type: application/json
```

**Request Body:**

```json
{
  "username": "John Doe",
  "age": 30,
  "hobbies": ["reading", "gaming"]
}
```

**Responses:**

- `201 Created` - User created successfully
- `400 Bad Request` - Missing required fields or invalid data

### Update User

```
PUT /api/users/{userId}
Content-Type: application/json
```

**Request Body:**

```json
{
  "username": "Jane Doe",
  "age": 31,
  "hobbies": ["painting"]
}
```

**Responses:**

- `200 OK` - User updated successfully
- `400 Bad Request` - Invalid UUID
- `404 Not Found` - User doesn't exist

### Delete User

```
DELETE /api/users/{userId}
```

**Responses:**

- `204 No Content` - User deleted successfully
- `400 Bad Request` - Invalid UUID
- `404 Not Found` - User doesn't exist

## User Object Schema

```typescript
{
  id: string;        // UUID v4, generated automatically
  username: string;  // Required
  age: number;       // Required
  hobbies: string[]; // Required (can be empty array)
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (invalid input)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes:

- ✅ Complete CRUD cycle testing
- ✅ Multiple users management
- ✅ Error handling and validation
- ✅ Partial updates
- ✅ Invalid UUID handling
- ✅ Non-existent resource handling

## Architecture

### Single Instance Mode

```
Client → HTTP Server → Router → Controller → Service → Database
```

### Multi-Instance Mode

```
Client → Load Balancer (Round-robin)
           ↓
       Worker 1 → Service → IPC → Master Process (Database)
       Worker 2 → Service → IPC → Master Process (Database)
       Worker 3 → Service → IPC → Master Process (Database)
```

**Key Components:**

- **Load Balancer**: Distributes incoming requests across workers
- **Workers**: Handle HTTP requests independently
- **IPC (Inter-Process Communication)**: Synchronizes database state
- **Master Process**: Maintains shared database state

## Technologies Used

- **Node.js** (v24.x.x) - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Node.js Cluster API** - Multi-process management
- **uuid** - UUID generation and validation
- **dotenv** - Environment variable management
- **Webpack** - Module bundler
- **Jest** - Testing framework
- **ts-node** - TypeScript execution

## Performance Benefits

Running in multi-instance mode provides:

- ✅ Better CPU utilization (uses all available cores)
- ✅ Improved throughput under high load
- ✅ Fault tolerance (automatic worker restart)
- ✅ Zero-downtime potential for updates

## Testing the API

### Using Fetch API (Browser Console)

**Create a user:**

```javascript
fetch("http://localhost:4000/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "john_doe",
    age: 25,
    hobbies: ["reading", "gaming"],
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

**Get all users:**

```javascript
fetch("http://localhost:4000/api/users")
  .then((r) => r.json())
  .then(console.log);
```

**Update a user:**

```javascript
fetch("http://localhost:4000/api/users/{userId}", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "jane_doe",
    age: 26,
    hobbies: ["painting", "gaming"],
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

**Delete a user:**

```javascript
fetch("http://localhost:4000/api/users/{userId}", {
  method: "DELETE",
}).then((r) => console.log(r.status)); // 204
```

### Using cURL

**Create a user:**

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","age":25,"hobbies":["reading","gaming"]}'
```

**Get all users:**

```bash
curl http://localhost:4000/api/users
```

**Get user by ID:**

```bash
curl http://localhost:4000/api/users/{userId}
```

**Update a user:**

```bash
curl -X PUT http://localhost:4000/api/users/{userId} \
  -H "Content-Type: application/json" \
  -d '{"username":"jane_doe","age":26,"hobbies":["painting"]}'
```

**Delete a user:**

```bash
curl -X DELETE http://localhost:4000/api/users/{userId}
```

## Project Structure

```
CRUD_API/
├── src/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── db/              # Database layer
│   ├── routes/          # Route definitions
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── tests/           # Test files
│   ├── cluster.ts       # Cluster/multi-instance setup
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript
├── .env                 # Environment variables
├── package.json
├── tsconfig.json
├── webpack.config.js
├── jest.config.js
└── README.md
```

## License

ISC

## Author

Vladimir Solo

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
