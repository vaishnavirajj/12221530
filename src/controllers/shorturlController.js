const shorturlService = require('../services/shorturlService');
const { Log } = require('../../logging-middleware');

const createShortUrl = async (req, res, next) => {
    try {
        const { url, validity, shortcode } = req.body;
        const result = await shorturlService.createShortUrl({
            originalUrl: url,
            validity,
            customShortcode: shortcode
        });
        Log("backend", "info", "controller", `Short URL created: ${result.shortLink.split('/').pop()}`);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const redirectToOriginalUrl = async (req, res, next) => {
    try {
        const shortcode = req.params.shortcode;
        const clickInfo = {
            referrer: req.headers.referer || req.headers.referrer,
            ip: req.ip
        };
        const originalUrl = await shorturlService.getOriginalUrlAndLogClick(shortcode, clickInfo);
        Log("backend", "info", "controller", `Redirecting ${shortcode}`);
        res.redirect(originalUrl);
    } catch (error) {
        next(error);
    }
};

const getShortUrlStats = async (req, res, next) => {
    try {
        const shortcode = req.params.shortcode;
        const stats = await shorturlService.getShortUrlStatistics(shortcode);
        Log("backend", "info", "controller", `Stats retrieved for ${shortcode}`);
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShortUrl,
    redirectToOriginalUrl,
    getShortUrlStats
};