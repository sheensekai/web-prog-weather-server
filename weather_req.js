module.exports = {
    sendWeatherRequest: async function (params) {
        const fetch = require("node-fetch");
        const url = new URL("https://community-open-weather-map.p.rapidapi.com/weather");
        for (let name in params) {
            url.searchParams.append(name, params[name]);
        }
        url.searchParams.append("units", "metric");
        url.searchParams.append("lang", "ru");

        const api_key = "76e83c9996msh3301669dd80d319p145896jsn558cf76c2a22";
        const host = "community-open-weather-map.p.rapidapi.com";
        const method = "GET";

        return await fetch(url, {
            "method": method,
            "headers": {
                "x-rapidapi-key": api_key,
                "x-rapidapi-host": host,
            }
        });
    },

    getWeatherState: async function (params) {
        const response = await this.sendWeatherRequest(params);
        let weatherState = null;
        if (response.status === 200) {
            const jsonResponse = await response.json();
            weatherState = this.getWeatherStateFromResponse(jsonResponse);

        }
        return {status: response.status, weatherState: weatherState};
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




