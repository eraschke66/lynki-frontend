// AdminPage is a lazy-loaded route screen (see routes.tsx) and deliberately
// excluded from this barrel — importing it here would pull it into whatever
// chunk imports anything else from this barrel, defeating its per-route
// code-splitting (see vite.config.ts's manualChunks comments).
export { isAdminEmail } from "./adminAccess";
