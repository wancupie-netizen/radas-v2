# RADAS Supabase

## PC-002 foundation

This directory stores versioned database migrations for RADAS V2.

### Remote setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `migrations/202608010001_pc002_foundation.sql` once.
4. Copy the Project URL and Publishable key into `.env.local`.
5. Create the first Auth user, then promote it with:

```sql
update public.profiles
set role = 'admin', plan = 'pro'
where id = 'AUTH_USER_UUID';
```

Never place `service_role` or secret keys in a Vite environment variable.