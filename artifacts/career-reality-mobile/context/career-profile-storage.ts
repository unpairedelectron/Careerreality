export function omitResumeUri<T extends { resumeUri?: string }>(
  profile: T,
): Omit<T, 'resumeUri'> {
  const { resumeUri: _resumeUri, ...persistedProfile } = profile;
  return persistedProfile;
}

export function careerAccountScope(userId: string | null | undefined): string {
  return userId ? `clerk-user:${userId}` : 'anonymous';
}

export function careerStorageKey(key: string, accountScope: string): string {
  return `${key}/${encodeURIComponent(accountScope)}`;
}