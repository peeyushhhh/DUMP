const mongoose = require('mongoose');

const recoverySchema = new mongoose.Schema(
  {
    passphraseHash: {
      type: String,
      required: true,
      unique: true,
    },
    anonId: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const Recovery = mongoose.model('Recovery', recoverySchema);

module.exports = Recovery;
