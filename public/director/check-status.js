const governify = require('governify-commons');

module.exports.main = async (config) => { 
    let options = {
        method: 'GET',
        url: '$_[infrastructure.internal.assets.default]/commons/infrastructure'
    };
    var response = {};

    await governify.httpClient.request(options)
        .then(async res => {
            response = {internal: {}, external: {}}; // init data
            for (service of Object.entries(res.data.internal).filter(entr => entr[0]!="database")) {
                for(service_entry of Object.entries(service[1]).filter(entr => entr[0] != "default")) {

                    let service_name = `${service[0]}-${service_entry[0]}`
                    let service_url = service_entry[1];
                    
                    let is_external = Object.keys(res.data.external).includes(service[0]);

                    /* GET COMMONS INFO */
                    await governify.httpClient.request({
                        method: 'GET',
                        url: service_url + '/commons'
                    })
                    .then(async commons_response => {

                        response[is_external ? "external" : "internal"][service_name] = typeof(commons_response.data) !== "object" ? {} : commons_response.data;
                        response[is_external ? "external" : "internal"][service_name].serviceName = service_name;
                        response[is_external ? "external" : "internal"][service_name].url = service_url; // for Update
                        response[is_external ? "external" : "internal"][service_name].modify = false;    // toggles UI inputs

                        if(response[is_external ? "external" : "internal"][service_name].version){
                            response[is_external ? "external" : "internal"][service_name].status = 'FINE';   // endpoint working
                            response[is_external ? "external" : "internal"][service_name].msg = 'success';   // response message
                        } else {
                            response[is_external ? "external" : "internal"][service_name].status = 'WARN';
                            response[is_external ? "external" : "internal"][service_name].msg = 'This service does not implement commons';
                        }
                        if(is_external) {
                            response.external[service_name].external_url = res.data.external[service[0]][service_entry[0]];
                        }
                    
                        /* GET logger config */
                        await governify.httpClient.request({
                            method: 'GET',
                            url: service_url + '/commons/logger/config'
                        })
                        .then(config_response => {
                            response[is_external ? "external" : "internal"][service_name].logger_config = config_response.data;
                        })
                        .catch(err2 => {
                            response[is_external ? "external" : "internal"][service_name].status = 'WARN';
                            response[is_external ? "external" : "internal"][service_name].msg = `Could not get logger config, response code: ${err2.response.status}`;
                        });
                    })
                    .catch(err1 => {
                        response[is_external ? "external" : "internal"][service_name] = {serviceName : service_name, status: 'ERR'}
                        if(err1.response){
                            response[is_external ? "external" : "internal"][service_name].msg = `Could not get Commons info, response code: ${err1.response.status}`;
                        } else {
                            response[is_external ? "external" : "internal"][service_name].msg = `Service is not responding: ${err1.code}`;
                        }
                    })
                }
            }
        })
        .catch(err => {
            response = {};
            console.log(err)
        });
    return response;
}