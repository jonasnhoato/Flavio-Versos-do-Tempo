import { useAuth } from '@clerk/react';
import { getGetBlogInfoQueryKey, useGetBlogInfo } from '@workspace/api-client-react';

export function useAuthorAccess() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  // Permissions must not be reused across identities, even during sign-out.
  const query = useGetBlogInfo({
    query: {
      queryKey: [...getGetBlogInfoQueryKey(), userId ?? 'visitor'],
      enabled: isLoaded,
    },
  });
  return {
    ...query,
    data: query.data ? { ...query.data, canEdit: !!isSignedIn && query.data.canEdit } : undefined,
  };
}