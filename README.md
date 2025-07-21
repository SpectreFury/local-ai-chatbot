# Local AI Chatbot

A ChatGPT-style interface for local AI chat using Ollama, built with Next.js, Express.js, and Prisma.

## Features

-  Real-time streaming AI responses
-  Chat persistence with database storage using Postgres
- ️ Rename and delete chat functionality - BONUS
- ️ Stop streaming responses
-  Retry failed messages - BONUS
-  Context-aware conversations

## Tech Stack

- **Frontend**: Next.js 15.4.2, React 19.1.0, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL (Neon or local)
- **AI**: Ollama with Gemma 3 1B model

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (local or Neon)
- Ollama installed locally

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/SpectreFury/local-ai-chatbot.git
cd local-ai-chatbot
```

### 2. Backend Setup

```bash
cd server
npm install
```

#### Environment Configuration

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/chatbot_db"
# Or for Neon:
# DATABASE_URL="postgresql://username:password@host.neon.tech/dbname?sslmode=require"

OLLAMA_MODEL="gemma3:1b"
PORT=5000
```

#### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

#### Start Backend Server

```bash
npm start
# or with nodemon for development
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client
npm install
# or if using bun
bun install
```

#### Environment Configuration

Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Start Frontend Server

```bash
npm run dev
# or if using bun
bun dev
```

The frontend will run on `http://localhost:3000`

### 4. Ollama Setup

#### Install Ollama

**macOS:**
```bash
brew install ollama
```


```bash
ollama serve
```

#### Pull the Model

```bash
ollama pull gemma3:1b
```

## API Routes

### Chat Management

#### Get All Chats
```http
GET /api/chats
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chat_id",
      "title": "Chat Title",
      "timestamp": "2 hours ago",
      "messages": []
    }
  ],
  "message": "Chats retrieved successfully"
}
```

#### Get Specific Chat
```http
GET /api/chats/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chat_id",
    "title": "Chat Title",
    "timestamp": "2 hours ago",
    "messages": [
      {
        "id": "msg_id",
        "role": "user",
        "content": "Hello",
        "timestamp": "2:30 PM"
      }
    ]
  },
  "message": "Chat retrieved successfully"
}
```

#### Create New Chat
```http
POST /api/chats
Content-Type: application/json

{
  "title": "New Chat Title"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_chat_id",
    "title": "New Chat Title",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:00:00.000Z"
  },
  "message": "Chat created successfully"
}
```

#### Update Chat Title
```http
PUT /api/chats/:id
Content-Type: application/json

{
  "title": "Updated Chat Title"
}
```

#### Delete Chat
```http
DELETE /api/chats/:id
```

### Message Management

#### Send Message (Streaming)
```http
POST /api/chats/:chatId/messages
Content-Type: application/json

{
  "content": "Your message here",
  "role": "user"
}
```

**Response:** Streaming text response with headers:
- `Content-Type: text/plain; charset=utf-8`
- `X-Stream-Id: chat_id-timestamp` (for stopping streams)

#### Stop Stream
```http
POST /api/chats/:chatId/stop
Content-Type: application/json

{
  "streamId": "chat_id-timestamp"
}
```

## Database Schema

### Chat Table
```sql
model Chat {
  id        String   @id @default(cuid())
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}
```

### Message Table
```sql
model Message {
  id        String   @id @default(cuid())
  content   String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
}

enum Role {
  USER
  ASSISTANT
}
```

## Project Structure

```
local-ai-chatbot/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # API and utilities
│   │   ├── stores/        # Zustand state management
│   │   ├── types/         # TypeScript types
│   │   └── chat/[chatId]/ # Dynamic chat routes
│   └── package.json
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── handlers/      # Route handlers
│   │   ├── routes/        # Express routes
│   │   ├── db/           # Database configuration
│   │   └── index.js      # Server entry point
│   ├── prisma/           # Database schema and migrations
│   └── package.json
└── README.md
```

## Usage

1. Start all services (Ollama, Backend, Frontend)
2. Navigate to `http://localhost:3000`
3. Click "New Chat" to create a conversation
4. Type your message and press Enter
5. Watch the AI response stream in real-time
6. Use the stop button to halt streaming
7. Right-click on chats to rename or delete them
8. Failed messages will show a retry button

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env
- Run `npx prisma generate` and `npx prisma migrate dev`

**AI responses not working:**
- Ensure Ollama service is running: `ollama serve`
- Verify the model is installed: `ollama list`
- Check OLLAMA_MODEL in .env matches installed model

