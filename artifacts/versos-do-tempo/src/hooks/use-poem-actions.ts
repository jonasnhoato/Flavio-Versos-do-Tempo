import { useQueryClient } from '@tanstack/react-query';
import {
  getGetBlogInfoQueryKey, getGetPoemQueryKey, getListPoemsQueryKey,
  useCreatePoem, useDeletePoem, useReorderPoems, useUpdatePoem,
} from '@workspace/api-client-react';

export function usePoemActions() {
  const qc = useQueryClient();
  const refresh = (id?: number) => {
    qc.invalidateQueries({ queryKey: getListPoemsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetBlogInfoQueryKey() });
    if (id !== undefined) qc.invalidateQueries({ queryKey: getGetPoemQueryKey(id) });
  };
  const create = useCreatePoem({ mutation: { onSuccess: () => refresh() } });
  const update = useUpdatePoem({ mutation: { onSuccess: (_d, v) => refresh(v.id) } });
  const remove = useDeletePoem({ mutation: { onSuccess: (_d, v) => { qc.removeQueries({ queryKey: getGetPoemQueryKey(v.id) }); refresh(); } } });
  const reorder = useReorderPoems({
    mutation: {
      onSuccess: (list) => { qc.setQueryData(getListPoemsQueryKey(), list); refresh(); },
      onError: () => refresh(),
    },
  });
  return { create, update, remove, reorder };
}
