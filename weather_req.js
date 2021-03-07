function makeWeatherRequest(params, async = true,) {
    const url = "https://community-open-weather-map.p.rapidapi.com/weather" + params + "&units=metric" + "&lang=ru";
    const xhr = new XMLHttpRequest();
    const api_key = "34e35a1d80msh1acf606c8def3adp132cbbjsn7f1eb5c439c4";
    const host = "community-open-weather-map.p.rapidapi.com";
    const method = "GET";

    xhr.responseType = "json";
    xhr.open(method, url, async);
    xhr.setRequestHeader("x-rapidapi-key", api_key);
    xhr.setRequestHeader("x-rapidapi-host", host);
    return xhr;
}

function makeCoordsWeatherRequest(latitude, longitude) {
    const params = "?" + "lat" + "=" + latitude + "&" + "lon" + "=" + longitude;
    return makeWeatherRequest(params);
}

function makeCityWeatherRequest(cityName, func) {
    const params = "?" + "q" + "=" + cityName;
    return makeWeatherRequest(params);
}

function makeSourceWeatherRequest(source) {
    if (source.byCity) {
        return makeCityWeatherRequest(source.cityName);
    } else {
        return makeCoordsWeatherRequest(source.latitude, source.longitude);
    }
}

function sendWeatherRequest(xhr, func, failFunc = null, tooManyReqFunc = null) {
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
}

function getWeatherStateFromResponse(response) {
    if (response === null) {
        return null;
    }
    return {
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