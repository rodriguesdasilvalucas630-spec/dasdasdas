# Vote Scout Pro - Deployment Guide

## Supabase Setup

### 1. Database Configuration

1. Run the migration files in order:
   ```sql
   -- Apply the fix_auth_and_functions.sql migration
   ```

2. Enable email confirmation (optional):
   - Go to Authentication > Settings in Supabase Dashboard
   - Disable "Enable email confirmations" for development
   - Enable for production with proper email templates

3. Configure RLS Policies:
   - All tables have RLS enabled
   - Policies are based on user roles (admin/researcher)
   - Admin users can manage all data
   - Researchers can only access their assigned data

### 2. Environment Variables

Create a `.env.local` file with:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=http://localhost:8080
```

## Vercel Deployment

### 1. Prepare for Deployment

1. **Build Test**: Run `npm run build` to ensure no build errors
2. **Type Check**: Run `npm run type-check` to verify TypeScript
3. **Environment Variables**: Set up in Vercel dashboard

### 2. Vercel Configuration

The project includes a `vercel.json` file with:
- Proper SPA routing configuration
- Environment variable mapping
- CORS headers for API routes
- Build optimization settings

### 3. Deploy to Vercel

#### Option A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option B: GitHub Integration
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` (your Vercel domain)

### 4. Environment Variables Setup

In Vercel Dashboard > Settings > Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Production |
| `VITE_APP_URL` | `https://your-app.vercel.app` | Production |

### 5. Domain Configuration

1. **Custom Domain** (optional):
   - Go to Vercel Dashboard > Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Supabase URLs**:
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Add your Vercel domain to allowed origins
   - Update redirect URLs if using OAuth

## Post-Deployment Checklist

### 1. Test Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Role-based access control functions
- [ ] Profile creation on signup

### 2. Test Core Features
- [ ] Admin can create researches
- [ ] Researchers can view assignments
- [ ] GPS functionality works
- [ ] Interview submission works
- [ ] Real-time updates function

### 3. Test Database Operations
- [ ] Data persistence
- [ ] RLS policies enforce security
- [ ] Triggers update counts correctly
- [ ] Edge functions respond properly

### 4. Performance Optimization
- [ ] Check Lighthouse scores
- [ ] Verify bundle size
- [ ] Test loading times
- [ ] Monitor error rates

## Troubleshooting

### Common Issues:

1. **Build Errors**:
   - Check TypeScript errors: `npm run type-check`
   - Verify all imports are correct
   - Ensure environment variables are set

2. **Authentication Issues**:
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure user creation trigger is working

3. **Database Connection**:
   - Test Supabase connection in browser console
   - Verify environment variables
   - Check network connectivity

4. **Deployment Issues**:
   - Check Vercel build logs
   - Verify environment variables in Vercel
   - Test locally with production build

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files
   - Use Vercel's secure environment variable storage
   - Rotate keys regularly

2. **Database Security**:
   - RLS is enabled on all tables
   - Policies restrict access by user role
   - Sensitive operations require admin privileges

3. **API Security**:
   - Edge functions use proper authentication
   - CORS is configured correctly
   - Input validation on all endpoints

## Monitoring and Maintenance

1. **Error Tracking**:
   - Monitor Vercel function logs
   - Set up Supabase monitoring
   - Track user authentication issues

2. **Performance Monitoring**:
   - Use Vercel Analytics
   - Monitor Supabase usage
   - Track Core Web Vitals

3. **Database Maintenance**:
   - Regular backup verification
   - Monitor query performance
   - Update RLS policies as needed