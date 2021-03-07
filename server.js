const express = require("express");
const app = express();
const weatherReq = require("./weather_req");
const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient("mongodb://localhost:27017");
app.listen(3000);

function findCityRespond(source, res) {
    const xhr = weatherReq.makeSourceWeatherRequest(source);
    weatherReq.sendWeatherRequest(xhr, function (xhr) {
            const state = weatherReq.getWeatherStateFromResponse(xhr.responseText);
            res.send(state);
        },
        function (xhr) {
            res.sendStatus(404);
        },
        function (xhr) {
            res.sendStatus(429);
        });
}

app.get("/weather/city", function(req, res){
    const cityName = req.query.cityName;
    const source = {byCity: true, cityName: cityName};
    findCityRespond(source, res);
});

app.get("/weather/coordinates", function(req, res){
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;
    const source = {byCity: false, latitude: latitude, longitude: longitude}
    findCityRespond(source, res);
});

app.post("/weather/favourites", function(req, res){
    console.log("/weather/favourites POST");
    res.send("/weather/favourites POST");
});

app.delete("/weather/favourites", function(req, res){
    console.log("/weather/favourites DELETE");
    res.send("/weather/favourites DELETE");
});