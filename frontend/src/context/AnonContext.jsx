import { createContext, useContext } from 'react';
import { useAnonId } from '../hooks/useAnonId';

const AnonContext = createContext(null);

export function AnonProvider({ children }) {
  const anonId = useAnonId();

  return (
    <AnonContext.Provider value={{ anonId }}>
      {children}
    </AnonContext.Provider>
  );
}

export function useAnon() {
  return useContext(AnonContext);
}

export default AnonProvider;
