import type { QueryClient } from "@tanstack/react-query";

const AUTH_USER_CHANGE_CHANNEL = "career-reality-auth-user-change";
const AUTH_USER_CHANGE_MESSAGE = "user-changed";
const AUTH_USER_CHANGE_STORAGE_KEY = "career-reality-auth-user-change";
let authUserChangeVersion = 0;
let authUserChangeStorageSequence = 0;

export type AuthUserMutationSnapshot = {
  userId: string | null;
  version: number;
};

export function captureAuthUserMutation(userId: string | null): AuthUserMutationSnapshot {
  return { userId, version: authUserChangeVersion };
}

export function isAuthUserMutationCurrent(
  snapshot: AuthUserMutationSnapshot,
  currentUserId: string | null,
) {
  return snapshot.version === authUserChangeVersion && snapshot.userId === currentUserId;
}

function cancelAndClearQueryCache(queryClient: QueryClient) {
  void queryClient.cancelQueries().catch(() => {});
  queryClient.clear();
}

export function clearQueryCacheOnAuthUserChange(
  queryClient: QueryClient,
  previousUserId: { current: string | null | undefined },
  userId: string | null,
) {
  if (previousUserId.current !== undefined && previousUserId.current !== userId) {
    authUserChangeVersion += 1;
    cancelAndClearQueryCache(queryClient);
    previousUserId.current = userId;
    return true;
  }
  previousUserId.current = userId;
  return false;
}

export function createCrossTabAuthUserChangeSync(queryClient: QueryClient) {
  const clearForRemoteAuthChange = () => {
    authUserChangeVersion += 1;
    cancelAndClearQueryCache(queryClient);
  };

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(AUTH_USER_CHANGE_CHANNEL);
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.data === AUTH_USER_CHANGE_MESSAGE) {
        clearForRemoteAuthChange();
      }
    };
    channel.addEventListener("message", onMessage);

    return {
      notify: () => channel.postMessage(AUTH_USER_CHANGE_MESSAGE),
      dispose: () => {
        channel.removeEventListener("message", onMessage);
        channel.close();
      },
    };
  }

  const onStorage = (event: StorageEvent) => {
    if (
      event.key === AUTH_USER_CHANGE_STORAGE_KEY &&
      event.newValue?.startsWith(`${AUTH_USER_CHANGE_MESSAGE}:`)
    ) {
      clearForRemoteAuthChange();
    }
  };
  window.addEventListener("storage", onStorage);

  return {
    notify: () => {
      authUserChangeStorageSequence += 1;
      window.localStorage.setItem(
        AUTH_USER_CHANGE_STORAGE_KEY,
        `${AUTH_USER_CHANGE_MESSAGE}:${Date.now()}:${authUserChangeStorageSequence}:${window.crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      );
    },
    dispose: () => window.removeEventListener("storage", onStorage),
  };
}
