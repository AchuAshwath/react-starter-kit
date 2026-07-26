shadcn/ui component library (new-york style, Radix primitives, Tailwind v4). Consumed as `@repo/ui`.

## Scope

- Only generic primitives belong here. If a component imports a route, a query, or the session, it belongs in `apps/app/components/` instead.
- Nothing here imports from `apps/` or `db/`. The package must stay droppable into another app as-is.
- `@/` resolves to the package root (`packages/ui/tsconfig.json` maps `@/*` → `./*`). `@/lib/utils` is this package's `lib/utils.ts`, not the app's. Leave CLI-generated imports as they are — rewriting them to `@repo/ui` creates a cycle.

## Adding and Updating Components

- Use `bun ui:add <component>`; don't hand-write files the registry already has. `bun ui:add` with no arguments prints help and exits non-zero.
- `bun ui:add` does NOT update `index.ts`. Add `export * from "./components/<name>";` yourself, or the import from `@repo/ui` won't resolve.
- The CLI installs any Radix packages the component needs. Review and commit the resulting `package.json` and `bun.lock` changes.
- `bun ui:update` overwrites every installed component in place. Review `git diff` before committing; local edits are lost.
- Registry output is not uniform — read what it generated. `packages/ui` lints with `--max-warnings 0`, so convert React 18 patterns before committing:
  - `<Context.Provider value={x}>` → `<Context value={x}>` (`@eslint-react/no-context-provider`)
  - `React.useContext(C)` → `React.use(C)` (`@eslint-react/no-use-context`)
- Strip the `"use client"` directive when it appears — no RSC here, so it is inert.
- `no-forward-ref` is off for this package — generated `forwardRef` usage is fine.

## Styling

- Every component accepts `className` and passes it through `cn()` last — directly, or via the `className` slot on a `cva` variants call — so callers can override defaults without a specificity fight.
- Use theme tokens (`bg-primary`, `text-muted-foreground`), never raw colors. Token values live in `apps/app/styles/globals.css`; `styles.css` here exists only to satisfy the shadcn CLI.
- Class names must appear as complete literals — Tailwind scans text, so `` `bg-${color}-500` `` produces nothing.
- Consuming apps must `@source` this package's `components/`, `lib/`, and `hooks/` in their Tailwind config.

## Conventions

- Named exports only — no default exports.
- Variants via `class-variance-authority`; export the variants object when another component composes it (see `toggle.tsx` → `toggle-group.tsx`).
- Prefer a Radix primitive over hand-rolled behavior — it brings the ARIA roles and keyboard handling with it. `ToggleGroup type="single"` already renders `role="radiogroup"` with `role="radio"` items and arrow-key navigation, so callers add no keyboard code.
