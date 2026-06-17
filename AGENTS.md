# Chat App - Development Guide

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Docker)
- npm

### Local Development (without Docker)

1. **Start MongoDB**:
   ```bash
   # Using Docker (recommended)
   docker run -d -p 27017:27017 --name mongodb mongo:6

   # Or use local MongoDB service
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Seed the database** (optional - creates demo users):
   ```bash
   npm run seed
   ```

4. **Run both backend and frontend**:
   ```bash
   npm run dev
   ```

   This starts:
   - Backend at http://localhost:5000
   - Frontend at http://localhost:5173

### Docker Development

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Demo Accounts
After running seed:
- Email: `demo@example.com` / Password: `password123`
- Email: `jane@example.com` / Password: `password123`

## Project Structure

```
chat-app/
├── backend/          # Node.js + Express + Socket.IO
│   └── src/
│       ├── config/      # Configuration
│       ├── controllers/ # Route handlers
│       ├── middleware/   # Auth, upload
│       ├── models/      # Mongoose schemas
│       ├── routes/      # Express routes
│       └── socket/      # Socket.IO handlers
├── frontend/         # React + Vite + Tailwind
│   └── src/
│       ├── context/     # Socket context
│       ├── pages/       # Login, Home
│       ├── services/    # API service layer
│       └── store/       # Zustand stores
└── docker-compose.yml  # Production deployment
```
