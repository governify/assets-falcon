"use strict";
const axios = require("axios");
var start = firstDayInMonth(new Date());
start.setHours(0, 0, 0, 0);

var end = firstDayInNextMonth(new Date());
end.setHours(0, 0, 0, 0);

// Use UTC hour
const period = [{
    "from": start.toISOString(),
    "to": end.toISOString()
}];

function firstDayInPreviousMonth(yourDate) {
    return new Date(yourDate.getFullYear(), yourDate.getMonth() - 1, 1);
}
function firstDayInMonth(yourDate) {
    return new Date(yourDate.getFullYear(), yourDate.getMonth(), 1);
}

function firstDayInNextMonth(yourDate) {
    return new Date(yourDate.getFullYear(), yourDate.getMonth() + 1, 1);
}


let status = {
    lastExecution: new Date(),
    lastResult: null,
    success: true
};


module.exports.main = async function (config) {

    var d = new Date();
    var hours = d.getHours();
    if (hours < 2) {

        var start2 = firstDayInPreviousMonth(new Date());
        start2.setHours(0, 0, 0, 0);

        var end2 = firstDayInMonth(new Date());
        end2.setHours(0, 0, 0, 0);

        period.push({
            "from": start2.toISOString(),
            "to": end2.toISOString()
        })

    }

    const requestURL = '$_[infrastructure.internal.reporter.default]/api/v4/contracts/' + config.agreementId + '/createPointsFromPeriods';
    console.log(period)
    axios.post(requestURL, { periods: period }).then((response) => {
        console.log("Finished points creation for TPA:", config.agreementId);
        status.lastResult = response
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
    axios.put('$_[infrastructure.internal.logs.default]/api/v1/public/director/month-calculator.status', status)
}
