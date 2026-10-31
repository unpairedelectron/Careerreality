import type { QueryClient } from "@tanstack/react-query";

const AUTH_USER_CHANGE_CHANNEL = "career-reality-auth-user-change";
const AUTH_USER_CHANGE_MESSAGE = "user-changed";

export function clearQueryCacheOnAuthUserChange(
  queryClient: QueryClient,
  previousUserId: { current: string | null | undefined },
  userId: string | null,
) {
  if (previousUserId.current !== undefined && previousUserId.current !== userId) {
    queryClient.clear();
    previousUserId.current = userId;
    return true;
  }
  previousUserId.current = userId;
  return false;
}

export function createCrossTabAuthUserChangeSync(queryClient: QueryClient) {
  if (typeof BroadcastChannel === "undefined") {
    return {
      notify: () => {},
      dispose: () => {},
    };
  }

  const channel = new BroadcastChannel(AUTH_USER_CHANGE_CHANNEL);
  const onMessage = (event: MessageEvent<unknown>) => {
    if (event.data === AUTH_USER_CHANGE_MESSAGE) {
      queryClient.clear();
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
