import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetPoemQueryKey, getListPoemsQueryKey, recordPoemView, type Poem,
} from '@workspace/api-client-react';

export function usePoemView(id: number, ready: boolean) {
  const { isLoaded, userId } = useAuth();
  const qc = useQueryClient();
  // One ID per opening, reused for strict-mode effects and network retries.
  const requestId = useMemo(() => crypto.randomUUID(), [id]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready || !isLoaded) return;
    let active = true;
    setError(false);
    recordPoemView(id, { requestId }).then(({ viewCount }) => {
      if (!active) return;
      const update = (poem: Poem) => poem.id === id ? { ...poem, viewCount } : poem;
      qc.setQueryData<Poem>(getGetPoemQueryKey(id), old => old ? update(old) : old);
      qc.setQueryData<Poem[]>(getListPoemsQueryKey(), old => old?.map(update));
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, ready, isLoaded, userId, requestId, attempt, qc]);

  return { error, retry: () => setAttempt(n => n + 1) };
}