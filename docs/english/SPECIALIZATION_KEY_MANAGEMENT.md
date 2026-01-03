# Specialization Key Management

## Overview

This document covers the management of specialization encryption keys in A.R.I., including production deployment, key rotation, and security best practices.

## Environment Variables

### SPEC_PUBLIC_KEY

**Purpose**: RSA public key for signature validation of specialization files from kaufe-es.eu

**Configuration**:
```bash
export SPEC_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyVxQ9jK5pZ7N2rH8kE3v
...
-----END PUBLIC KEY-----"
```

**Location in Code**: [backend/services/specializationService.ts](../../backend/services/specializationService.ts#L21)

**Fallback**: If not set, a default key is used (logs warning - not recommended for production)

## Encryption Key Management

### storage Location
- **File**: `connection.json` (Docker volume)
- **Key Field**: `specialization.encryptionKey`
- **Format**: 32-byte hex string (64 characters)
- **Auto-generated**: On first Docker startup via [backend/docker-entrypoint.sh](../../backend/docker-entrypoint.sh)

### Generation (Docker Entrypoint)
```bash
# Generates and stores encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)
jq ".specialization.encryptionKey = \"$ENCRYPTION_KEY\"" connection.json > connection.json.tmp
mv connection.json.tmp connection.json
```

### Key Rotation (TODO)

**Current Status**: Not implemented

**Planned Approach**:
1. Generate new encryption key
2. Decrypt all existing specializations with old key
3. Re-encrypt with new key
4. Update `connection.json`
5. Archive old key for recovery

**Timeline**: Post-MVP phase

## Production Deployment Checklist

- [ ] Set `SPEC_PUBLIC_KEY` environment variable
- [ ] Verify `connection.json` exists with valid encryption key
- [ ] Run `docker-entrypoint.sh` to initialize key if missing
- [ ] Backup `connection.json` securely (e.g., AWS Secrets Manager, HashiCorp Vault)
- [ ] Document key backup location and recovery procedure
- [ ] Test signature validation with production specializations
- [ ] Monitor logs for key initialization warnings

## Security Recommendations

### At-Rest Encryption
- Use managed secret services (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Never commit keys to version control
- Rotate keys quarterly (implement key rotation strategy)

### Audit Logging
- Log all key operations (generation, rotation, usage)
- Monitor access to `connection.json`
- Alert on unauthorized key changes

### Disaster Recovery
- Maintain encrypted backup of current key
- Document manual recovery procedure
- Test recovery in non-production environment

## Related Files

- [Backend Specialization Service](../../backend/services/specializationService.ts)
- [Docker Entrypoint](../../backend/docker-entrypoint.sh)
- [Connection Configuration](../../docs/english/connection-json-init.md)
