'use strict';
/* eslint-disable no-async-promise-executor */

const governify = require('governify-commons');
const config = require('./config')
const credentials = config.credentials();
const _ = require('lodash')

async function applyStep (dsl, period, inputs, responseList) {
  return new Promise(async function (resolve, reject) {
    const url = dsl.config.url + inputs.request.endpoint;

    const body = JSON.parse(JSON.stringify(inputs.request.body).replace(/>>>period.from<<</g, period.from).replace(/>>>period.to<<</g, period.to));
    const res = await governify.httpClient.request({
      url: url,
      method: 'POST',
      headers: { Authorization: credentials.elk},
      data: body
    }).then(response => { return response.data; }).catch(console.log);

    var resultList = _.get(res, 'aggregations.services.buckets');
    var finalResult = [];
    resultList.forEach(rs => {
      var newScope = Object.assign({}, dsl.metric.scope);
      newScope.servicio = rs.key;
      var metricResult = rs.avgresponsetime ? rs.avgresponsetime.value : rs.doc_count;
      finalResult.push({ evidences: res.hits.hits, metric: metricResult != null ? metricResult : 0, scope: newScope });
    });

    // Add the result to the current result from previous steps.
    var resultConcat = responseList.concat(finalResult);
    resolve(resultConcat);
  });
}

module.exports.applyStep = applyStep;
