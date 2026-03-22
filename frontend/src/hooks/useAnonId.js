import { useState } from 'react';

const ANON_ID_KEY = 'anonId';

export function useAnonId() {
  const [anonId] = useState(() => {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  });

  return anonId;
}
