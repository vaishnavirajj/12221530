const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
        return false;
    }
};

const isValidValidity = (validity) => {
    return typeof validity === 'number' && 
           Number.isInteger(validity) && 
           validity > 0 && 
           validity <= 525600;
};

module.exports = {
    isValidUrl,
    isValidValidity
};