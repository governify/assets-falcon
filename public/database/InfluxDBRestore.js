const governify = require('governify-commons');
const logger = governify.getLogger().tag('Influx-Restore');
const fs = require('fs');
const AdmZip = require("adm-zip");
const Influx = require('influx');


const DIR = `./tmp`;

async function getFile(config){
    const url = '$_[infrastructure.internal.assets.default]';
    const path = '/api/v1/public/database/backups/'+config.nameDB+'/'+config.backup;

    const writer = fs.createWriteStream(DIR+"/"+config.backup);

    const response = await governify.httpClient({
        url: url+path,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    })
}

async function unzipFiles(config){
    var zip = new AdmZip(DIR+"/"+config.backup);

    zip.extractAllTo(DIR, true);
    logger.info('Files unzipped')
    fs.unlinkSync(DIR+"/"+config.backup)

}

module.exports.main = async function(config) {

    if (!fs.existsSync(DIR)){
        fs.mkdirSync(DIR);
    }else {
        fs.rmdirSync(DIR, { recursive: true });
        fs.mkdirSync(DIR);
    }

    await getFile(config);
    logger.info('Backup obtained from assets');

    await unzipFiles(config);

    const files = fs.readdirSync(DIR);

    const urlDBDesc = config.urlDB.split(':');
    for(const file of files){
        var data = JSON.parse(fs.readFileSync(DIR+"/"+file));
        const db = file.split('_')[1];
        const measure = file.split('_').slice(2).join('_').split('.')[0];
        const connection = new Influx.InfluxDB({
                        host: urlDBDesc[1].replace('//',''),
                        port: urlDBDesc[2],
                        protocol: urlDBDesc[0],
                        database: db
                    })

        await connection.getMeasurements().then(names => {
            names.forEach(name =>{
                connection.dropSeries({ measurement: m => m.name(name) })
            })
        })
        await connection.dropMeasurement(measure)

        const {columns, values, keys} = data.results[0].series[0]
        var influxPoints = [];
        for (const value of values) {
            var influxPoint = {
                measurement: measure,
                tags:{},
                fields:{}
            };

            columns.forEach((val,index) => {
                if(value[index] !== null){
                    if(keys.includes(val)){
                        influxPoint.tags[val] = value[index]
                    }else if(val === 'time'){
                        influxPoint.timestamp = new Date(value[index]).getTime()
                    }else{
                        influxPoint.fields[val] = value[index]
                    }
                }
            });
            influxPoints.push(influxPoint)  
        }
        await connection.writePoints(influxPoints,{
                    precision: 'ms'
                })
                .catch(error => {
                    logger.error(`Error saving data to InfluxDB! ${error}`)
                }); 
    }

    fs.rmdirSync(DIR, { recursive: true });
    logger.info('Temporal files cleared')
    return "Restore done"
}
