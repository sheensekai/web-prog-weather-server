module.exports = {
    makeWeatherRequest: async function(params, func, errFunc = null) {
        const fetch = require("node-fetch");
        const url = "https://community-open-weather-map.p.rapidapi.com/weather" + params + "&units=metric";
		//  + "&lang=ru";
        const api_key = "76e83c9996msh3301669dd80d319p145896jsn558cf76c2a22";
        const host = "community-open-weather-map.p.rapidapi.com";
        const method = "GET";

        const response = await fetch(url, {
            "method": method,
            "headers" : {
                "x-rapidapi-key": api_key,
                "x-rapidapi-host": host
            }});
        await func(response);
    },

    makeCoordsWeatherRequest: async function(latitude, longitude, func, errFunc = null) {
        const params = "?" + "lat" + "=" + latitude + "&" + "lon" + "=" + longitude;
        await this.makeWeatherRequest(params, func, errFunc);
    },

    makeCityWeatherRequest: async function(cityName, func, errFunc = null) {
        const params = "?" + "q" + "=" + cityName;
        await this.makeWeatherRequest(params, func, errFunc);
    },

    makeSourceWeatherRequest: async function(source, func, errFunc = null) {
        if (source.byCity) {
            return this.makeCityWeatherRequest(source.cityName, func, errFunc);
        } else {
            return this.makeCoordsWeatherRequest(source.latitude, source.longitude, func, errFunc);
        }
    },

    processResponse: async function(response, func, failFunc = null, tooManyReqFunc = null) {
        if (response.status === 200 && func != null) {
            await func(response);
        }
        if (response.status === 404 && failFunc != null) {
            await failFunc(response);
        }
        if (response.status === 429 && tooManyReqFunc != null) {
            await tooManyReqFunc(response);
        }
    },

    getWeatherStateFromResponse: function(responseText) {
        const response = JSON.parse(responseText);
        if (response === null) {
            return null;
        }
        return {
            "cityId": response.id,
            "cityName": response.name,
            "temp": Math.round(response.main.temp * 10) / 10,
            "feels_like": response.main.feels_like,
            "wind": response.wind.speed,
            "clouds": response.clouds.all,
            "pressure": response.main.pressure,
            "humidity": response.main.humidity,
            "iconId": response.weather[0].icon
        };
    }
}



