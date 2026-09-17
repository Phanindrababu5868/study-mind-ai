# StudyMind AI

Upload a PDF, chat with it, and let AI turn it into flashcards, quizzes, and summaries. Built as a full-stack MERN app with a Google Gemini-powered study assistant and Cloudflare R2 for document storage.

## Features

- **Auth** — email/password registration and login, httpOnly-cookie sessions (JWT stored in a secure cookie, not localStorage — not readable by JS, so it isn't an XSS exfiltration target)
- **Document upload** — PDF upload with text extraction and chunking, stored in Cloudflare R2 (S3-compatible object storage), served back only via short-lived signed URLs after an ownership check
- **AI chat** — ask questions about an uploaded document, with conversation history per document
- **AI-generated flashcards** — spaced-repetition style review, starring, per-document sets
- **AI-generated quizzes** — configurable question count, scoring, and results history
- **AI summaries & concept explanations**
- **Progress dashboard** — overview of documents, flashcards, and quiz activity
- **Pagination** — on documents, flashcard sets, and quizzes lists

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, Redux Toolkit, React Router, Axios |
| Backend | Node.js, Express 5, MongoDB + Mongoose |
| AI | Google Gemini (`@google/genai`) |
| Storage | Cloudflare R2 (S3-compatible, via `@aws-sdk/client-s3`) |
| Auth | JWT in an httpOnly cookie, bcrypt password hashing |
| PDF parsing | `pdf-parse` |

## Project structure

```
study-mind-ai/
├── backend/
│   ├── config/          # DB connection, multer, Cloudflare R2 client
│   ├── controllers/      # Route handlers (auth, documents, ai, flashcards, quizzes, progress)
│   ├── middleware/        # Auth guard, rate limiting, error handler
│   ├── models/            # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── utils/              # PDF parsing, text chunking, pagination, R2 storage helpers
│   └── server.js
└── frontend/
    └── src/
        ├── components/     # Reusable UI (documents, flashcards, quizzes, chat, common)
        ├── pages/           # Route-level pages (Auth, Dashboard, Documents, Flashcards, Quizzes, Profile)
        ├── services/         # Axios API wrappers per resource
        ├── store/             # Redux slices
        └── utils/              # Axios instance, API paths, cookie helpers
```

## Prerequisites

- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Google Gemini API key](https://aistudio.google.com/apikey)
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket (free tier: 10 GB storage, no egress fees)

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd study-mind-ai
cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend environment

Copy `backend/.env.example` to `backend/.env` and fill in every value:

| Variable | Description |
|---|---|
| `PORT` | Backend port (default `8000`) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Frontend origin, for CORS (e.g. `http://localhost:5173`) |
| `MONGODB_URL` | MongoDB connection string |
| `JWT_SECRET` | Long random string for signing auth tokens |
| `JWT_EXPIRY` | Token lifetime (e.g. `7d`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Gemini model name (e.g. `gemini-2.5-flash-lite`) |
| `MAX_FILE_SIZE` | Max upload size in bytes (default 10 MB) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Your R2 bucket name |

**Getting R2 credentials:** Cloudflare dashboard → R2 Object Storage → create a bucket → Manage API Tokens → create a token with Object Read & Write scoped to that bucket. The Account ID is shown on the R2 overview page.

### 3. Frontend environment

Create `frontend/.env`:

```
VITE_BASE_URL=http://localhost:8000
```

### 4. Run it

```bash
# backend
cd backend && npm run dev

# frontend (separate terminal)
cd frontend && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:8000`.

## API overview

All routes below (except `/auth/register`, `/auth/login`, `/auth/logout`) require the auth cookie set by login.

| Resource | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET/PUT /api/auth/profile`, `POST /api/auth/change-password` |
| Documents | `POST /api/documents/upload`, `GET /api/documents`, `GET/PUT/DELETE /api/documents/:id` |
| AI | `POST /api/ai/generate-flashcards`, `POST /api/ai/generate-quiz`, `POST /api/ai/generate-summary`, `POST /api/ai/chat`, `POST /api/ai/explain-concept`, `GET /api/ai/chat-history/:documentId` |
| Flashcards | `GET /api/flashcards`, `GET /api/flashcards/:documentId`, `POST /api/flashcards/:cardId/review`, `PUT /api/flashcards/:cardId/star`, `DELETE /api/flashcards/:id` |
| Quizzes | `GET /api/quizzes/:documentId`, `GET /api/quizzes/quiz/:id`, `POST /api/quizzes/:id/submit`, `GET /api/quizzes/:id/results`, `DELETE /api/quizzes/:id` |
| Progress | `GET /api/progress/dashboard` |

Document, flashcard-set, and quiz list endpoints accept `?page=&limit=` query params and return a `pagination` object (`page`, `limit`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`) alongside `data`.

## Security notes

- Uploaded PDFs are never written to the server's disk — they're buffered in memory and streamed straight to R2.
- Downloads go through a signed URL that (a) is only issued after checking the requesting user owns the document, and (b) expires after 5 minutes.
- Auth tokens live in an httpOnly cookie, not localStorage.
- Rate limiting is applied to `/api` generally and more tightly to `/api/auth`.

## Scripts

| Location | Command | Description |
|---|---|---|
| `backend` | `npm run dev` | Start backend with nodemon (auto-restart) |
| `backend` | `npm start` | Start backend for production |
| `frontend` | `npm run dev` | Start Vite dev server |
| `frontend` | `npm run build` | Production build |
| `frontend` | `npm run preview` | Preview the production build locally |

## License

ISC
