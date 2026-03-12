# Claude Code: PassAI Ghibli UI Merge + Google OAuth

## REPOS
- Ghibli design source: ~/Desktop/oasis-study-nook-main
- Target: eraschke66/lynki-frontend (clone it if not local)

---

## STEP 1: Copy assets
Copy all files from `oasis-study-nook-main/src/assets/` into `lynki-frontend/public/`:
cat-pawprint.png, foliage-left.png, foliage-right.png, garden-login-bg.jpg, ghibli-bg.jpg,
leaf-sprout.png, plant-stage-1.png, plant-stage-2.png, plant-stage-3.png, plant-stage-4.png,
seedling-add.png, sleeping-cat.png, water-drop.png

---

## STEP 2: Merge index.css
Merge INTO lynki-frontend/src/index.css (keep existing content, add these):
- From oasis-study-nook-main/src/index.css: all --ghibli-* CSS variables, all shadow variables,
  all keyframe animations (float-leaf, drift, shimmer, pulse-soft, drop-fall, scale-in-bounce),
  all .animate-* utility classes, .parchment-texture, .mist-overlay
- Add font import: @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Nunito:wght@300;400;500;600;700&display=swap');

---

## STEP 3: Merge tailwind.config.ts
Into lynki-frontend/tailwind.config.ts add (keep existing):
- fontFamily: { serif: ['Lora', 'serif'], sans: ['Nunito', 'sans-serif'] }
- colors.ghibli: { cream, ivory, moss, forest, canopy, sunlight, amber, mist, bark, petal } (from oasis tailwind)
- borderRadius.parchment: '1.25rem'
- boxShadow: { parchment, 'parchment-hover', glow } (using var() references from oasis)

---

## STEP 4: Create garden components
Create these in lynki-frontend/src/components/garden/ (reference images as "/filename.png" not @/assets):

### ParchmentCard.tsx
Copy from oasis-study-nook-main/src/components/ParchmentCard.tsx, change no imports needed.

### PlantIndicator.tsx
Copy from oasis-study-nook-main/src/components/PlantIndicator.tsx but replace:
  import plantStage1 from "@/assets/plant-stage-1.png" etc
with:
  const stageSrcs = ["/plant-stage-1.png", "/plant-stage-2.png", "/plant-stage-3.png", "/plant-stage-4.png"]
and use <img src={stageSrcs[stageIndex]} />

### GhibliBackground.tsx (new shared component)
```tsx
const GhibliBackground = () => (
  <>
    <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(/ghibli-bg.jpg)" }} />
    <div className="fixed inset-0 bg-background/40" />
    <div className="fixed inset-0 mist-overlay pointer-events-none" />
    <img src="/foliage-left.png" alt="" className="fixed left-0 bottom-0 w-64 lg:w-80 xl:w-96 pointer-events-none z-20 animate-drift select-none" style={{ filter: "drop-shadow(4px 0 15px hsl(var(--ghibli-canopy) / 0.2))" }} />
    <img src="/foliage-right.png" alt="" className="fixed right-0 top-0 w-56 lg:w-72 xl:w-80 pointer-events-none z-20 animate-drift select-none" style={{ animationDelay: "3s", filter: "drop-shadow(-4px 0 15px hsl(var(--ghibli-canopy) / 0.2))" }} />
    <div className="fixed top-20 left-1/4 w-40 h-40 rounded-full bg-ghibli-sunlight/10 blur-3xl animate-shimmer pointer-events-none" />
    <div className="fixed bottom-40 right-1/4 w-56 h-56 rounded-full bg-ghibli-sunlight/10 blur-3xl animate-shimmer pointer-events-none" style={{ animationDelay: "2s" }} />
    <img src="/sleeping-cat.png" alt="" className="fixed bottom-4 right-6 w-28 lg:w-36 pointer-events-none z-30 select-none animate-pulse-soft" style={{ animationDuration: "5s" }} />
  </>
);
export default GhibliBackground;
```

---

## STEP 5: Wire Google OAuth

### 5a. Add signInWithGoogle to authService.ts
In lynki-frontend/src/features/auth/services/authService.ts, add this function:
```ts
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error: error as AuthError | null };
}
```

### 5b. Expose it in useAuth
In lynki-frontend/src/features/auth/hooks/useAuth.tsx:
- Add `signInWithGoogle: authService.signInWithGoogle` to the value object
- Add `signInWithGoogle` to the AuthContextType interface in types.ts

### 5c. Wire the button in LoginForm.tsx
The Google button already exists visually. Add:
- `const { signIn, signInWithGoogle } = useAuth();` 
- `onClick={async () => { const { error } = await signInWithGoogle(); if (error) setError(error.message); }}`
to the Google button

---

## STEP 6: Rewrite LoginForm.tsx visuals
File: lynki-frontend/src/features/auth/components/LoginForm.tsx

KEEP all existing logic (useAuth, useForm, zodResolver, signIn, error handling, navigate)
REPLACE background with: garden-login-bg.jpg (fixed div with bg-cover)
ADD: foliage-left.png and foliage-right.png fixed positioned
ADD: golden hour overlay and mist overlay divs
REPLACE card with: wooden frame outer div + parchment inner div (from oasis Login.tsx)
KEEP: all form inputs, validation, error display, "Forgot your path?" link, "Plant your first seed" link
The visual structure to copy is in oasis-study-nook-main/src/pages/Login.tsx

---

## STEP 7: Rewrite Dashboard.tsx visuals
File: lynki-frontend/src/features/dashboard/components/Dashboard.tsx

KEEP all existing Supabase data fetching, BKT pass probability data, course navigation
REPLACE visuals:
- Add <GhibliBackground /> as first child
- Header: "PassAI" with <span className="text-primary">Pass</span>AI in Lora serif
- Hero: <ParchmentCard> with "Your Learning Garden" + <PlantIndicator probability={overallPassProbability} size="xl" />
- Course grid: each course in <ParchmentCard> with <PlantIndicator probability={course.passProbability} /> + "Walk the Path" button
- "Plant a New Course" card: dashed border card with /seedling-add.png
- Remove the old orange CircularProgress donut ring entirely
- Overall probability = average of all courses' BKT pass probabilities

---

## STEP 8: Rewrite quiz/test page visuals
Find the quiz page (likely src/features/quiz/components/TestPage.tsx or similar)

KEEP all existing quiz logic (questions from API, BKT submission, answer handling)
REPLACE visuals with oasis Quiz.tsx design:
- <GhibliBackground /> 
- Stepping-stone progress bar (GardenPath component from oasis Quiz.tsx)
- <ParchmentCard> for question with scroll wave SVG ornaments top and bottom
- Answer buttons: A/B/C/D stone markers, /leaf-sprout.png for correct, /water-drop.png for wrong
- Completion card: "Garden Walk Complete" with "Return to Garden" button

---

## STEP 9: Build and push
```bash
cd lynki-frontend
npm run build
# Fix any TS errors (mostly unused imports — just delete them)
git add -A
git commit -m "feat: Ghibli UI + Google OAuth"
git push origin main
```

---

## CRITICAL CONSTRAINTS
- DO NOT touch: supabase client config, BKT algorithm, route definitions, AuthProvider, ProtectedRoute
- DO NOT change backend URL: lynki-backend.onrender.com/api/v1
- DO NOT touch vercel.json
- Asset paths: use "/filename.png" (public/ convention), NOT import statements
- The existing Neko.tsx sleeping cat component can stay or be replaced by /sleeping-cat.png — either works
