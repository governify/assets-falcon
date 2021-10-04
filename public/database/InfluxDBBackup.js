const Influx = require('influx');
const fs = require('fs');
const archiver = require('archiver');
const FormData = require('form-data');
const governify = require('governify-commons');
const logger = governify.getLogger().tag('Influx-Backups');

const date = new Date();
const dateString = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
const DIR = `./${dateString}`;

function zipDirectory(source, out) {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

async function sendFile(file,config){

    const assetUrl = '$_[infrastructure.internal.assets.default]'.split(':')

    var form = new FormData();
    form.append('file', fs.createReadStream(file));

    governify.httpClient.post('$_[infrastructure.internal.assets.default]'+'/api/v1/public/database/backups/'+config.nameDB,form,{
        headers: {
            ...form.getHeaders()    
        }
    }).then(()=>{

        logger.info('File send to Assets');

        fs.unlinkSync(file)

        logger.info('Done')
    }).catch((err)=>{
        logger.error(err)
    })
    
}

module.exports.main = async function(config) {

    const { urlDB } = config
    const influx = new Influx.InfluxDB(urlDB);

    if (!fs.existsSync(DIR)){
        fs.mkdirSync(DIR);
    }
    const urlDBDesc = urlDB.split(':');

    await influx.getDatabaseNames().then(async (dbNames) =>{
        
        for(var db of dbNames){
            if( db === '_internal') continue;

            const connection = new Influx.InfluxDB({
                        host: urlDBDesc[1].replace('//',''),
                        port: urlDBDesc[2],
                        protocol: urlDBDesc[0],
                        database: db
                    })
            var measurements = await connection.getMeasurements()

            for (var measure of measurements) {
                var rawData = await connection.queryRaw('SELECT * FROM ' + measure)
                var keys = await connection.queryRaw('SHOW TAG KEYS ON ' + db)
                logger.info(`Backup finished for ${db}=>${measure} from ${config.urlDB}`);
                rawData.results[0].series[0].keys = keys.results[0].series[0].values.flatMap(x => x)
                console.log(rawData.results[0].series[0].values.length)
                fs.writeFile(`${DIR}/${dateString}_${db}_${measure}.json`, JSON.stringify(rawData), (error) => {
                    if (error) throw error;
                })

                logger.info(`Backup finished for ${db}=>${measure} from ${config.urlDB}`);
            }
        }
        }).catch(err => {
            console.log(err)
        });

    await zipDirectory(`./${DIR}`,`${dateString}_${config.nameDB}.zip`);

    logger.info('Backups zipped');

    fs.rmdirSync(DIR, { recursive: true });
                    
    logger.info('Temporal files deleted');

    await sendFile(`${dateString}_${config.nameDB}.zip`,config);

    return "backup done"
}