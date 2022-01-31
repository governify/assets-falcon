"use strict";
const axios = require("axios");

var last_hour = new Date();
last_hour.setHours(last_hour.getHours() - 1);

// Use UTC hour
const period = [{ 
    from: last_hour.toISOString().replace("Z", ""), 
    to: new Date().toISOString().replace("Z", "")
}];

module.exports.main = (config) => {
    const requestURL = '$_[infrastructure.internal.reporter.default]/api/v4/contracts/' + config.agreementId + '/createPointsFromPeriods';

    axios.post(requestURL, {periods: period}).then((response) => {
        console.log("Finished points creation for TPA:", config.agreementId);
    }).catch((error) => {
        console.log("Error when creating points for TPA:", config.agreementId, "\n", error);
    });
}

