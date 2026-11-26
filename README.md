# DocuMind – AI-Powered Document Assistant

> Upload PDFs, ask questions in plain English, and get AI-generated answers backed by **page-level citations** — powered by **Google Gemini** and **Retrieval-Augmented Generation (RAG)**.

---

## ✨ Features

| Feature | Detail |
|---|---|
| 🔐 Authentication | Secure HTTP-only cookie sessions, bcrypt password hashing |
| 📄 PDF Upload | Drag-and-drop, progress bar, 20 MB limit, PDF validation |
| 🤖 RAG Pipeline | Embedding → pgvector cosine search → Gemini generation |
| 💬 AI Chat | Context-aware Q&A with page-level source citations |
| 📝 Summaries | Short, detailed, and bullet-point summaries in one click |
| 🗂️ Chat History | Persistent conversations saved to PostgreSQL |
| 🌙 Dark mode | System-aware, toggleable |
| 📱 Responsive | Desktop, tablet, and mobile layouts |

---

## 🏗️ Architecture

```
documind/
├── client/           # React + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── pages/    # LandingPage, Login, Register, Dashboard, Documents, Chat
│       ├── components/  # Navbar, ProtectedRoute
│       ├── contexts/    # AuthContext (session management)
│       ├── services/    # Axios wrappers for each API group
│       └── types/       # Shared TypeScript interfaces
│
└── server/           # Express + TypeScript + Prisma
    ├── src/
    │   ├── routes/      # Auth, Documents, Conversations, Health
    │   ├── controllers/ # Business logic entry points
    │   ├── middleware/  # Auth, validation, error handler, upload
    │   ├── services/
    │   │   ├── documents/   # PDF extraction + text chunking
    │   │   ├── embeddings/  # Gemini embedding API
    │   │   ├── rag/         # RAG pipeline (retrieval + generation)
    │   │   └── ai/          # Document summarisation
    │   ├── validators/  # Zod schemas
    │   └── utils/       # Session tokens, response helpers, asyncHandler
    └── prisma/
        ├── schema.prisma   # Prisma schema (User, Document, Chunk, Conversation, Message)
        └── migrations/     # pgvector SQL migration
```

---

## 🔧 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v7, Axios, Lucide React
- **Backend**: Node.js, Express 4, TypeScript, Zod validation
- **Database**: PostgreSQL + pgvector (cosine similarity search)
- **ORM**: Prisma 6
- **AI**: Google Gemini API (`@google/genai`) — `gemini-2.0-flash` for chat, `text-embedding-004` for embeddings
- **Auth**: Custom HMAC-SHA256 session tokens, bcryptjs
- **File uploads**: Multer, pdf-parse

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL with the **pgvector** extension installed
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone & install

```bash
git clone https://github.com/your-username/documind.git
cd documind

# Install all workspace packages
npm install
```

### 2. Configure environment

```bash
# Copy the example file
cp .env.example server/.env

# Edit server/.env and fill in:
#   DATABASE_URL   – your PostgreSQL connection string
#   SESSION_SECRET – at least 32 random characters
#   GEMINI_API_KEY – your Gemini API key
```

### 3. Set up the database

```bash
# Enable pgvector (run once in your PostgreSQL instance)
psql -d your_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run Prisma migrations
npm run db:generate
npm run db:migrate
```

### 4. Start development servers

```bash
# Terminal 1 – backend (port 3001)
npm run dev:server

# Terminal 2 – frontend (port 5173)
npm run dev:client
```

Open **http://localhost:5173**

---

## 📡 API Reference

All routes are prefixed with `/api`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Log out |
| GET | `/auth/me` | Current user |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Upload PDF (`multipart/form-data`) |
| GET | `/documents` | List user's documents |
| GET | `/documents/:id` | Get document details |
| DELETE | `/documents/:id` | Delete document + all data |
| POST | `/documents/:id/summary` | Generate AI summary |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversations` | Create conversation |
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id` | Get conversation |
| DELETE | `/conversations/:id` | Delete conversation |
| GET | `/conversations/:id/messages` | Fetch messages |
| POST | `/conversations/:id/messages` | Send message (triggers RAG) |

---

## 🔄 RAG Pipeline

```
User question
      │
      ▼
Embed question (Gemini text-embedding-004)
      │
      ▼
pgvector cosine similarity search (top-5 chunks, threshold 0.65)
      │
      ▼
Build grounded prompt with retrieved context + page numbers
      │
      ▼
Gemini gemini-2.0-flash generates answer
      │
      ▼
Return answer + deduplicated page-level source citations
```

---

## 🌐 Deployment

### Backend – Render
1. Create a new **Web Service** pointing to the `server/` directory.
2. Build command: `npm run build`
3. Start command: `node dist/index.js`
4. Add all environment variables from `.env.example`.

### Frontend – Vercel
1. Import the repo and set **Root Directory** to `client/`.
2. Framework preset: **Vite**.
3. Set `VITE_API_URL` if the backend is on a different domain and update `vite.config.ts`.

### Database – Neon / Supabase / Railway
Use any managed PostgreSQL service that supports the **pgvector** extension.

---

## 🔒 Security Highlights

- Passwords hashed with bcrypt (12 rounds)
- Session tokens signed with HMAC-SHA256 and stored in HTTP-only cookies
- File content validated (MIME type + size)
- Parameterised queries via Prisma (no SQL injection)
- Helmet security headers
- Rate limiting on all routes (stricter on auth endpoints)
- CORS restricted to `CLIENT_URL`
- API keys never exposed to the frontend

---

## 📋 Development Phases

- [x] **Phase 1**: Project setup, monorepo, TypeScript, Prisma schema, Vite config
- [ ] **Phase 2**: Authentication (register, login, logout, session)
- [ ] **Phase 3**: PDF upload, text extraction, chunking
- [ ] **Phase 4**: Gemini integration, basic chat
- [ ] **Phase 5**: RAG pipeline, embeddings, pgvector search, citations
- [ ] **Phase 6**: Summaries, chat history, testing, deployment

---

## 📝 License

MIT

