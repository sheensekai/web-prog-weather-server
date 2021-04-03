const weatherReq = require("./weather_req");
const server = require("./server");
const error = require("./error");
const dao = require("./dao");

// 10 minutes
const timeBeforeUpdate = 1000 * 60 * 10;
let db, col, timeCol, client;

module.exports = {
    tryToUpdate: async function() {
        if (await this.checkIfNeedToUpdate()) {
            await this.updateCities();
        }
    },

    updateCities: async function () {
        const cityStates = await col.find().toArray();
        for (let cityState of cityStates) {
            const cityName = cityState.cityName;
            const weatherState = await weatherReq.getWeatherStateByCityName(cityName);
            await dao.replaceFavWeatherState(cityState, weatherState);
        }
        await dao.setNewUpdateTime();
    },

    checkIfNeedToUpdate: async function () {
        const lastUpdateTime = dao.getUpdateTime();
        const currTime = new Date();
        const diff = currTime - lastUpdateTime;
        return diff > timeBeforeUpdate;
    },

    getCityByName: async function (cityName) {
        return await weatherReq.getWeatherStateByCityName(cityName);
    },

    getCityByCoordinates: async function (latitude, longitude) {
        return await weatherReq.getWeatherStateByCoords(latitude, longitude);
    },

    addFavourite: async function (cityName) {
        const actualWeatherState = await weatherReq.getWeatherStateByCityName(cityName);
        await dao.addUpdateFavWeatherState(actualWeatherState);
        return actualWeatherState;
    },

    deleteFavourite: async function (cityName) {
        return await dao.deleteFavWeatherState(cityName);
    },

    getFavourites: async function (cityName = null) {
        await this.tryToUpdate();

        if (cityName != null) {
            const actualWeatherState = await weatherReq.getWeatherStateByCityName(cityName);
            const actualCityName = actualWeatherState.cityName;
            const weatherState = await dao.getWeatherStateAssert(actualCityName);
            await dao.replaceFavWeatherState(weatherState, actualWeatherState);
            return actualWeatherState;
        } else {
            return await dao.getAllFavWeatherStates();
        }
    }
}

