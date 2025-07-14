const urlStore = require('../data/urlStore');
const { generateUniqueShortcode, isValidCustomShortcode } = require('../utils/shortcodeGenerator');
const { isValidUrl, isValidValidity } = require('../utils/validation');
const { ApiError } = require('../middleware/errorHandler');
const { Log } = require('../../logging-middleware');
const moment = require('moment');

const HOSTNAME = process.env.HOSTNAME || 'http://localhost:3000';

const DEFAULT_VALIDITY_MINUTES = 30;

const createShortUrl = async ({ originalUrl, validity, customShortcode }) => {
    if (!isValidUrl(originalUrl)) {
        Log("backend", "warn", "service", `Invalid URL: ${originalUrl.substring(0, Math.min(originalUrl.length, 30))}...`);
        throw new ApiError("Invalid URL format.", 400);
    }
    if (validity !== undefined && !isValidValidity(validity)) {
        Log("backend", "warn", "service", `Invalid validity: ${validity}`);
        throw new ApiError("Validity must be a positive integer.", 400);
    }

    let shortcode = '';
    if (customShortcode) {
        if (!isValidCustomShortcode(customShortcode)) {
            Log("backend", "warn", "service", `Invalid custom code: ${customShortcode}`);
            throw new ApiError("Custom shortcode must be alphanumeric or hyphen/underscore, 4-10 characters long.", 400);
        }
        if (urlStore.exists(customShortcode)) {
            Log("backend", "error", "service", `Shortcode collision: ${customShortcode}`);
            throw new ApiError("Custom shortcode already in use. Please choose another.", 409);
        }
        shortcode = customShortcode;
        Log("backend", "info", "service", `Using custom shortcode: ${shortcode}`);
    } else {
        do {
            shortcode = generateUniqueShortcode();
        } while (urlStore.exists(shortcode));
        Log("backend", "info", "service", `Generated unique shortcode: ${shortcode}`);
    }

    const createdAt = moment().toISOString();
    const actualValidity = validity || DEFAULT_VALIDITY_MINUTES;
    const expiryDate = moment().add(actualValidity, 'minutes').toISOString();

    const urlData = {
        originalUrl,
        shortcode,
        shortLink: `${HOSTNAME}/${shortcode}`,
        expiryDate,
        createdAt,
        clickCount: 0,
        clickDetails: []
    };
    urlStore.addUrl(shortcode, urlData);
    Log("backend", "info", "db", `Short URL created for ${shortcode}`);

    return { shortLink: urlData.shortLink, expiry: urlData.expiryDate };
};

const getOriginalUrlAndLogClick = async (shortcode, clickInfo) => {
    const urlData = urlStore.getUrl(shortcode);

    if (!urlData) {
        Log("backend", "warn", "service", `Non-existent shortcode: ${shortcode}`);
        throw new ApiError("Short link not found.", 404);
    }

    if (moment().isAfter(moment(urlData.expiryDate))) {
        Log("backend", "warn", "service", `Expired shortcode: ${shortcode}`);
        throw new ApiError("Short link has expired.", 410);
    }

    urlData.clickCount++;
    urlData.clickDetails.push({
        timestamp: moment().toISOString(),
        source: clickInfo.referrer || 'direct',
        ipAddress: clickInfo.ip || 'unknown'
    });
    urlStore.updateUrl(shortcode, urlData);

    Log("backend", "info", "service", `Redirecting ${shortcode}`);
    return urlData.originalUrl;
};

const getShortUrlStatistics = async (shortcode) => {
    const urlData = urlStore.getStats(shortcode);

    if (!urlData) {
        Log("backend", "warn", "service", `Stats not found for shortcode: ${shortcode}`);
        throw new ApiError("Short link statistics not found.", 404);
    }

    Log("backend", "info", "service", `Retrieving stats for ${shortcode}`);
    return {
        shortcode: urlData.shortcode,
        originalUrl: urlData.originalUrl,
        creationDate: urlData.createdAt,
        expiryDate: urlData.expiryDate,
        totalClicks: urlData.clickCount,
        clickDetails: urlData.clickDetails.map(click => ({
            timestamp: click.timestamp,
            source: click.source,
            location: click.ipAddress
        }))
    };
};

module.exports = {
    createShortUrl,
    getOriginalUrlAndLogClick,
    getShortUrlStatistics
};