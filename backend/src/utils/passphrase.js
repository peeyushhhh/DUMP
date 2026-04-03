const crypto = require('crypto');

const WORDS = [
  'amber', 'azure', 'basin', 'birch', 'breeze', 'brook', 'canvas', 'cedar',
  'coral', 'creek', 'crimson', 'crystal', 'dawn', 'dew', 'dolphin', 'dune',
  'eagle', 'ember', 'falcon', 'fern', 'field', 'flint', 'forest', 'garden',
  'glacier', 'granite', 'harbor', 'hawk', 'hazel', 'heron', 'ivory', 'jade',
  'lagoon', 'lark', 'lichen', 'lilac', 'linen', 'maple', 'meadow', 'mist',
  'moss', 'oak', 'olive', 'orchid', 'pebble', 'pine', 'plum', 'pond', 'quartz',
  'raven', 'reed', 'ridge', 'river', 'sage', 'sand', 'sapphire', 'spruce',
  'stone', 'stream', 'summit', 'swan', 'thunder', 'tide', 'timber', 'violet',
  'willow', 'wren',
];

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function generatePassphrase() {
  const a = pickWord();
  let b = pickWord();
  let guard = 0;
  while (b === a && guard++ < 20) {
    b = pickWord();
  }
  const n = Math.floor(Math.random() * 100);
  const nn = String(n).padStart(2, '0');
  return `${a}-${b}-${nn}`;
}

function hashPassphrase(passphrase) {
  const normalized = String(passphrase ?? '').trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

module.exports = {
  generatePassphrase,
  hashPassphrase,
};
