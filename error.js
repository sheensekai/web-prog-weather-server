const createError = require('http-errors');

const errorMessages = {};
errorMessages[400] = "No city name or coordinates were specified";
errorMessages[404] = "Couldn't find city's weather state";
errorMessages[429] = "Too many requests to external weather api";
errorMessages[500] = "Failed to send a request to an external service";

module.exports = {
    errorMessages: errorMessages,
    makeError: function(status) {
        throw createError(status, errorMessages[status]);
    }
}