'use strict';
/* eslint-disable no-async-promise-executor */

// Expected inputs:

// inputs: {
//     "scopeGrouped": "servicio",
//     "scopeGroupedIn": "consejeria",
//     "groups": {
//         "consejeria": ["servicio1"]
//     }
// }

async function applyStep (dsl, period, inputs, responseList) {
  return new Promise(async function (resolve, reject) {
    // Create the inverted map with the assocations groups
    var invertedMap = {};
    Object.keys(inputs.groups).forEach(groupName => {
      inputs.groups[groupName].forEach(servicio => {
        invertedMap[servicio] = groupName;
      });
    });

    // Assign the grouped scope to each response
    responseList.forEach(response => {
      if (response.scope) {
        response.scope[inputs.scopeGroupedIn] = invertedMap[response.scope[inputs.scopeGrouped]];
      }
    });
    resolve(responseList);
  });
}

module.exports.applyStep = applyStep;
