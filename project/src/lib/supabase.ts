// // This file is deprecated - use api.ts instead
// // Kept for reference only - will be removed in future versions

// import { api } from './api';

// // Re-export for backward compatibility during migration
// // All components should migrate to use api.ts directly
// export const supabase = {
//   // This is a placeholder - do not use
//   from: () => {
//     throw new Error('Supabase is deprecated. Please use api.ts instead. Example: import { api } from "../lib/api"');
//   },
//   auth: {
//     signUp: () => {
//       throw new Error('Supabase is deprecated. Please use api.register() instead.');
//     },
//     signInWithPassword: () => {
//       throw new Error('Supabase is deprecated. Please use api.login() instead.');
//     },
//   },
// };

// // Migration helper - use api methods instead
// export const migrateToAPI = () => {
//   console.warn('Please migrate from supabase to api. See MIGRATION_GUIDE.md');
// };
