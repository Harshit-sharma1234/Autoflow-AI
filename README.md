# AutoFlow AI

A full-stack GenAI-powered automation platform that enables users to upload documents, process them with AI, and execute automated workflows.

## 🚀 Features

- **Document Processing**: Upload text or PDF documents for AI analysis
- **AI Pipeline**: Structured JSON outputs with retry logic and logging
- **Workflow Engine**: Trigger → AI Step → Action (email, webhook, save data)
- **Real-time Dashboard**: View job status, history, logs, and outputs
- **Background Workers**: Async processing with BullMQ

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                     API Layer (Express)                      │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Auth Service │ AI Service   │ Workflow Svc │ Run Orchestrator│
├──────────────┴──────────────┴──────────────┴────────────────┤
│              Worker Layer (BullMQ + Redis)                   │
├─────────────────────────────────────────────────────────────┤
│              Data Layer (MongoDB + S3)                       │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
autoflow-ai/
├── apps/
│   ├── api/          # Backend Express API
│   └── web/          # Frontend Next.js App
├── packages/
│   └── shared/       # Shared types & utilities
├── docs/             # Documentation
└── docker-compose.yml
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose |
| Queue | Redis + BullMQ |
| AI | OpenAI / Google Gemini |
| File Storage | AWS S3 / Cloudinary |

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for local services)

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd autoflow-ai
   pnpm install
   ```

2. **Start local services (MongoDB, Redis)**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment variables**
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   # Edit the .env files with your API keys
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```

   - API: http://localhost:4000
   - Web: http://localhost:3000
   - Mongo Express: http://localhost:8082
   - Redis Commander: http://localhost:8081

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm dev:api` | Start backend only |
| `pnpm dev:web` | Start frontend only |
| `pnpm build` | Build all apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code with Prettier |

## 🔐 Environment Variables

### Backend (apps/api/.env)

```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://admin:password@localhost:27017/autoflow?authSource=admin
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key
OPENAI_API_KEY=sk-...
```

### Frontend (apps/web/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## 📚 Documentation

See the [docs](./docs) folder for detailed documentation:

- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)
- [API Documentation](./docs/API.md) (coming soon)
- [Deployment Guide](./docs/DEPLOYMENT.md) (coming soon)

## 📄 License

MIT
