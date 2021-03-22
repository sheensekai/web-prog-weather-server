module.exports = {
    makeWeatherRequest: function(params, func, errFunc = null) {
        const fetch = require("node-fetch");
        const url = "https://community-open-weather-map.p.rapidapi.com/weather" + params + "&units=metric";
		//  + "&lang=ru";
        const api_key = "76e83c9996msh3301669dd80d319p145896jsn558cf76c2a22";
        const host = "community-open-weather-map.p.rapidapi.com";
        const method = "GET";

        fetch(url, {
            "method": method,
            "headers" : {
                "x-rapidapi-key": api_key,
                "x-rapidapi-host": host
            }
        }).then((response) => func(response))
            .catch(function(err) {
                if (errFunc !== null) {
                    errFunc(err);
                }
            })
    },

    makeCoordsWeatherRequest: function(latitude, longitude, func, errFunc = null) {
        const params = "?" + "lat" + "=" + latitude + "&" + "lon" + "=" + longitude;
        this.makeWeatherRequest(params, func, errFunc);
    },

    makeCityWeatherRequest: function(cityName, func, errFunc = null) {
        const params = "?" + "q" + "=" + cityName;
        this.makeWeatherRequest(params, func, errFunc);
    },

    makeSourceWeatherRequest: function(source, func, errFunc = null) {
        if (source.byCity) {
            return this.makeCityWeatherRequest(source.cityName, func, errFunc);
        } else {
            return this.makeCoordsWeatherRequest(source.latitude, source.longitude, func, errFunc);
        }
    },

    processResponse: function(response, func, failFunc = null, tooManyReqFunc = null) {
        if (response.status === 200 && func != null) {
            func(response);
        }
        if (response.status === 404 && failFunc != null) {
            failFunc(response);
        }
        if (response.status === 429 && tooManyReqFunc != null) {
            tooManyReqFunc(response);
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



