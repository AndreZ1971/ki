# Security Policy

## Supported Versions

Security fixes are prioritized for the current maintained release branch.
If uncertain, report the issue anyway.

## Reporting a Vulnerability

Please do not open public issues for unpatched vulnerabilities.

Use private contact channels listed in SUPPORT.md and include:

- Affected component/file path
- Impact summary
- Reproduction steps or proof-of-concept
- Suggested mitigation (if available)
- Your contact handle for follow-up

## Response Targets

- Initial acknowledgement: typically within 72 hours
- Triage decision: as soon as impact is verified
- Fix timeline: based on severity and exploitability

## Severity Considerations

Issues are prioritized by:

- Remote exploitability
- Confidentiality/integrity/availability impact
- Privilege escalation potential
- Supply-chain impact
- Production blast radius

## Specialization Integrity Rules

The following are treated as high-severity integrity violations:

- Bypassing specialization signature verification
- Replacing embedded verification public keys
- Enabling SKIP_SIGNATURE_VERIFICATION behavior for production paths

These controls are part of the project's core trust model and license conditions.

## Disclosure Policy

- Coordinated disclosure is preferred.
- Public disclosure should happen after a fix or mitigation is available.
- Credit is given where requested and appropriate.

## Repository History Remediation

- On 2026-05-10, the git history was rewritten to remove previously tracked `connection.json` credential files.
- Local runtime configuration files such as `connection.json` and `backend/connection.json` must remain untracked.
- Contributors with older clones should delete them and clone the repository again before pushing changes.

## Hardening Guidance

- Keep dependencies updated.
- Rotate and protect credentials.
- Use least-privilege for runtime accounts.
- Avoid logging sensitive data.
- Validate all external input boundaries.
