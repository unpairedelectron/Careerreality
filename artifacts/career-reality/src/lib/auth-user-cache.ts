import type { QueryClient } from "@tanstack/react-query";

export function clearQueryCacheOnAuthUserChange(
  queryClient: QueryClient,
  previousUserId: { current: string | null | undefined },
  userId: string | null,
) {
  if (previousUserId.current !== undefined && previousUserId.current !== userId) {
    queryClient.clear();
  }
  previousUserId.current = userId;
}
