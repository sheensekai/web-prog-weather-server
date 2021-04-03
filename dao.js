

const mongodb = require("mongodb");
const error = require("./error");

const mongoDbUri = process.env.MONGODB_URI;
const MongoClient = mongodb.MongoClient;

const dbName = "weather";
const collectionName = "favourites";

let mongoClient, db, col, client, timeCol;

module.exports = {
    runMongo: function() {
        mongoClient = new MongoClient(mongoDbUri);

        mongoClient.connect(function(err, dbClient) {
            db = dbClient.db(dbName);
            col = db.collection(collectionName);
            timeCol = db.collection("time");
            client = dbClient;
            console.log("Connected to mongo successfully");
        });
    },

    getWeatherStateAssert: async function(cityName) {
        const weatherState = await this.getWeatherState(cityName);
        if (weatherState === null) {
            error.makeError(404);
        }
        return weatherState;
    },

    getWeatherState: async function(cityName) {
        try {
            return await col.findOne({cityName: cityName});
        } catch (e) {
            error.makeError(500);
        }
    },

    getUpdateTime: async function() {
        try {
            const result = await timeCol.findOne({});
            return result.lastUpdateTime;
        } catch (e) {
            error.makeError(500);
        }
    },

    setNewUpdateTime: async function () {
        try {
            const newUpdateTime = {lastUpdateTime: new Date()};
            await timeCol.replaceOne({}, newUpdateTime);
            return newUpdateTime;
        } catch (e) {
            error.makeError(500);
        }
    },

    replaceFavWeatherState: async function(oldWeatherState, newWeatherState) {
        try {
            await this.getWeatherStateAssert(oldWeatherState);
            await col.replaceOne(oldWeatherState, newWeatherState);
            return newWeatherState;
        } catch (e) {
            error.makeError(500);
        }
    },

    deleteFavWeatherState: async function(cityName) {
        try {
            const weatherState = await this.getWeatherStateAssert(cityName);
            await col.deleteOne(weatherState);
            return weatherState;
        } catch (e) {
            error.makeError(500);
        }
    },

    addUpdateFavWeatherState: async function(weatherState) {
        try {
            const cityName = weatherState.cityName;
            const currentWeatherState = await this.getWeatherState(cityName);
            if (currentWeatherState !== null) {
                await col.deleteOne(currentWeatherState);
            }
            await col.insertOne(weatherState);
            return weatherState;
        } catch (e) {
            error.makeError(500);
        }
    },

    getAllFavWeatherStates: async function() {
        try {
            return await col.find().toArray();
        } catch (e) {
            error.makeError(500);
        }
    }
}