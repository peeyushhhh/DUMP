import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { generatePassphrase, hashPassphrase } from '../utils/passphrase';
import {
  savePassphrase as savePassphraseApi,
  recoverIdentity as recoverIdentityApi,
} from '../services/recoveryService';

const AnonContext = createContext(null);

export function AnonProvider({ children }) {
  const isNewAnonOnInit = useRef(false);

  const [anonId, setAnonId] = useState(() => {
    const existing = localStorage.getItem('anonId');
    if (existing) return existing;
    isNewAnonOnInit.current = true;
    const id = crypto.randomUUID();
    localStorage.setItem('anonId', id);
    return id;
  });

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [generatedPassphrase, setGeneratedPassphrase] = useState('');
  const [recoverySetUp, setRecoverySetUp] = useState(
    () => localStorage.getItem('dump_recovery_set') === 'true'
  );

  useEffect(() => {
    if (!isNewAnonOnInit.current) return;
    isNewAnonOnInit.current = false;
    if (localStorage.getItem('dump_recovery_set') === 'true') return;
    setGeneratedPassphrase(generatePassphrase());
    setShowRecoveryModal(true);
  }, []);

  const confirmSavePassphrase = useCallback(async () => {
    const hash = await hashPassphrase(generatedPassphrase);
    await savePassphraseApi(anonId, hash);
    localStorage.setItem('dump_recovery_set', 'true');
    setRecoverySetUp(true);
    setShowRecoveryModal(false);
  }, [anonId, generatedPassphrase]);

  const recoverIdentity = useCallback(async (passphrase) => {
    try {
      const returnedAnonId = await recoverIdentityApi(passphrase);
      if (!returnedAnonId) return false;
      localStorage.setItem('anonId', returnedAnonId);
      setAnonId(returnedAnonId);
      return true;
    } catch {
      return false;
    }
  }, []);

  const requestNewRecoveryCode = useCallback(() => {
    localStorage.removeItem('dump_recovery_set');
    setRecoverySetUp(false);
    setGeneratedPassphrase(generatePassphrase());
    setShowRecoveryModal(true);
  }, []);

  const value = {
    anonId,
    showRecoveryModal,
    generatedPassphrase,
    setShowRecoveryModal,
    recoverySetUp,
    confirmSavePassphrase,
    recoverIdentity,
    requestNewRecoveryCode,
  };

  return (
    <AnonContext.Provider value={value}>
      {children}
    </AnonContext.Provider>
  );
}

export function useAnon() {
  return useContext(AnonContext);
}

export default AnonProvider;
