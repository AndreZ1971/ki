# Contributing to A.R.I.

Thanks for your interest in contributing! To keep this project healthy, please follow these basics:

## How to Contribute
- **Issues first:** Open a GitHub issue describing the change/bug before large work.
- **Small PRs:** Prefer focused pull requests over big bang changes.
- **Coding style:** TypeScript, ESLint, Prettier. Run `npm run lint` and `npm test` before pushing.
- **Commits:** Use clear messages; squash locally if you have many WIP commits.
- **Docs:** Update German + English docs together when behavior changes.

## Development Setup
- Node 20.x, npm 11.x recommended
- `npm install` in root, `npm install` in `backend/` and `frontend/`
- Run tests: `npm test` (root), `npm run test` in backend/frontend as needed

## Security & Secrets
- Never commit secrets (.env, keys). Use `.env.example` as reference.
- Report security issues privately to the maintainer.

## Code Quality Checklist
- Lint clean (`npm run lint`)
- Tests passing (`npm test` or scoped)
- No `console.*` left in production code (use logger)
- Docs updated if user-facing change

Thank you for helping improve A.R.I.! :rocket:
