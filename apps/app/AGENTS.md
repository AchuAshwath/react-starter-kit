Client-side SPA — no SSR. All rendering happens in the browser.

## Routing

- File-based routing in `routes/`. `lib/routeTree.gen.ts` is auto-generated — never edit it.
- Route groups: `(app)/` = protected, `(auth)/` = public. Parentheses don't affect URLs.
- `route.tsx` in a group = layout with shared `beforeLoad`; individual files for pages.

## Authentication

- Session state via `useSessionQuery()` from `lib/queries/session.ts`. NEVER use `auth.useSession()` — TanStack Query provides caching, multi-tab sync, and consistency.
- Auth guard in `beforeLoad`, not in components. Uses cache-first (`getCachedSession()`), then `fetchQuery()`.
- Must validate both `user` AND `session` (not just one).
- After login: call `revalidateSession(queryClient, router)` — removes cache + invalidates router so `beforeLoad` fetches fresh data, then navigate.
- Safe redirects: use `getSafeRedirectUrl()` for `returnTo` search params (prevents open redirects).
- `signOut(queryClient)` clears server session, invalidates cache, redirects to `/login`.

## tRPC Client

- `credentials: "include"` for cookie-based auth, batched via `httpBatchLink`.
- API URL: `${import.meta.env.VITE_API_URL || "/api"}/trpc`.
- Uses `createTRPCOptionsProxy()` for TanStack Query integration.

## Components

- Named exports, functional only. shadcn/ui from `@repo/ui`.
- Navigation: `<Link>` from TanStack Router with `activeProps` for active styling. Never use `<a>` for internal routes.
- Route context: `Route.useSearch()` for search params, `Route.useRouteContext()` for route data.
- Jotai store available for cross-route UI state (modals, sidebar).

## Theming

- `<html>` is written by exactly two things: the inline script in `index.html` (pre-paint) and `<ThemeSync />` in `lib/theme.tsx` (everything after). Read via `useTheme()`; never toggle the class from a component.
- `preference` is what the user chose (`light` | `dark` | `system`); `theme` is the resolved value (`light` | `dark`) and is derived, never stored.
- Mounting never writes to storage — the default stays absent until the user picks. An absent key and a stored `"system"` behave identically, so don't build logic on the difference.
- That script duplicates the resolution logic on purpose — it runs before the bundle, so dark-mode users don't get a white flash. Its storage key and JSON encoding must match `theme.tsx`; `theme.test.tsx` guards the pair.
- `systemThemeAtom` is lazy so its first read happens during render. Seeding it with a value would repaint a frame after the inline script already got it right — `theme.test.tsx` guards this.
- `--theme-color` in `styles/globals.css` is the source for `<meta name="theme-color">`. `index.html` (both values) and `public/site.manifest` (light) must repeat it, since they load before any stylesheet. Change all three together — no test catches this drift.

## Error Handling

- `AppErrorBoundary` (root) shows generic error UI. `AuthErrorBoundary` (protected routes) catches 401/UNAUTHORIZED and shows sign-in recovery UI; 403 falls through to generic handler.
- Utilities in `lib/errors.ts`: `getErrorStatus()`, `isUnauthenticatedError()`, `getErrorMessage()`.
