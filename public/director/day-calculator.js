"use strict";
const axios = require("axios");
var start = new Date();
start.setDate(start.getDate() - 1);
start.setHours(0, 0, 0, 0);

var end = new Date();
end.setDate(end.getDate());
end.setHours(0, 0, 0, 0);

// Use UTC hour
const period = [{
    "from": start.toISOString(),
    "to": end.toISOString()
}];

let status = {
    lastExecution: new Date(),
    lastResult: null,
    success: true
};


module.exports.main = async function (config) {

    var d = new Date();
    var hours = d.getHours();
    if (hours < 2) {

        var start2 = new Date();
        start2.setDate(start2.getDate());
        start2.setHours(0, 0, 0, 0);

        var end2 = new Date();
        end2.setDate(end2.getDate() + 1);
        end2.setHours(0, 0, 0, 0);

        period.push({
            "from": start2.toISOString(),
            "to": end2.toISOString()
        })

    }

    const requestURL = '$_[infrastructure.internal.reporter.default]/api/v4/contracts/' + config.agreementId + '/createPointsFromPeriods';
    await axios.post(requestURL, { periods: period }).then((response) => {
        console.log("Finished points creation for TPA:", config.agreementId);
        status.lastResult = response.code
        status.success = true;
    }).catch((error) => {
        console.log("Error when creating points for TPA:", config.agreementId, "\n", error);
        status.lastResult = error
        status.success = false;
    });
    status.lastExecution = new Date();
    updateDirectorStatus()
}

function updateDirectorStatus() {
    axios.put('$_[infrastructure.internal.assets.default]/api/v1/public/director/day-calculator.status', status)
}
