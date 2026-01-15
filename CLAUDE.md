# vibe

## Autonomous Mode
This project is built 100% by Claude via Ralph loops.

## Project Info
- **Domain:** https://vibevalidator.com
- **Port:** 3001
- **PM2 name:** vibe
- **Stack:** Vite + React + TypeScript

## Rules for Ralph
- Update progress.txt after each significant change
- Check off PRD items as you complete them: `- [x] Done`
- If blocked, create BLOCKED.md and set DONE: no, BLOCKED: reason
- Learn project patterns and add them below
- Commit after each milestone

## Learned Patterns
(Claude adds entries here as it learns)
- React components in src/components/
- Tailwind for styling
- Vite for bundling

## Development
- Dev server: `npm run dev` (port 3001)
- Build: `npm run build`
- Start: `pm2 start ecosystem.config.cjs`
