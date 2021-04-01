// 10 minutes
const timeBeforeUpdate = 1000 * 60 * 10;
const server = require("./server");
const weatherReq = require("./weather_req");

let db, col, timeCol, client;


module.exports = {
    loadVariables: function() {
        db = server.db;
        col = server.col;
        timeCol = server.timeCol;
        client = server.client;
    },

    makeBadResult: function (status = null) {
        if (status === null) {
            return {status: 404, weatherState: null};
        } else {
            return {status: status, weatherState: null};
        }
    },

    makeResult: function (status, weatherState = null) {
        return {status: status, weatherState: weatherState};
    },

    updateCities: async function () {
        const cityStates = await col.find().toArray();

        for (let cityState of cityStates) {
            const cityName = cityState.cityName;
            const result = await weatherReq.getWeatherStateByCityName(cityName);
            if (result.status === 200) {
                await col.replaceOne(cityState, result.weatherState);
            } else {
                return result;
            }
        }

        const newUpdateTime = {lastUpdateTime: new Date()};
        await timeCol.replaceOne({}, newUpdateTime);
        return this.makeResult(200);
    },

    checkIfNeedToUpdate: async function () {
        const result = await timeCol.findOne({});
        const currTime = new Date();
        const lastUpdateTime = result.lastUpdateTime;
        const diff = currTime - lastUpdateTime;
        return diff > timeBeforeUpdate;
    },

    getCityByName: async function (cityName) {
        if (cityName === null) {
            return this.makeBadResult();
        }
        return await weatherReq.getWeatherStateByCityName(cityName);
    },

    getCityByCoordinates: async function (latitude, longitude) {
        if (latitude === null || longitude === null) {
            return this.makeBadResult();
        }
        return await weatherReq.getWeatherStateByCoords(latitude, longitude);
    },

    addFavourite: async function (cityName) {
        if (cityName === null) {
            return this.makeBadResult();
        }

        const result = await weatherReq.getWeatherStateByCityName(cityName);
        if (result.status !== 200) {
            return this.makeResult(result.status, null);
        } else {
            const weatherState = result.weatherState;
            const cityName = weatherState.cityName;
            const currentWeatherState = await col.findOne({cityName: cityName});
            if (currentWeatherState !== null) {
                await col.deleteOne(currentWeatherState);
            }
            await col.insertOne(weatherState);
            return this.makeResult(200, weatherState);
        }
    },

    deleteFavourite: async function (cityName) {
        if (cityName === null) {
            return this.makeBadResult();
        }

        const weatherState = await col.findOne({cityName: cityName});
        if (weatherState === null) {
            return this.makeBadResult();
        } else {
            await col.deleteOne(weatherState);
            return this.makeResult(200, weatherState);
        }
    },

    getFavourites: async function (cityName = null) {
        let toUpdate = await this.checkIfNeedToUpdate();
        if (toUpdate) {
            const result = await this.updateCities();
            if (result.status !== 200) {
                return this.makeBadResult(result.status);
            }
        }

        if (cityName != null) {
            const weatherState = await col.findOne({cityName: cityName});
            if (weatherState === null) {
                return this.makeBadResult();
            }

            const result = await weatherReq.getWeatherStateByCityName(cityName);
            if (result.status === 200) {
                await col.replaceOne({cityName: cityName}, result.weatherState);
                return this.makeResult(200, result.weatherState);
            } else {
                return this.makeBadResult();
            }
        } else {
            const cityStates = await col.find().toArray();
            return this.makeResult(200, cityStates);
        }
    }
}

