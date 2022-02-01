'use strict';

module.exports.modifyJSON = modifyJSON;

function modifyJSON(jsonDashboard, agreement, dashboardName){
    //Dashboard JSON is received here, data (like thresholds) must be replaced with agreement data.
    var last_day = new Date();
    last_day.setDate(last_day.getDate() - 1);

    jsonDashboard = JSON.parse(JSON.stringify(jsonDashboard)
        .replace(/\$\{fromtime\}/g, last_day.toISOString())
        .replace(/\$\{totime\}/g, new Date().toISOString())
        .replace(/\$\{agreementid\}/g, agreement.id)
        .replace(/\$\{agreementName\}/g, agreement.name || agreement.id));

    var panelsAcc = [];
    agreement.terms.guarantees.forEach(guarantee => {
        var newpanels = JSON.stringify(jsonDashboard.panels)
            .replace(/\$\{guarantee\}/g, guarantee.id)
            .replace(/\$\{description\}/g, guarantee.description);

        if(["<", "<="].some(str => guarantee.of[0].objective.includes(str))) {
            newpanels = newpanels
                .replace(/\$\{operation\}/g, "gt")
                .replace(/"\$\{threshold\}"/g, 
                    parseFloat(guarantee.of[0].objective.split("<")[1] || guarantee.of[0].objective.split("<=")[1]) / 1000)
                .replace(/"\$\{threshold_gauge_yellow\}"/g, 
                    parseFloat(guarantee.of[0].objective.split("<")[1] || guarantee.of[0].objective.split("<=")[1]) * 0.70)
                .replace(/"\$\{threshold_gauge_red\}"/g, 
                    parseFloat(guarantee.of[0].objective.split("<")[1] || guarantee.of[0].objective.split("<=")[1]));
        }
        else if([">", ">="].some(str => guarantee.of[0].objective.includes(str))) {
            newpanels = newpanels
                .replace(/\$\{operation\}/g, "lt")
                .replace(/"\$\{threshold\}"/g, 
                    parseFloat(guarantee.of[0].objective.split(">")[1] || guarantee.of[0].objective.split(">=")[1]) / 1000)
                .replace(/"\$\{threshold_gauge_yellow\}"/g, 
                    parseFloat(guarantee.of[0].objective.split(">")[1] || guarantee.of[0].objective.split(">=")[1]) * 0.70)
                .replace(/"\$\{threshold_gauge_red\}"/g, 
                    parseFloat(guarantee.of[0].objective.split(">")[1] || guarantee.of[0].objective.split(">=")[1]));
        }
        newpanels = JSON.parse(newpanels);

        var targetsAcc = [];
        Object.entries(agreement.context.definitions.services).forEach(([name, id]) => {
            var targets = JSON.stringify(newpanels[2].targets)
                .replace(/\$\{serviceName\}/g, name)
                .replace(/\$\{serviceid\}/g, id);
            targetsAcc = targetsAcc.concat(JSON.parse(targets));
        });
        newpanels[2].targets = targetsAcc;
        panelsAcc = panelsAcc.concat(newpanels);
    });
    jsonDashboard.panels = panelsAcc;
    return jsonDashboard;
}