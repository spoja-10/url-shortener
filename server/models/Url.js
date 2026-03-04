const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
    },
    customCode: { type: Boolean, default: false },
    clicks: { type: Number, default: 0 },
    clickHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        referrer: String,
        userAgent: String,
      },
    ],
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0, sparse: true },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

urlSchema.index({ shortCode: 1 });
urlSchema.index({ originalUrl: 1 });
urlSchema.index({ createdAt: -1 });

urlSchema.virtual('shortUrl').get(function () {
  return `${process.env.BASE_URL}/${this.shortCode}`;
});

urlSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

urlSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Url', urlSchema);
