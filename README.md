# Project Review: Web app

Next.js 16 (App Router) front end for the Project Review platform. See the [root README](../README.md) for full setup and [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for design.

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm install
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Structure

```
src/
├── app/              Routes: /login  /signup  /submit (student)  /dashboard (mentor)
├── components/       app-shell, status-badge, reject-dialog, form-field
│   └── ui/           shadcn/ui primitives (Base UI + Tailwind), add more with `npx shadcn add <name>`
├── lib/
│   ├── api.ts        The only fetch wrapper: cookies, error shape, network errors
│   ├── types.ts      Types mirroring the API responses
│   └── validation.ts zod schemas (mirror server rules) + react-hook-form resolver
└── proxy.ts          Optimistic role-based redirects (Next 16's middleware)
```

## Conventions

- All server communication goes through `lib/api.ts`. Never call `fetch` directly in components.
- Keep client validation in sync with `backend/src/app/modules/*/*.validation.ts`. The server is authoritative.
- Protected pages are wrapped in `<AppShell audience="student" | "mentor">`.
- Dashboard filters, search and pagination are server-side. Pass parameters to the API; do not filter arrays in the browser.
