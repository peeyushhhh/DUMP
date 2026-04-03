import axiosInstance from './axiosInstance';

export async function savePassphrase(anonId, passphraseHash) {
  const { data } = await axiosInstance.post('/recovery/save', {
    anonId,
    passphraseHash,
  });
  return data;
}

export async function recoverIdentity(passphrase) {
  const { data } = await axiosInstance.post('/recovery/recover', { passphrase });
  return data?.data?.anonId ?? null;
}
