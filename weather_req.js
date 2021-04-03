const fetch = require("node-fetch");
const error = require("./error");

const hostUrl = process.env.HOST_URL;
const weatherApiKey = process.env.WEATHER_API_KEY;
const baseUrl = process.env.WEATHER_BASE_URL;
const weatherReqHeaders = {
    "x-rapidapi-key": weatherApiKey,
    "x-rapidapi-host": hostUrl
};

module.exports = {
    sendWeatherRequest: async function (params) {
        const url = new URL(baseUrl);
        for (let name in params) {
            url.searchParams.append(name, params[name]);
        }
        url.searchParams.append("units", "metric");
        url.searchParams.append("lang", "ru");

        return await fetch(url, {
            headers: weatherReqHeaders
        });
    },

    getWeatherState: async function (params) {
        const response = await this.sendWeatherRequest(params);
        console.log(response);
        const status = response.status;
        if (status !== 200) {
            error.makeError(status);
        }

        const jsonResponse = await response.json();
        return this.getWeatherStateFromResponse(jsonResponse);
    },

    getWeatherStateByCoords: async function (latitude, longitude) {
        const params = {lat: latitude, lon: longitude};
        return await this.getWeatherState(params);
    },

    getWeatherStateByCityName: async function (cityName) {
        const params = {q: cityName};
        return await this.getWeatherState(params);
    },

    getWeatherStateFromResponse: function (jsonResponse) {
        return {
            "cityId": jsonResponse.id,
            "cityName": jsonResponse.name,
            "temp": Math.round(jsonResponse.main.temp * 10) / 10,
            "feels_like": jsonResponse.main.feels_like,
            "wind": jsonResponse.wind.speed,
            "clouds": jsonResponse.clouds.all,
            "pressure": jsonResponse.main.pressure,
            "humidity": jsonResponse.main.humidity,
            "iconId": jsonResponse.weather[0].icon
        };
    }
}




