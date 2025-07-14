

const shortid = require('shortid');

shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_');

const generateUniqueShortcode = () => {
    return shortid.generate();
};

const isValidCustomShortcode = (shortcode) => {
    return /^[a-zA-Z0-9_-]{4,10}$/.test(shortcode);
};

module.exports = {
    generateUniqueShortcode,
    isValidCustomShortcode
};