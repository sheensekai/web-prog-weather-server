require('dotenv').config();
const express = require("express");
const cors = require('cors');
const service = require("./service");

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

mongoClient.connect(function(err, dbClient){
    db = dbClient.db(dbName);
    col = db.collection(collectionName);
    timeCol = db.collection("time");
    client = dbClient;

    module.exports.db = db;
    module.exports.col = col;
    module.exports.timeCol = timeCol;
    module.exports.client = client;
    service.loadVariables();
});

function sendResult(result, res) {
    if (result.status === 200 && result.weatherState != null) {
        res.send(result.weatherState);
    } else {
        res.sendStatus(result.status);
    }
}

app.get("/weather/city", async function(req, res){
    const cityName = (req.query.hasOwnProperty("cityName") ? req.query.cityName : null);
    console.log(cityName);
    const result = await service.getCityByName(cityName);
    sendResult(result, res);
});

app.get("/weather/coordinates", async function(req, res){
    const latitude = (req.query.hasOwnProperty("latitude") ? req.query.latitude : null);
    const longitude = (req.query.hasOwnProperty("longitude") ? req.query.longitude : null);
    const result = await service.getCityByCoordinates(latitude, longitude);
    sendResult(result, res);
});

app.post("/weather/favourites", async function(req, res){
    const cityName = (req.query.hasOwnProperty("cityName") ? req.query.cityName : null);
    const result = await service.addFavourite(cityName);
    sendResult(result, res);
});

app.delete("/weather/favourites", async function(req, res){
    const cityName = (req.query.hasOwnProperty("cityName") ? req.query.cityName : null);
    const result = await service.deleteFavourite(cityName);
    sendResult(result, res);
});

app.get("/weather/favourites", async function(req, res){
    const cityName = (req.query.hasOwnProperty("cityName") ? req.query.cityName : null);
    const result = await service.getFavourites(cityName)
    sendResult(result, res);
});