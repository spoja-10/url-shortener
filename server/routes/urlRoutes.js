const express = require('express');
const router = express.Router();
const {
  createShortUrl,
  getAllUrls,
  getUrlStats,
  deleteUrl,
} = require('../controllers/urlController');

// @route  POST /api/urls
// @desc   Create a short URL
router.post('/', createShortUrl);

// @route  GET /api/urls
// @desc   Get all URLs (paginated)
router.get('/', getAllUrls);

// @route  GET /api/urls/:shortCode
// @desc   Get stats for a URL
router.get('/:shortCode', getUrlStats);

// @route  DELETE /api/urls/:shortCode
// @desc   Delete/deactivate a URL
router.delete('/:shortCode', deleteUrl);

module.exports = router;
