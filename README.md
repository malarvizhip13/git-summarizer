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
- Public repository analysis and history without sign-in
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
- NVIDIA NIM API integration

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
   | \__ NVIDIA NIM
   |
   v
PostgreSQL
   |
   +--> repositories
   +--> analyses
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
9. Anyone can revisit past analyses from the public history.

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL
- Git
- NVIDIA NIM API key
- Optional GitHub access token (recommended to increase API rate limits)

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

Create a `.env` file in `Backend/` based on the app's required configuration. At minimum, set values for PostgreSQL, GitHub, and the AI provider.

Example configuration:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gitsummarizer
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=false

GITHUB_TOKEN=
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b

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

Set `NVIDIA_API_KEY` before using AI summaries. Set `GITHUB_TOKEN` to avoid
the lower unauthenticated GitHub API rate limit. `DB_SSL=true` is commonly
required by hosted PostgreSQL providers.

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

## Deployment

Deploy the backend and frontend as separate services, and provision a
PostgreSQL database. Use Node.js 20.19+ or 22.12+ for both builds.

### Backend service

- Root directory: `Backend`
- Install command: `npm ci`
- Build command: not required
- Start command: `npm start`
- Health check path: `/api/v1/health`
- Release/pre-deploy command: `npm run db:migrate`

Configure these backend environment variables in the hosting provider:

- `NODE_ENV=production`
- `DATABASE_URL` using Render PostgreSQL's internal database URL, or the
  individual `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
  values
- `DB_SSL=true` (production defaults to SSL; keep this true for Render
  PostgreSQL)
- `NVIDIA_API_KEY`
- `FRONTEND_URL` set to the deployed frontend origin (scheme and host only)
- `PORT` if the platform does not provide it automatically
- `GITHUB_TOKEN` optionally, to increase GitHub API rate limits

### Frontend static site

- Root directory: `Frontend`
- Install command: `npm ci`
- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_BASE_URL` to the backend URL ending in `/api/v1`
- Configure the static host to rewrite unknown paths to `index.html` for
  React Router routes.

Run database migrations as a release step before serving requests. Never put
backend secrets such as `NVIDIA_API_KEY` or PostgreSQL credentials in frontend
environment variables.

## API Highlights

The backend exposes the API under `http://localhost:5000/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check whether the API and database are healthy |
| POST | `/analyses` | Analyze a repository URL |
| POST | `/repositories` | Create or register a repository |
| GET | `/repositories` | Get public repositories and analysis history |
| GET | `/repositories/:id` | Get a repository by ID |
| PATCH | `/repositories/:id/save` | Add a repository to the public repository list |
| POST | `/repositories/:id/analyze` | Trigger analysis for a repository |
| GET | `/repositories/:id/analyses` | List repository analyses |
| GET | `/analyses/:analysisId` | Retrieve one saved analysis |

## Database

GitSummarizer uses PostgreSQL to persist:

- a shared public repository owner
- repository metadata
- analysis records
- JSON analysis output

## Security Notes

- Keep API tokens and secret values in local `.env` files.
- Do not expose credentials in frontend code.
- Use HTTPS and proper CORS settings in production.

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
