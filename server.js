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
const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost/my-nodejs-weather-server');
const dbName = "weather";
const collectionName = "favourites";
let db, col, client, timeCol;

// 10 minutes
const timeBeforeUpdate = 1000 * 60 * 10;

mongoClient.connect(function(err, dbClient){
    db = dbClient.db(dbName);
    col = db.collection(collectionName);
    timeCol = db.collection("time");
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
                    .catch(() => res.sendStatus(404));
            },
            function (response) {
                res.sendStatus(404);
            },
            function (response) {
                res.sendStatus(429);
            }));
}

async function updateCities(cityStates) {
    for (let cityState of cityStates) {
        console.log("current state:");
        console.log(cityState);
        const cityName = cityState.cityName;
        await weatherReq.makeCityWeatherRequest(cityName, (response) =>
            weatherReq.processResponse(response, async function (response) {
                const responseText = await response.text();
                const state = weatherReq.getWeatherStateFromResponse(responseText);
                console.log("found state:");
                console.log(state);
                await col.deleteOne(cityState);
                await col.insertOne(state);
                },
                function (response) {
                },
                function (response) {
                }));
    }
    const newUpdateTime = {lastUpdateTime: new Date()};
    await timeCol.replaceOne({}, newUpdateTime);
}

async function checkIfNeedToUpdate() {
    const result = await timeCol.findOne({});
    const currTime = new Date();
    const lastUpdateTime = result.lastUpdateTime;
    const diff = currTime - lastUpdateTime;
    return diff > timeBeforeUpdate;
}

async function getFavouriteCitiesRespond(res, cityName = null) {
    let toUpdate = await checkIfNeedToUpdate();
    if (toUpdate) {
        const result = await col.find().toArray();
        await updateCities(result);
    }

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