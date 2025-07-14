require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LOGGING_BASE_URL = "http://20.244.56.144/evaluation-service";

let loggingClientId = process.env.CLIENT_ID;
let loggingClientSecret = process.env.CLIENT_SECRET;
let loggingAccessToken = '';

async function getLoggingAuthToken() {
    if (loggingAccessToken) {
        return loggingAccessToken;
    }

    if (!loggingClientId || !loggingClientSecret) {
        console.error("Logging credentials (CLIENT_ID or CLIENT_SECRET) missing in .env. Cannot get logging auth token.");
        console.error("Please ensure you've registered and updated CLIENT_ID and CLIENT_SECRET in your .env file.");
        return null;
    }

    const authEndpoint = `${LOGGING_BASE_URL}/auth`;
    const requestBody = {
        email: process.env.YOUR_EMAIL,
        name: process.env.YOUR_NAME,
        rollNo: process.env.YOUR_ROLL_NO,
        accessCode: process.env.YOUR_ACCESS_CODE,
        clientID: loggingClientId,
        clientSecret: loggingClientSecret
    };

    try {
        console.log("Logging Middleware: Attempting to get authentication token...");
        const response = await axios.post(authEndpoint, requestBody);
        loggingAccessToken = response.data.access_token;
        console.log("Logging Middleware: Authentication successful!");
        return loggingAccessToken;
    } catch (error) {
        console.error("Logging Middleware: Authentication failed!");
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error status:", error.response.status);
        } else {
            console.error("Error message:", error.message);
        }
        return null;
    }
}

const ALLOWED_STACKS = ["backend", "frontend"];
const ALLOWED_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const ALLOWED_BACKEND_PACKAGES = ["cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service"];
const ALLOWED_FRONTEND_PACKAGES = ["api", "component", "hook", "page", "state", "style"];
const ALLOWED_COMMON_PACKAGES = ["auth", "config", "middleware", "utils"];

async function Log(stack, level, packageName, message) {
    if (!loggingAccessToken) {
        const token = await getLoggingAuthToken();
        if (!token) {
            console.error("Logging Middleware: Failed to obtain access token. Skipping log.");
            return;
        }
    }

    if (!ALLOWED_STACKS.includes(stack)) {
        console.error(`Logging Middleware: Invalid stack: "${stack}".`);
        return;
    }
    if (!ALLOWED_LEVELS.includes(level)) {
        console.error(`Logging Middleware: Invalid level: "${level}".`);
        return;
    }

    let packageIsValid = false;
    if (ALLOWED_COMMON_PACKAGES.includes(packageName)) {
        packageIsValid = true;
    } else if (stack === "backend" && ALLOWED_BACKEND_PACKAGES.includes(packageName)) {
        packageIsValid = true;
    } else if (stack === "frontend" && ALLOWED_FRONTEND_PACKAGES.includes(packageName)) {
        packageIsValid = true;
    }

    if (!packageIsValid) {
        console.error(`Logging Middleware: Invalid package "${packageName}" for stack "${stack}".`);
        return;
    }

    if (message.length > 48) {
        console.warn(`Logging Middleware: Log message too long (${message.length} chars). Truncating to 48 chars.`);
        message = message.substring(0, 48);
    }

    const logEndpoint = `${LOGGING_BASE_URL}/logs`;
    const requestBody = {
        stack: stack,
        level: level,
        package: packageName,
        message: message
    };

    try {
        await axios.post(logEndpoint, requestBody, {
            headers: {
                'Authorization': `Bearer ${loggingAccessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Successfully logged: [${stack}, ${level}, ${packageName}] "${message}"`);
    } catch (error) {
        console.error("Logging Middleware: Log API call failed!");
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error status:", error.response.status);
            console.error("Error headers:", error.response.headers);
        } else {
            console.error("Error message:", error.message);
        }
    }
}

module.exports = { Log, getLoggingAuthToken };