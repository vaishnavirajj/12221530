const urls = {};

const addUrl = (shortcode, urlData) => {
    urls[shortcode] = urlData;
};

const getUrl = (shortcode) => {
    return urls[shortcode];
};

const updateUrl = (shortcode, newData) => {
    if (urls[shortcode]) {
        urls[shortcode] = { ...urls[shortcode], ...newData };
        return true;
    }
    return false;
};

const exists = (shortcode) => {
    return !!urls[shortcode];
};

const getStats = (shortcode) => {
    return urls[shortcode];
};

module.exports = {
    addUrl,
    getUrl,
    updateUrl,
    exists,
    getStats
};