'use strict';
/* eslint-disable no-async-promise-executor */

const governify = require('governify-commons');
const _ = require('lodash')

async function applyStep (dsl, period, inputs, responseList) {
  return new Promise(async function (resolve, reject) {
    const url = dsl.config.url + inputs.request.endpoint;

    const params = JSON.parse(JSON.stringify(inputs.request.params).replace(/>>>period.from<<</g, period.from).replace(/>>>period.to<<</g, period.to));
    const res = await governify.httpClient.request({
      url: url,
      params: params,
      method: inputs.request.method,
      body: inputs.request.body
    }).then(response => { return response.data; }).catch(console.log);

    var resultList = _.get(res, inputs.result.valueAddress);
    var finalResult = [];
    resultList.forEach(rs => {
      var newScope = Object.assign({}, dsl.metric.scope);
      newScope.service = rs.metric[inputs.result.scopeKey];
      var metricResult = _avg(rs.values.map(vals => vals[1]).filter(val => val != "NaN"));
      finalResult.push({ evidences : rs.values, metric: metricResult, scope: newScope });
    });
    // Add the result to the current result from previous steps.
    var resultConcat = responseList.concat(finalResult);
    resolve(resultConcat);
  });
}

function _avg(arr){
  if (arr.length === 0) return 0;
  if (arr.length === 1) return parseFloat(arr[0]);
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

module.exports.applyStep = applyStep;
