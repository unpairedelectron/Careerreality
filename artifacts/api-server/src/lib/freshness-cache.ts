export type FreshnessReadStatus = "fresh" | "coalesced" | "refreshed";

export type FreshnessRead<T> = {
  value: T;
  status: FreshnessReadStatus;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export function createFreshnessCache<T>(
  freshnessMs: number,
  now: () => number = () => Date.now(),
) {
  const entries = new Map<string, CacheEntry<T>>();
  const inFlight = new Map<string, Promise<T>>();

  return {
    async get(
      key: string,
      load: () => Promise<T>,
    ): Promise<FreshnessRead<T>> {
      const cached = entries.get(key);
      if (cached && cached.expiresAt > now()) {
        return { value: cached.value, status: "fresh" };
      }
      if (cached) entries.delete(key);

      const pending = inFlight.get(key);
      if (pending) {
        return { value: await pending, status: "coalesced" };
      }

      const request = load().then((value) => {
        entries.set(key, { value, expiresAt: now() + freshnessMs });
        return value;
      });
      inFlight.set(key, request);

      try {
        return { value: await request, status: "refreshed" };
      } finally {
        if (inFlight.get(key) === request) inFlight.delete(key);
      }
    },
    clear(key: string) {
      entries.delete(key);
    },
  };
}