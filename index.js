require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const shorturlRoutes = require('./src/routes/shorturlRoutes');
const shorturlController = require('./src/controllers/shorturlController');
const { errorHandler } = require('./src/middleware/errorHandler');
const { Log, getLoggingAuthToken } = require('./logging-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

async function initializeLogging() {
    try {
        await getLoggingAuthToken();
        Log("backend", "info", "middleware", "Logging init complete.");
    } catch (error) {
        console.error("Failed to initialize logging middleware:", error.message);
    }
}

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const logMessage = `Req: ${req.method} ${req.originalUrl}`.substring(0, 48);
    Log("backend", "debug", "middleware", logMessage);
    next();
});

app.use('/shorturls', shorturlRoutes);

app.get('/:shortcode', shorturlController.redirectToOriginalUrl);

app.use(errorHandler);

async function startServer() {
    await initializeLogging();
    app.listen(PORT, () => {
        console.log(`URL Shortener Microservice listening on port ${PORT}`);
        console.log(`Access the service at: ${process.env.HOSTNAME}`);
        Log("backend", "info", "service", `URL Shortener started on port ${PORT}.`);
    });
}

startServer();