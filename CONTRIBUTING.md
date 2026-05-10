# Contributing to A.R.I.

Thank you for contributing to A.R.I. This project welcomes bug reports, documentation improvements, tests, and code contributions.

## Scope and Principles

- Contributions must improve reliability, security, maintainability, or user value.
- Production safety and integrity checks have priority over feature speed.
- Keep changes focused and avoid unrelated refactors.
- Prefer explicit behavior over hidden automation.

## License and Legal Terms

By submitting a contribution (code, docs, tests, assets, configs, templates), you agree that:

1. Your contribution is provided under the same project license model defined in LICENSE.
2. The project is licensed under GNU AGPL v3 with additional terms (AGPL Section 7) as documented in LICENSE.
3. You have the rights to submit the contribution.
4. You do not submit content that violates third-party rights.

Important specialization rules (see LICENSE for binding text):

- Do not remove, disable, or bypass specialization signature verification.
- Do not replace embedded public keys to accept unauthorized signatures.
- Do not rely on SKIP_SIGNATURE_VERIFICATION=true in production behavior.
- Do not redistribute proprietary signed .ari-spec files.

## Development Setup

1. Install dependencies:
   - Root: npm install
   - Backend: npm --prefix backend install
   - Frontend: npm --prefix frontend install
2. Build all:
   - npm run build
3. Run tests:
   - npm run test
   - npm --prefix backend run test
   - npm --prefix frontend run test

## Branch and Commit Guidelines

- Use small, reviewable commits.
- Use descriptive commit messages.
- Keep one concern per pull request.
- Include rationale in PR description, not only code changes.

Recommended commit style:

- feat: add X
- fix: correct Y
- docs: clarify Z
- test: add coverage for A
- chore: maintain B

## Pull Request Checklist

Before opening a PR, confirm:

- [ ] Code builds successfully.
- [ ] Relevant tests pass.
- [ ] New behavior is covered by tests.
- [ ] Lint/format checks pass.
- [ ] No secrets, credentials, or private keys are committed.
- [ ] Changes respect LICENSE and specialization integrity rules.
- [ ] Documentation is updated if behavior changed.

## Security Expectations

- Never commit secrets, tokens, private keys, or customer data.
- Use environment variables and local secret stores.
- Report vulnerabilities privately per SECURITY.md.

## Code Quality Expectations

- Keep functions cohesive and explicit.
- Add types for new interfaces and external boundaries.
- Prefer defensive checks at API/input boundaries.
- Add concise comments only for non-obvious logic.

## Documentation Expectations

If your change affects behavior, also update relevant docs:

- README.md / README_EN.md
- docs/german/*
- docs/english/*

## Review and Merge Policy

Maintainers may request changes for:

- Security risks
- License conflicts
- Missing tests
- Incomplete migration impact
- Breaking behavior without justification

PRs can be declined if they conflict with project goals or legal constraints.

## Questions

For contribution questions, use SUPPORT.md channels.
For security reports, follow SECURITY.md.
