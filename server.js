require('dotenv').config();
const express = require("express");
const cors = require('cors');
const weatherReq = require("./weather_req");

const app = express();
const port = process.env.PORT || 3000;
app.listen(port);
app.use(cors());
app.options('*', cors());

const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost/my-nodejs-weather-server');
const dbName = "weather";
const collectionName = "favourites";
let db, col, client;

mongoClient.connect(function(err, dbClient){
    db = dbClient.db(dbName);
    col = db.collection(collectionName);
    client = dbClient;
});

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

function addFavourite(col, state, res, err, result) {
    if (result) {
        res.sendStatus(404);
    } else {
        col.insertOne(state, function(err, result){
            if (err) {
                console.log(err);
            }
            res.send(state);
        });
    }
}

function deleteFavourite(col, state, res, err, result) {
    if (result) {
        col.deleteOne(result);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
}

function favouriteCityRespond(source, res, toAdd) {
    const xhr = weatherReq.makeSourceWeatherRequest(source);
    weatherReq.sendWeatherRequest(xhr, function (xhr) {
            const state = weatherReq.getWeatherStateFromResponse(xhr.responseText);
            col.findOne({cityId: state.cityId}, function(err, result) {
                if (toAdd) {
                    addFavourite(col, state, res, err, result, client);
                } else {
                    deleteFavourite(col, state, res, err, result, client);
                }
            });
        },
        function (xhr) {
            res.sendStatus(404);
        },
        function (xhr) {
            res.sendStatus(429);
        });
}

function getFavouriteCitiesRespond(res, cityName = null) {
    if (cityName != null) {
        col.findOne({cityName: cityName}, function(err, result) {
            if (result === null) {
                res.sendStatus(404);
            } else {
                const xhr = weatherReq.makeCityWeatherRequest(cityName);
                weatherReq.sendWeatherRequest(xhr, function (xhr) {
                        const state = weatherReq.getWeatherStateFromResponse(xhr.responseText);
                        col.replaceOne({cityName: cityName}, state);
                        res.send([state]);
                    },
                    function (xhr) {
                        res.sendStatus(404);
                    },
                    function (xhr) {
                        res.sendStatus(429);
                    });
            }
        });
    } else {
        col.find().toArray(function(err, result) {
            res.send(result);
        });
    }
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
    const cityName = req.query.cityName;
    const source = {byCity: true, cityName: cityName};
    favouriteCityRespond(source, res, true);
});

app.delete("/weather/favourites", function(req, res){
    const cityName = req.query.cityName;
    const source = {byCity: true, cityName: cityName};
    favouriteCityRespond(source, res, false);
});

app.get("/weather/favourites", function(req, res){
    getFavouriteCitiesRespond(res, req.query.cityName);
});