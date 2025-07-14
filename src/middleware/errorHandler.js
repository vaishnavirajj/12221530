

const { Log } = require('../../logging-middleware');


const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errors = err.errors || [];

    const logMessage = `API Error: ${req.method} ${req.originalUrl.split('?')[0]} - ${message}`.substring(0, 48);
    Log("backend", "error", "handler", logMessage);

    res.status(statusCode).json({
        success: false,
        message: message,
        errors: errors
    });
};
class ApiError extends Error {
    constructor(message, statusCode = 500, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    errorHandler,
    ApiError
};