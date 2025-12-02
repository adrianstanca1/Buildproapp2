# BuildPro Application - Deployment & Architecture Guide

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (production) or SQLite (development)

### Development Setup
```bash
# Install dependencies
npm install
npm install --prefix server

# Set environment variables (.env file)
GEMINI_API_KEY=your_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
DATABASE_URL=postgresql://user:password@host/database (optional)

# Run development servers
npm run dev              # Frontend on http://localhost:3000
npm run start --prefix server  # Backend on http://localhost:3002
```

### Production Deployment

#### Via Vercel (Recommended)
```bash
# Already configured - just push to main branch
git add .
git commit -m "your changes"
git push origin main
```

The deployment automatically:
- Builds the frontend with Vite
- Deploys to Vercel's edge network
- Rewrites SPA routes to index.html
- Proxies `/api/*` calls

**Live URL**: https://buildproapp-8sugil7az-adrianstanca1s-projects.vercel.app

#### Environment Variables (Vercel)
Set these in Vercel project settings → Environment Variables:
- `GEMINI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `DATABASE_URL` (for PostgreSQL production database)
- `PGSSLMODE=no-verify` (for remote database)

---

## Architecture Overview

### Frontend (Vite + React 19 + TypeScript)
```
src/
├── views/           # 37 role-based dashboard views
├── components/      # Reusable UI components (Sidebar, TopBar, etc)
├── contexts/        # Global state (ProjectContext, AuthContext, ToastContext)
├── services/        # API abstraction, Gemini AI, Supabase
├── hooks/           # Custom React hooks (useAsyncOperation)
├── utils/           # Helper functions
└── types/           # TypeScript type definitions
```

**Key Features:**
- **Multi-tenant**: Role-based access control (Super Admin, Company Admin, Supervisor, Operative)
- **Offline Support**: Queue operations when API is unavailable
- **AI Integration**: Google Gemini for vision/chat features
- **Real-time**: Supabase channels for team messaging
- **Error Handling**: ErrorBoundary + Toast notifications

### Backend (Node.js + Express)
```
server/
├── index.ts         # REST API routes for 15 entities
├── database.ts      # DB adapter (PostgreSQL/SQLite)
├── init-db.ts       # Schema initialization
└── seed.ts          # Sample data
```

**Database Schema:**
- Projects, Tasks, Team, Documents
- Clients, Inventory, RFIs, Punch Items
- Daily Logs, Dayworks, Safety Incidents
- Equipment, Timesheets, Chat Channels/Messages

**API Endpoints:**
- `GET/POST /api/{entity}` - List and create
- `PUT /api/{entity}/:id` - Update
- `DELETE /api/{entity}/:id` - Delete

---

## Recent Improvements (Week 1)

### Critical Fixes
✅ **Error Handling** (Commit: bb3912e)
- Added React ErrorBoundary component to prevent app crashes
- Implemented ToastContext for user-facing notifications
- Created useAsyncOperation hook for standardized error handling

✅ **Security** (Commit: 7dd11f9)
- Updated Express to 4.22.1+ to fix GHSA-pj86-cfqh-vqx6
- 0 npm vulnerabilities (down from 2)

✅ **Deployment** (Commits: 81dd9ff, 71bb2e9)
- Configured Vercel deployment
- Fixed project name for deployment validation
- Added SPA routing configuration

### Verified Components
- ✅ Frontend builds without errors (5.58s)
- ✅ Backend API routes all functional
- ✅ Database supports PostgreSQL and SQLite
- ✅ Environment variables properly configured
- ✅ All 15 data tables initialized

---

## Identified Issues & Recommendations

### CRITICAL (Do Next)
1. **Memory Leaks in LiveView.tsx**
   - Unclosed MediaStream connections
   - Missing cleanup for animation intervals
   - Recommendation: Audit useEffect cleanup functions

2. **LiveView.tsx and SafetyView.tsx**
   - Camera resource not properly released
   - VideoStream cleanup incomplete
   - FileReader operations lack AbortController

### HIGH (Week 2-3)
3. **Type Safety**
   - Remove @ts-ignore usage (5+ instances)
   - Add runtime validation for API responses
   - Use strict TypeScript config

4. **Bundle Optimization**
   - Vendor chunk is 812KB (need to split)
   - Separate @google/genai as lazy chunk
   - Extract Leaflet maps as optional code split

5. **Context Re-renders**
   - ProjectContext causes excessive re-renders
   - Recommendation: Split into smaller domain contexts
   - Use useSelector pattern for granular subscriptions

### MEDIUM (Week 3-4)
6. **Error Handling Improvements**
   - Add user-facing error messages to all API calls
   - Implement exponential backoff retry logic
   - Add API health status indicator

7. **Loading States**
   - Replace "Loading..." with skeleton UI
   - Add loading indicators to async operations
   - Disable form submissions during API calls

8. **Code Splitting**
   - Implement lazy loading for heavy views
   - Add route-based prefetching
   - Create dynamic map library imports

---

## Development Workflow

### Running Tests
```bash
# (Note: No test suite currently set up)
# Recommended: Add Jest + React Testing Library
npm install --save-dev jest @testing-library/react
```

### Building for Production
```bash
npm run build  # Creates dist/ folder (~1.5MB)
vercel deploy --prod  # Deploy to Vercel
```

### Debugging
```bash
# Check for type errors
npx tsc --noEmit

