const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    anonId: {
      type: String,
      required: [true, 'anonId is required'],
      index: true,
      unique: true,
    },
    subscription: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'subscription is required'],
    },
  },
  {
    timestamps: true,
  }
);

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);

module.exports = PushSubscription;
