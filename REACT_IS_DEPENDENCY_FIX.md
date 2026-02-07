# React-is Dependency Fix

## Issue
The Next.js dev server was crashing with the error:
```
Module not found: Can't resolve 'react-is'
```

This was happening when trying to compile pages that use the `recharts` library (like the client-admin dashboard).

## Root Cause
The `recharts` library has a peer dependency on `react-is`, but it wasn't installed in the project. This is a common issue with npm/yarn package resolution.

## Solution
Installed the missing `react-is` dependency:

```bash
yarn add react-is
```

## Result
✅ Dependency installed: `react-is@19.2.4`
✅ Dev server now compiles successfully
✅ All pages load without errors
✅ HTTP 200 response from `/start-free-trial`

## Files Modified
- `package.json` - Added `react-is` as a dependency
- `yarn.lock` - Updated with new dependency resolution

## Additional Context
This issue was blocking:
- The start-free-trial (brochure) page
- The client-admin dashboard page
- Any other pages that use recharts for data visualization

The fix ensures that all chart components can render properly without module resolution errors.

## Testing
Navigate to the following pages to verify the fix:
- ✅ `http://localhost:3000/start-free-trial` - Brochure page
- ✅ `http://localhost:3000/client-admin` - Admin dashboard with charts
- ✅ Any other pages using recharts

All pages should now load without the "Module not found: Can't resolve 'react-is'" error.
