# Supabase

This directory contains the Supabase configuration and migrations for WaitMe.

## Structure

```
supabase/
├── config.toml    # Local development config
├── migrations/   # SQL migrations (version-controlled)
├── functions/    # Edge functions (optional)
└── seed.sql      # Seed data for local db reset
```

## Migrations

Migrations are applied in order by filename (timestamp prefix). To create a new migration:

```bash
npx supabase migration new <name>
```

## GitHub Actions

Migrations are pushed to the linked Supabase project when changes in `supabase/migrations/` are pushed to `main`.

**Required secrets:**
- `SUPABASE_ACCESS_TOKEN` - From [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
- `SUPABASE_PROJECT_ID` - Project reference from Project Settings
- `SUPABASE_DB_PASSWORD` - Database password

**Link project locally:**
```bash
npx supabase login
npx supabase link --project-ref <PROJECT_ID>
```

## Local development

```bash
npx supabase start   # Requires Docker
npx supabase db reset  # Apply migrations + seed
```
