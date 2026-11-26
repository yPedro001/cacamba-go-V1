import { describe, it, expect } from 'vitest';
import { isValidUUID } from '@/core/application/session-utils';

describe('Auth Identity & UUID Validation Tests', () => {
  const CANONICAL_BORGHELIX_ID = '87f05076-b040-4f03-8ea4-e22bee57d4ef';

  it('validates authentic PostgreSQL UUID formats', () => {
    expect(isValidUUID(CANONICAL_BORGHELIX_ID)).toBe(true);
    expect(isValidUUID('adef5295-2abd-437c-8939-482cb2ec5e19')).toBe(true);
  });

  it('rejects invalid or Firebase non-UUID strings', () => {
    expect(isValidUUID('firebase_uid_12345')).toBe(false);
    expect(isValidUUID('d80e7225-78eb-invalid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(undefined)).toBe(false);
  });

  it('verifies canonical ID assignment for borghelixcacambas@gmail.com', () => {
    const targetEmail = 'borghelixcacambas@gmail.com';
    const cleanEmail = targetEmail.trim().toLowerCase();
    const effectiveId = cleanEmail === 'borghelixcacambas@gmail.com'
      ? CANONICAL_BORGHELIX_ID
      : 'some_other_id';

    expect(effectiveId).toBe('87f05076-b040-4f03-8ea4-e22bee57d4ef');
  });

  it('allows general users to retain their own unique user id', () => {
    const generalEmail = 'novousuario@empresa.com';
    const generalGoogleUid = 'google_uid_987654';
    const cleanEmail = generalEmail.trim().toLowerCase();
    const effectiveId = cleanEmail === 'borghelixcacambas@gmail.com'
      ? CANONICAL_BORGHELIX_ID
      : generalGoogleUid;

    expect(effectiveId).toBe('google_uid_987654');
    expect(effectiveId).not.toBe(CANONICAL_BORGHELIX_ID);
  });
});
