"use strict";
const axios = require("axios");

module.exports.main = (config) => {

    var fromtime = new Date();
    fromtime.setMilliseconds(fromtime.getMilliseconds() - config.interval);

    // Use UTC hour
    const period = [{ 
        from: fromtime.toISOString().replace("Z", ""), 
        to: new Date().toISOString().replace("Z", "")
    }];

    const requestURL = '$_[infrastructure.internal.reporter.default]/api/v4/contracts/' + config.agreementId + '/createPointsFromPeriods';

    axios.post(requestURL, {periods: period}).then((response) => {
        console.log("Finished points creation for TPA:", config.agreementId);
    }).catch((error) => {
        console.log("Error when creating points for TPA:", config.agreementId, "\n", error);
    });
}

