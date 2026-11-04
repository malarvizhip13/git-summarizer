
# GitSummarizer

**AI-Powered GitHub Repository Analysis Platform**

GitSummarizer is a full-stack application that analyzes GitHub repositories and generates structured insights about their codebase. It combines repository metadata, source-code analysis, file retrieval, and AI-generated summaries to help developers understand unfamiliar projects more efficiently.

## Overview

Understanding a new GitHub repository can be time-consuming, especially when it contains many files, dependencies, and different technologies.

GitSummarizer simplifies this process by retrieving repository information, analyzing selected source files, identifying programming languages and technologies, and generating an AI-powered explanation of the project.

The application also stores analysis results in PostgreSQL, allowing users to revisit previously completed analyses through analysis history and results pages.

## Features

- **GitHub Repository Analysis** – Analyze public GitHub repositories using their repository URLs.
- **Repository Metadata Retrieval** – Retrieve repository information, default branch, and source details.
- **Source File Retrieval** – Select and retrieve repository files for analysis.
- **Static Analysis** – Identify programming languages, frameworks, and technologies.
- **AI-Powered Repository Summary** – Generate an AI explanation of repository functionality and implementation.
- **Analysis Persistence** – Store completed analysis results in PostgreSQL.
- **Analysis History** – Access previous repository analyses.
- **Repository Dashboard** – Manage saved repositories and initiate analyses.
- **Detailed Results Page** – View AI summaries, language statistics, technologies, and retrieval details.
- **JSON Export** – Download analysis results as JSON.
- **Print / Save PDF** – Export analysis reports using browser print functionality.
- **Repository Saving** – Save analyzed repositories to the dashboard.
- **GitHub Sign-In** – Analyze public repositories without an account, then sign in or create an account when saving an analysis.

## Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- React Markdown
- JavaScript

### Backend
- Node.js
- Express.js
- PostgreSQL
- pg
- dotenv
- Helmet
- CORS

### Integrations
- GitHub REST API
- AI-powered repository summarization

## Architecture

```text
                  ┌──────────────────────┐
                  │      Developer      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   React Frontend    │
                  │   Vite Application  │
                  └──────────┬───────────┘
                             │ REST API
                             ▼
                  ┌──────────────────────┐
                  │   Express Backend   │
                  │   API Controllers   │
                  │   Service Layer     │
                  └──────┬────────┬──────┘
                         │        │
             ┌───────────┘        └────────────┐
             ▼                                 ▼
   ┌──────────────────┐              ┌──────────────────┐
   │  GitHub REST API│              │   AI Provider   │
   │ Repository Data │              │ AI Summarization │
   │ Source Files    │              └──────────────────┘
   └──────────────────┘
                         │
                         ▼
                ┌──────────────────────┐
                │    PostgreSQL       │
                │ Repositories        │
                │ Analyses            │
                │ Analysis Results    │
                └──────────────────────┘
```

## Project Structure

```text
GitSummarizer/
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── migrations/
│   ├── package.json
│   └── .env.example
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

## Analysis Workflow

1. The user submits a GitHub repository URL.
2. The backend validates the repository URL.
3. Repository metadata is retrieved from GitHub.
4. The repository is stored or updated in PostgreSQL.
5. An analysis record is created.
6. Source files are selected and retrieved.
7. Static analysis identifies languages and technologies.
8. AI generates a repository summary.
9. Analysis results and metadata are persisted.
10. The frontend displays the completed analysis to the visitor.
11. When a visitor saves it, Google sign-in creates or opens their account and the completed analysis is added to their private dashboard and history.
12. Signed-in users can revisit analysis history or export results.

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL
- Git
- GitHub account
- AI provider API credentials

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/GitSummarizer.git
cd GitSummarizer
```

### 2. Setup Backend

```bash
cd Backend
npm install
```

Create a `.env` file inside `Backend/` using `.env.example` as a reference.

Configure PostgreSQL and the required API credentials.

Run database migrations from `Backend/` with `npm run db:migrate`.

Create a Google OAuth client in Google Cloud Console. Add `http://localhost:5000/api/v1/auth/google/callback` as an authorized redirect URI. Set its client ID and secret in `Backend/.env` as `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`. Set `GOOGLE_OAUTH_CALLBACK_URL` and `FRONTEND_URL` to the matching URLs. `DEV_USER_ID` must identify an existing user row; it is used only to temporarily store analyses made before sign-in.

Start the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

### 3. Setup Frontend

Open another terminal:

```bash
cd Frontend
npm install
```

Create a `.env` file inside `Frontend/`.

Configure the backend API URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Environment Variables

### Backend

Use the following variables in `Backend/.env`:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/gitsummarizer

GITHUB_TOKEN=your_github_token
AI_API_KEY=your_ai_provider_api_key
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
DEV_USER_ID=your-existing-guest-user-uuid
```

> Environment variable names must match the actual configuration used by your backend. Never commit real credentials or API tokens.

## API Endpoints

Base URL:

```text
http://localhost:5000/api/v1
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API health |
| GET | `/auth/google` | Start Google sign-in |
| GET | `/auth/me` | Check the current sign-in |
| POST | `/auth/logout` | Sign out |
| POST | `/repositories` | Create or register repository |
| POST | `/repositories/save-analysis` | Save a guest analysis to the signed-in user's account |
| GET | `/repositories` | Retrieve saved repositories |
| GET | `/repositories/:repositoryId` | Retrieve repository details |
| POST | `/repositories/:repositoryId/analyze` | Analyze saved repository |
| GET | `/repositories/:repositoryId/analyses` | Retrieve repository analysis history |
| GET | `/analyses/:analysisId` | Retrieve a specific analysis |

Additional repository saving and analysis endpoints may be available depending on the current backend routes.

## Database

GitSummarizer uses PostgreSQL to persist repository information and analysis results.

### Main Tables

- `users` – User records.
- `repositories` – GitHub repository metadata and saved status.
- `analyses` – Analysis status, summaries, and persisted analysis results.
- `auth_sessions` – Hashed, expiring sessions for signed-in accounts.

Analysis results are stored using PostgreSQL JSONB for structured analysis data.

## Security Considerations

- GitHub and AI provider API tokens are stored in backend environment variables.
- API credentials are not intended to be exposed in frontend code.
- `.env` files are excluded from version control.
- Backend requests use configured CORS and security middleware.
- OAuth sessions use HttpOnly cookies; use HTTPS in production and configure the frontend and API origins for the same site where possible.

## Future Enhancements

- Repository architecture visualization.
- Advanced code dependency analysis.
- More detailed code quality insights.
- Improved AI analysis coverage.
- Cloud deployment.
- Automated testing and CI/CD integration.

## Author

**Sajid**

Information Technology | Software Development

GitHub: https://github.com/thazbi

---

*GitSummarizer — Understand repositories faster with AI-powered insights.*

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