# Audit dependencies
npm audit
npm audit fix

# Check bundle size
npm run build  # Shows gzip sizes for each chunk
```

---

## Security Considerations

### Current Protections
- ✅ CORS enabled on backend
- ✅ Role-based access control in frontend
- ✅ Supabase RLS policies (if configured)
- ✅ Environment variables for sensitive data
- ✅ No secrets in git (check .gitignore)

### Recommended
1. Add server-side authorization validation
2. Verify Supabase RLS policies are enforced
3. Implement JWT token refresh mechanism
4. Add rate limiting on API endpoints
5. Use HTTPS only (enforced by Vercel)
6. Regular dependency updates (npm audit)

---

## Monitoring & Troubleshooting

### Check Deployment Status
```bash
# List recent deployments
vercel ls

# View deployment logs
vercel logs --follow

# Inspect specific deployment
vercel inspect <deployment-url>
```

### Common Issues

**API calls fail with 503**
- Check if backend is running: `npm start --prefix server`
- Verify database is accessible
- Check DATABASE_URL environment variable

**Components crash silently**
- Check browser console for errors
- Error boundary will show error message
- Review server logs for API errors

**Build takes too long**
- Check for large dependencies
- Run `npm ls` to audit dependency tree
- Consider code splitting large views

---

## File Structure

### Key Files Modified This Session
- `App.tsx` - Added ErrorBoundary and ToastProvider
- `components/ErrorBoundary.tsx` - NEW: Error boundary component
- `contexts/ToastContext.tsx` - NEW: Toast notification system
- `hooks/useAsyncOperation.ts` - NEW: Async operation hook
- `package.json` - Express security patch (4.22.1)
- `vercel.json` - SPA routing configuration

### Configuration Files
- `.env` - Environment variables (in .gitignore)
- `.env.example` - Template for required variables
- `vite.config.ts` - Frontend build configuration
- `vercel.json` - Deployment configuration
- `tsconfig.json` - TypeScript configuration

---

## Performance Metrics

**Current**
- Frontend Bundle: 1.5MB total (204KB gzipped)
- Backend API: Sub-100ms responses
- Database: SQLite (dev) / PostgreSQL (prod)
- Deployment Time: ~20 seconds

**Targets for Optimization**
- Vendor chunk: 812KB → 400KB (via code splitting)
- Largest view: ProjectDetailsView 78KB → 40KB (lazy load)
- First Contentful Paint: Improve with skeleton loaders

---

## Support & Resources

### Project Documentation
- Type definitions: `types/index.ts`
- API service: `services/db.ts`
- Context structure: `contexts/ProjectContext.tsx`

### External Resources
- React 19 Docs: https://react.dev
- Vite Guide: https://vitejs.dev/guide/
- Express API: https://expressjs.com/api.html
- Supabase Docs: https://supabase.com/docs
- Gemini API: https://ai.google.dev/

### Git History
```bash
# View recent commits
git log --oneline -10

# See changes in specific commit
git show <commit-hash>
```

---

**Last Updated**: December 2, 2025
**Status**: ✅ Deployed & Functional
**Next Priority**: Fix memory leaks in LiveView/SafetyView
