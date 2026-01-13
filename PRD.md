# Vibe - Epic 3D Glass Card Decision Picker

## Overview
Fix and enhance the 3D glass card decision picker to be **epic, smooth, and mobile-friendly**.
When a winner is chosen, the losing cards should **shatter like glass** while the winner glows and zooms forward.

**CRITICAL REQUIREMENTS:**
- 60fps smooth performance on all devices
- Mobile responsive and touch-friendly
- Epic glass shatter effect when revealing winner
- Create PR when complete

---

## Requirements

### Phase 1: Fix Card Visibility
- [ ] Fix `meshPhysicalMaterial` settings (transmission 0.6 not 0.9)
- [ ] Add proper 3-point lighting for glass reflections
- [ ] Ensure text renders on cards (use Html or Text from drei)
- [ ] Add subtle edge glow to cards
- [ ] Test cards are visible on dark background

### Phase 2: Fix Core Functionality
- [ ] Fix state management in App.tsx (idle → spinning → revealing → result)
- [ ] Remove scattered setTimeout calls, use centralized timing
- [ ] Ensure spin button triggers animation
- [ ] Ensure winner is selected and displayed
- [ ] Ensure result modal shows after animation

### Phase 3: Epic Glass Shatter Effect
- [ ] Create `ShatterEffect.tsx` component
- [ ] Generate triangular glass fragments from card geometry
- [ ] Animate fragments: explode outward with random velocities
- [ ] Add rotation and gravity to fragments
- [ ] Fade fragments out over ~1 second
- [ ] Add spark particles during shatter
- [ ] Winner card glows golden and zooms to center

### Phase 4: Performance Optimization (CRITICAL)
- [ ] Use `useMemo` for all geometries and materials
- [ ] Reduce particle count on mobile (detect with window.innerWidth)
- [ ] Use `<PerformanceMonitor>` from drei to auto-adjust quality
- [ ] Limit shatter fragments to 20-30 per card
- [ ] Test with CPU throttling - must be smooth
- [ ] Remove any unnecessary re-renders

### Phase 5: Mobile Responsiveness
- [ ] Canvas resizes properly on all screen sizes
- [ ] Input panel responsive (full width on mobile)
- [ ] Touch targets minimum 44px
- [ ] Test on mobile viewport (375px width)
- [ ] Result modal fits mobile screens

### Phase 6: Polish & Deploy
- [ ] Smooth animation timing (see timeline below)
- [ ] All animations feel cinematic
- [ ] No console errors or warnings
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works locally
- [ ] Restart PM2: `pm2 restart vibe`
- [ ] Test https://vibe.vibevalidator.com works
- [ ] Create PR with all changes

---

## Animation Timeline
```
0.0s - User clicks "Decide"
0.0s-3.0s - Cards orbit/swirl (accelerating)
3.0s - Winner selected, spin decelerates
3.5s - Non-winner cards SHATTER
3.5s-4.5s - Fragments fly outward, fade
4.0s - Winner card zooms forward, glows gold
4.5s - Result modal appears
```

## Glass Material (Correct Settings)
```tsx
<meshPhysicalMaterial
  color="#ffffff"
  metalness={0.1}
  roughness={0.05}
  transmission={0.6}
  thickness={0.5}
  envMapIntensity={1.5}
  clearcoat={1}
  ior={1.5}
  transparent
  opacity={0.9}
/>
```

## Files to Modify
- `src/App.tsx` - state management
- `src/components/Scene.tsx` - lighting, camera
- `src/components/FloatingCard.tsx` - material fix, shatter trigger
- `src/components/Background.tsx` - performance

## Files to Create
- `src/components/ShatterEffect.tsx` - glass breaking animation
- `src/hooks/useAnimationTimeline.ts` - centralized timing (optional)

## Verification Checklist
- [ ] Cards visible and beautiful
- [ ] Spin animation works
- [ ] Glass shatter effect is epic
- [ ] Winner glows and zooms
- [ ] Result modal displays
- [ ] 60fps on desktop
- [ ] Smooth on mobile
- [ ] No console errors
- [ ] Production build works
- [ ] Live site updated
- [ ] PR created
