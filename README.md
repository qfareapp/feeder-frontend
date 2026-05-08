# Feeder Bus Development

Single Git repository for the feeder bus system.

## Structure

- `apps/admin-backend` - Node/Express admin API
- `apps/admin-frontend` - React/Vite admin dashboard
- `apps/mobile-app` - Expo mobile application

## Notes

- Each app keeps its own `package.json`.
- App-specific `.gitignore` files remain in place for framework-specific outputs.
- The root `.gitignore` covers shared OS, editor, log, dependency, and secret-file noise.
- Each app includes an `.env.example` showing the deployment variables it expects.
