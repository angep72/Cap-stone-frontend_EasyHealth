EasyHealth Frontend
===================

React + TypeScript single-page application for the EasyHealth platform, built with Vite and Tailwind CSS.

---

Prerequisites
-------------

- **Node.js** 18 LTS or 20 LTS  
  Check with `node -v`
- **npm** 9+  
  Check with `npm -v`
- Backend API running locally (defaults to `http://localhost:5000/api`)

> The frontend expects the backend to expose MongoDB-backed endpoints (see `/backend`). Start the API before logging in from the UI.

---

1. Clone & install
------------------

```bash
git clone <your fork or repo url>
cd draftfronted/project
npm install
```

`npm install` pulls the React, Tailwind, Vite, and linting dependencies declared in `package.json`.

---

2. Environment variables
------------------------

Create a `.env` file in `project/` (same folder as `package.json`):

```bash
cp .env.example .env   # if a template exists
```

If there is no template, create it manually:

```env
VITE_API_URL=http://localhost:5000/api
```

| Variable       | Description                                         |
| -------------- | --------------------------------------------------- |
| `VITE_API_URL` | Base URL for the backend API used by `src/lib/api.ts` |

> Any change to `.env` requires restarting the Vite dev server.

---

3. Development server
---------------------

```bash
npm run dev
```

- Vite serves the SPA at <http://localhost:5173>
- Hot Module Replacement updates the browser as you edit files
- API requests are sent to `VITE_API_URL`

To auto-open the browser: `npm run dev -- --open`

---

4. Available scripts
--------------------

| Command             | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Start Vite development server with HMR                           |
| `npm run build`     | Create optimized production build in `dist/`                     |
| `npm run preview`   | Preview the production bundle locally                            |
| `npm run lint`      | Run ESLint (configured via `eslint.config.js`)                   |
| `npm run typecheck` | TypeScript project check (`tsconfig.app.json`, no emit)          |

Build + preview combo:

```bash
npm run build
npm run preview   # served at http://localhost:4173 by default
```

---

5. Project layout
-----------------

```
project/
├─ src/
│  ├─ components/     # Reusable UI and dashboard widgets
│  ├─ contexts/       # React context providers (AuthContext)
│  ├─ lib/            # API client and helpers (MongoDB endpoints)
│  ├─ pages/          # Role-based dashboard screens
│  ├─ index.css       # Tailwind entry point
│  └─ main.tsx        # React entry point
├─ public/ (implicit) # Served assets (via Vite)
├─ tailwind.config.js # Tailwind setup
├─ postcss.config.js  # PostCSS pipeline
├─ vite.config.ts     # Vite configuration
└─ tsconfig*.json     # TypeScript configs
```

---

6. Working with Tailwind CSS
----------------------------

- Utility classes are available globally via `src/index.css`.
- To add custom styles, extend the Tailwind config (`tailwind.config.js`).
- IntelliSense: install the Tailwind CSS VS Code extension for autocomplete.

---

7. Troubleshooting
------------------

| Problem                                      | Fix / Notes                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| `ERR_NETWORK` when calling the API           | Ensure backend is running and `VITE_API_URL` is correct                     |
| Auth requests return 401                     | Clear localStorage token or log in again                                    |
| Tailwind classes not applying                | Make sure files are covered by `content` globs in `tailwind.config.js`      |
| `npm run dev` throws port-in-use error       | Stop the previous Vite instance or run `npm run dev -- --port 5174`         |
| Type errors after pulling changes            | Run `npm install` and `npm run typecheck`                                   |

Logs are printed to the browser console and terminal (especially for data loading states). Use them to confirm API responses.

---

8. Production build & deployment
--------------------------------

1. Build the optimized bundle:

   ```bash
   npm run build
   ```

2. Serve the `dist/` folder with any static host (Vercel, Netlify, Nginx, S3 + CloudFront, etc.).

3. Set `VITE_API_URL` (or host-specific environment variable) to point at your production backend before building.

For containerized deployments, copy the `dist/` directory into a lightweight web server image (e.g., `nginx:alpine`).

---

Backend Deployed version: https://easy-health-backend.onrender.com/api/
--
Link to Frontend deployed version : https://cap-stone-frontend-easyhealth.
onrender.com/
--
9. Useful references
--------------------

- Vite docs: <https://vitejs.dev/guide/>
- React docs: <https://react.dev/>
- Tailwind CSS docs: <https://tailwindcss.com/docs>
- Recharts docs (if you re-enable analytics): <https://recharts.org/en-US/>


