const Recovery = require('../models/Recovery');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { hashPassphrase } = require('../utils/passphrase');

const savePassphrase = asyncHandler(async (req, res) => {
  const { anonId, passphraseHash } = req.body;

  if (!anonId || !passphraseHash) {
    return sendError(res, 'anonId and passphraseHash are required', 400);
  }

  const existingByAnon = await Recovery.findOne({ anonId: String(anonId) });
  if (existingByAnon) {
    return sendError(res, 'Recovery already set up for this identity', 400);
  }

  const existingByHash = await Recovery.findOne({ passphraseHash: String(passphraseHash) });
  if (existingByHash) {
    return sendError(res, 'Passphrase hash already registered', 409);
  }

  await Recovery.create({
    anonId: String(anonId),
    passphraseHash: String(passphraseHash),
  });

  return sendSuccess(res, {}, 'Recovery passphrase saved', 201);
});

const recoverIdentity = asyncHandler(async (req, res) => {
  const { passphrase } = req.body;

  if (passphrase == null || String(passphrase).trim() === '') {
    return sendError(res, 'passphrase is required', 400);
  }

  const passphraseHash = hashPassphrase(passphrase);
  const doc = await Recovery.findOne({ passphraseHash }).lean();

  if (!doc) {
    return sendError(res, 'No identity found for that passphrase', 404);
  }

  return sendSuccess(res, { anonId: doc.anonId });
});

module.exports = {
  savePassphrase,
  recoverIdentity,
};
