require('dotenv').config();
const express = require("express");
const cors = require('cors');
const weatherReq = require("./weather_req");
const fetch = require("node-fetch");

const app = express();
const port = process.env.PORT || 3000;
app.listen(port);
app.use(cors());
app.options('*', cors());

const MongoClient = require("mongodb").MongoClient;
const mongoDbUrl = "mongodb+srv://sheensekai:continious@cluster0.iiysk.mongodb.net/weather?retryWrites=true&w=majority";
const mongoClient = new MongoClient(mongoDbUrl || 'mongodb://localhost/my-nodejs-weather-server');
const dbName = "weather";
const collectionName = "favourites";
let db, col, client;

mongoClient.connect(function(err, dbClient){
    db = dbClient.db(dbName);
    col = db.collection(collectionName);
    client = dbClient;
});

function findCityRespond(source, res) {
    weatherReq.makeSourceWeatherRequest(source, (response) =>
        weatherReq.processResponse(response,
            function (response) {
                response.text()
                    .then(function (responseText) {
                        const state = weatherReq.getWeatherStateFromResponse(responseText);
                        res.send(state);
                    })
                    .catch(() => res.sendStatus(404));
            }),
        function (response) {
            res.sendStatus(404);
        },
        function (response) {
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
    weatherReq.makeSourceWeatherRequest(source, (response) =>
        weatherReq.processResponse(response, function (response) {
                response.text()
                    .then(function (responseText) {
                        const state = weatherReq.getWeatherStateFromResponse(responseText);
                        col.findOne({cityId: state.cityId}, function(err, result) {
                            if (toAdd) {
                                addFavourite(col, state, res, err, result, client);
                            } else {
                                deleteFavourite(col, state, res, err, result, client);
                            }
                        });
                    })
                    .catch(res.sendStatus(404));
            },
            function (response) {
                res.sendStatus(404);
            },
            function (response) {
                res.sendStatus(429);
            }));

}

function getFavouriteCitiesRespond(res, cityName = null) {
    if (cityName != null) {
        col.findOne({cityName: cityName}, function(err, result) {
            if (result === null) {
                res.sendStatus(404);
            } else {
                weatherReq.makeCityWeatherRequest(cityName, (response) =>
                    weatherReq.processResponse(response, function (response) {
                        response.text()
                            .then(function (responseText) {
                                const state = weatherReq.getWeatherStateFromResponse(responseText);
                                col.replaceOne({cityName: cityName}, state);
                                res.send([state]);
                            }).catch(() => res.sendStatus(404));
                        },
                        function (response) {
                            res.sendStatus(404);
                        },
                        function (response) {
                            res.sendStatus(429);
                        }));
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