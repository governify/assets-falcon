const governify = require('governify-commons');
const logger = governify.getLogger().tag('Mongo-Restore');

const fs = require('fs');
const AdmZip = require("adm-zip");
const { MongoTransferer, MongoDBDuplexConnector, LocalFileSystemDuplexConnector } = require('mongodb-snapshot');
const MongoClient = require("mongodb").MongoClient;
const path = require('path');


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

async function restoreBackup(dbUri,db,fileName){

    const savePath = path.join(__dirname,DIR,fileName);

    const mongo_connector = new MongoDBDuplexConnector({
        connection: {
            uri: dbUri,
            dbname: db,
        },
    });

    const localfile_connector = new LocalFileSystemDuplexConnector({
        connection: {
            path: savePath,
        },
    });

    return new MongoTransferer({
        source: localfile_connector,
        targets: [mongo_connector],
    });

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

    MongoClient.connect(config.urlDB,async function(err, dbConnexion) {
        dbConnexion.admin();
        
        const files = fs.readdirSync(DIR);
        for (const file of files) {
            var db = file.split(' ')[1].split('.')[0];
            var transferer = await restoreBackup(config.urlDB,db,file)

            for await (const { total, write } of transferer) {
            }

            logger.info(`Restore finished for ${db} from ${config.urlDB}`);      
        }
        
        dbConnexion.close();
        fs.rmdirSync(DIR, { recursive: true });
        logger.info('Temporal files cleared')
    });

    return "Restore done"
}
