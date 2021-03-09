module.exports = {
    makeWeatherRequest: function(params, async = true) {
        const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        const url = "https://community-open-weather-map.p.rapidapi.com/weather" + params + "&units=metric";
		//  + "&lang=ru";
        const xhr = new XMLHttpRequest();
        const api_key = "76e83c9996msh3301669dd80d319p145896jsn558cf76c2a22";
        const host = "community-open-weather-map.p.rapidapi.com";
        const method = "GET";

        xhr.responseType = "json";
        xhr.open(method, url, async);
        xhr.setRequestHeader("x-rapidapi-key", api_key);
        xhr.setRequestHeader("x-rapidapi-host", host);
        return xhr;
    },

    makeCoordsWeatherRequest: function(latitude, longitude) {
        const params = "?" + "lat" + "=" + latitude + "&" + "lon" + "=" + longitude;
        return this.makeWeatherRequest(params);
    },

    makeCityWeatherRequest: function(cityName) {
        const params = "?" + "q" + "=" + cityName;
        return this.makeWeatherRequest(params);
    },

    makeSourceWeatherRequest: function(source) {
        if (source.byCity) {
            return this.makeCityWeatherRequest(source.cityName);
        } else {
            return this.makeCoordsWeatherRequest(source.latitude, source.longitude);
        }
    },

    sendWeatherRequest: function(xhr, func, failFunc = null, tooManyReqFunc = null) {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 && func != null) {
                    func(xhr);
                }
                if (xhr.status === 404 && failFunc != null) {
                    failFunc(xhr);
                }
                if (xhr.status === 429 && tooManyReqFunc != null) {
                    tooManyReqFunc(xhr);
                }
            }
        }
        xhr.send();
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



