# GitSummarizer

GitSummarizer is a full-stack project for understanding unfamiliar GitHub repositories faster. It combines GitHub metadata, repository file inspection, language and framework detection, and AI-generated summaries to help developers quickly evaluate a codebase before they dive in.

## Overview

When you open a new repository, the biggest challenge is usually not understanding the business logic — it's figuring out the project structure, stack, and conventions. GitSummarizer makes that easier by:

- fetching repository metadata from GitHub
- analyzing the selected codebase and file structure
- identifying languages, frameworks, and technologies
- generating a concise AI summary of what the project does
- persisting results so users can revisit and compare analyses later

## Features

- GitHub repository URL analysis
- Repository metadata retrieval
- Source file selection and retrieval
- Static analysis for languages and technologies
- AI-powered repository summary generation
- Saved repositories and dashboard workflow
- Analysis history and results pages
- Google OAuth sign-in for saved analyses
- JSON export of analysis results
- PDF-style export via browser print

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS v4
- React Router DOM
- React Markdown

### Backend
- Node.js
- Express.js
- PostgreSQL
- pg
- Octokit
- OpenAI-compatible AI integration
- Google OAuth

## Architecture

```text
Developer
   |
   v
Frontend (React + Vite)
   |
   | REST API
   v
Backend (Express + Node.js)
   |\
   | \__ GitHub API
   | \__ AI provider / Ollama
   |
   v
PostgreSQL
   |
   +--> repositories
   +--> analyses
   +--> users / auth sessions
```

## Repository Structure

```text
GitSummarizer/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── migrations/
│   ├── scripts/
│   ├── package.json
│   └── .env.example
├── Frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── .gitignore
└── README.md
```

## Typical Workflow

1. User submits a GitHub repository URL.
2. The backend validates and fetches metadata from GitHub.
3. The repository is stored or updated in PostgreSQL.
4. An analysis record is created.
5. Files are selected and retrieved for inspection.
6. Static analysis identifies technologies and stack details.
7. AI generates a summary of the repository.
8. Results are stored and displayed in the frontend.
9. Signed-in users can revisit past analyses from their dashboard.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL
- Git
- GitHub access token
- AI provider connection (OpenAI-compatible API or local Ollama instance)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/GitSummarizer.git
cd GitSummarizer
```

### 2. Set Up the Backend

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/` based on the app's required configuration. At minimum, set values for PostgreSQL, GitHub, and OAuth settings.

Example configuration:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gitsummarizer
DB_USER=postgres
DB_PASSWORD=your-password

GITHUB_TOKEN=your_github_token
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_TIMEOUT=300000

DEV_USER_ID=your-existing-user-id
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

Create the database tables and run migrations:

```bash
npm run db:migrate
```

Start the backend:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:5000
```

### 3. Set Up the Frontend

Open a second terminal and run:

```bash
cd Frontend
npm install
```

Create a `.env` file in `Frontend/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend:

```bash
npm run dev
```

The app will be available at:

```text
http://localhost:5173
```

## API Highlights

The backend exposes the API under `http://localhost:5000/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check whether the API and database are healthy |
| GET | `/auth/google` | Start Google OAuth sign-in |
| GET | `/auth/me` | Get the active signed-in user |
| POST | `/auth/logout` | Sign out the current user |
| POST | `/analyses` | Analyze a repository URL |
| POST | `/repositories` | Create or register a repository |
| GET | `/repositories` | Get saved repositories for the authenticated user |
| GET | `/repositories/:id` | Get a repository by ID |
| PATCH | `/repositories/:id/save` | Save an existing repository to the user's dashboard |
| POST | `/repositories/:id/analyze` | Trigger analysis for a repository |
| GET | `/repositories/:id/analyses` | List repository analyses |
| GET | `/analyses/:analysisId` | Retrieve one saved analysis |

## Database

GitSummarizer uses PostgreSQL to persist:

- user records
- authenticated sessions
- repository metadata
- analysis records
- JSON analysis output

## Security Notes

- Keep API tokens and secret values in local `.env` files.
- Do not expose credentials in frontend code.
- Use HTTPS and proper CORS settings in production.
- OAuth sessions are stored with secure cookie settings.

## Future Improvements

- architecture visualizations
- deeper dependency analysis
- richer quality and maintainability insights
- CI/CD automation
- cloud deployment support

## Author

Sajid

GitHub: https://github.com/thazbi

---

*GitSummarizer — Understand repositories faster with AI-powered insights.*
