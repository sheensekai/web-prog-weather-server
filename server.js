require('dotenv').config();
const express = require("express");
const cors = require('cors');

const service = require("./service");
const error = require("./error");
const dao = require("./dao");

const port = process.env.PORT || 3000;
const app = express();

app.listen(port);
app.use(cors());
app.options('*', cors());
dao.runMongo();

app.get("/weather/city", async function(req, res){
    if (!req.query.hasOwnProperty("cityName")) {
        error.makeError(400);
    }
    const result = await service.getCityByName(req.query.cityName);
    res.json(result);
});

app.get("/weather/coordinates", async function(req, res){
    if (!req.query.hasOwnProperty("latitude") || !req.query.hasOwnProperty("longitude")) {
        error.makeError(400);
    }
    const result = await service.getCityByCoordinates(req.query.latitude, req.query.longitude);
    res.json(result);
});

app.post("/weather/favourites", async function(req, res){
    if (!req.query.hasOwnProperty("cityName")) {
        error.makeError(400);
    }
    const result = await service.addFavourite(req.query.cityName);
    res.json(result);
});

app.delete("/weather/favourites", async function(req, res){
    if (!req.query.hasOwnProperty("cityName")) {
        error.makeError(400);
    }
    const result = await service.deleteFavourite(req.query.cityName);
    res.json(result);
});

app.get("/weather/favourites", async function(req, res){
    const cityName = (req.query.hasOwnProperty("cityName") ? req.query.cityName : null);
    const result = await service.getFavourites(cityName)
    res.json(result);
});

app.use((error, req, res, next) => {
    console.log(error);
    res.status(error.status);
    res.json({ message: error.message});
})