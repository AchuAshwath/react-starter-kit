# UI Components

Shared UI component library built on shadcn/ui (new-york style), Radix UI, and Tailwind CSS v4.

[Documentation](https://reactstarter.com/frontend/ui)

## Usage

```typescript
import { Button, Card, Input, cn } from "@repo/ui";
```

## Commands

```bash
bun ui:add <component>    # Add a shadcn/ui component
bun ui:list               # List installed components
bun ui:update             # Re-fetch installed components
bun ui:essentials         # Install curated essential set
```

See [AGENTS.md](./AGENTS.md) for the conventions these commands assume.

## Structure

```bash
components/       # shadcn/ui components
hooks/            # Custom React hooks
lib/              # Utilities (cn function)
scripts/          # Component management tools
```

Consuming apps must `@source` this package's `components/`, `lib/`, and `hooks/` in
their Tailwind config, or classes used only here are stripped from the build. See
[apps/app/tailwind.config.css](../../apps/app/tailwind.config.css) for the full list.
