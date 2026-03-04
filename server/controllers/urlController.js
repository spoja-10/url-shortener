const { nanoid } = require('nanoid');
const validUrl = require('valid-url');
const Url = require('../models/Url');
const { getRedis } = require('../config/redis');

const CACHE_TTL = 3600;

const buildResponse = (url) => ({
  id: url._id,
  originalUrl: url.originalUrl,
  shortCode: url.shortCode,
  shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
  clicks: url.clicks,
  createdAt: url.createdAt,
  expiresAt: url.expiresAt,
  isActive: url.isActive,
});

// POST /api/urls — create short URL
const createShortUrl = async (req, res) => {
  const { originalUrl, customCode, expiresIn } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }
  if (!validUrl.isWebUri(originalUrl)) {
    return res.status(400).json({ error: 'Please provide a valid URL (including http:// or https://)' });
  }
  if (customCode) {
    if (customCode.length < 4 || customCode.length > 20) {
      return res.status(400).json({ error: 'Custom code must be 4-20 characters' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(customCode)) {
      return res.status(400).json({ error: 'Custom code may only contain letters, numbers, hyphens, underscores' });
    }
  }

  try {
    if (customCode) {
      const taken = await Url.findOne({ shortCode: customCode });
      if (taken) return res.status(409).json({ error: 'This custom code is already taken' });
    }

    if (!customCode) {
      const existing = await Url.findOne({ originalUrl, customCode: false, isActive: true });
      if (existing && !existing.isExpired()) {
        return res.status(200).json(buildResponse(existing));
      }
    }

    let expiresAt = null;
    if (expiresIn) {
      const days = parseInt(expiresIn, 10);
      if (!isNaN(days) && days > 0 && days <= 365) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }

    const shortCode = customCode || nanoid(6);
    const url = await Url.create({ originalUrl, shortCode, customCode: Boolean(customCode), expiresAt });
    return res.status(201).json(buildResponse(url));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Short code collision — please try again' });
    }
    console.error('createShortUrl error:', err);
    return res.status(500).json({ error: 'Server error — could not create short URL' });
  }
};

// GET /:shortCode — redirect
const redirectToUrl = async (req, res) => {
  const { shortCode } = req.params;
  const redis = getRedis();

  try {
    if (redis) {
      const cached = await redis.get(`url:${shortCode}`);
      if (cached) {
        const { originalUrl, id } = JSON.parse(cached);
        Url.findByIdAndUpdate(id, {
          $inc: { clicks: 1 },
          $push: { clickHistory: { $each: [{ referrer: req.headers.referer || '', userAgent: req.headers['user-agent'] || '' }], $slice: -100 } },
        }).exec();
        return res.redirect(301, originalUrl);
      }
    }

    const url = await Url.findOne({ shortCode, isActive: true });
    if (!url) return res.status(404).json({ error: 'Short URL not found' });
    if (url.isExpired()) {
      await Url.findByIdAndUpdate(url._id, { isActive: false });
      return res.status(410).json({ error: 'This link has expired' });
    }

    await Url.findByIdAndUpdate(url._id, {
      $inc: { clicks: 1 },
      $push: { clickHistory: { $each: [{ referrer: req.headers.referer || '', userAgent: req.headers['user-agent'] || '' }], $slice: -100 } },
    });

    if (redis) {
      await redis.setex(`url:${shortCode}`, CACHE_TTL, JSON.stringify({ originalUrl: url.originalUrl, id: url._id }));
    }

    return res.redirect(301, url.originalUrl);
  } catch (err) {
    console.error('redirectToUrl error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/urls — list all (paginated)
const getAllUrls = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  try {
    const [urls, total] = await Promise.all([
      Url.find({ isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-clickHistory'),
      Url.countDocuments({ isActive: true }),
    ]);
    return res.json({ urls: urls.map(buildResponse), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('getAllUrls error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/urls/:shortCode — stats
const getUrlStats = async (req, res) => {
  const { shortCode } = req.params;
  try {
    const url = await Url.findOne({ shortCode });
    if (!url) return res.status(404).json({ error: 'URL not found' });

    const dailyClicks = {};
    url.clickHistory.forEach((click) => {
      const day = click.timestamp.toISOString().split('T')[0];
      dailyClicks[day] = (dailyClicks[day] || 0) + 1;
    });

    return res.json({ ...buildResponse(url), dailyClicks, clickHistory: url.clickHistory.slice(-20) });
  } catch (err) {
    console.error('getUrlStats error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/urls/:shortCode
const deleteUrl = async (req, res) => {
  const { shortCode } = req.params;
  const redis = getRedis();
  try {
    const url = await Url.findOneAndUpdate({ shortCode }, { isActive: false }, { new: true });
    if (!url) return res.status(404).json({ error: 'URL not found' });
    if (redis) await redis.del(`url:${shortCode}`);
    return res.json({ message: 'URL deleted successfully' });
  } catch (err) {
    console.error('deleteUrl error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createShortUrl, redirectToUrl, getAllUrls, getUrlStats, deleteUrl };
