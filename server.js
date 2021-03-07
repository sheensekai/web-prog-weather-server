const express = require("express");
const app = express();

const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient("mongodb://localhost:27017");

app.listen(3000);

app.get("/weather/city", function(req, res){
    console.log("/weather/city GET");
    res.send("/weather/city GET");
});

app.get("/weather/coordinates", function(req, res){
    console.log("/weather/coordinates GET");
    res.send("/weather/coordinates GET");
});

app.post("/weather/favourites", function(req, res){
    console.log("/weather/favourites POST");
    res.send("/weather/favourites POST");
});

app.delete("/weather/favourites", function(req, res){
    console.log("/weather/favourites DELETE");
    res.send("/weather/favourites DELETE");
});