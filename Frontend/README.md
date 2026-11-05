# GitSummarizer frontend

The React and Vite frontend is deployed as a static site. It communicates with
the public GitSummarizer API and does not contain backend credentials.

## Local development

```bash
npm ci
```

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend API
base URL, including `/api/v1`. Start the Vite development server with:

```bash
npm run dev
```

## Production

Use Node.js 20.19+ or 22.12+. Set `VITE_API_BASE_URL` in the build
environment, run `npm ci` and `npm run build`, then publish the `dist`
directory. Configure the static host to rewrite unknown routes to
`index.html` for React Router.

See the root [deployment guide](../README.md#deployment) for backend and
database setup.
