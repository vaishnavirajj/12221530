const express = require('express');
const router = express.Router();
const shorturlController = require('../controllers/shorturlController');

router.post('/', shorturlController.createShortUrl);

router.get('/:shortcode', shorturlController.getShortUrlStats);

module.exports = router;