const path = require('path')
const MongoClient = require("mongodb").MongoClient;
const { MongoTransferer, MongoDBDuplexConnector, LocalFileSystemDuplexConnector } = require('mongodb-snapshot');
const fs = require('fs');
const archiver = require('archiver');
const AdmZip = require("adm-zip");
const FormData = require('form-data');
const governify = require('governify-commons');
const logger = governify.getLogger().tag('Influx-Backups');

const date = new Date();
const dateString = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
const DIR = `./${dateString}`;



async function makeBackup(dbUri,db){
    const fileName = `${dateString} ${db.name}.zip`;
    const savePath = path.join(__dirname,DIR,fileName);

    const mongo_connector = new MongoDBDuplexConnector({
        connection: {
            uri: dbUri,
            dbname: db.name,
        },
    });

    const localfile_connector = new LocalFileSystemDuplexConnector({
        connection: {
            path: savePath,
        },
    });

    return new MongoTransferer({
        source: mongo_connector,
        targets: [localfile_connector],
    });
}

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


    if (!fs.existsSync(DIR)){
        fs.mkdirSync(DIR);
    }

    // Connect using MongoClient
    await MongoClient.connect(config.urlDB,async function(err, dbConnexion) {
        // Use the admin database for the operation
        var adminDb = dbConnexion.admin();
        // List all the available databases
        adminDb.listDatabases(async function(err, result) {

            for(var db of result.databases){
                var transferer = await makeBackup(config.urlDB,db);
                for await (const { total, write } of transferer) {
                }
                logger.info(`Backup finished for ${db.name} from ${config.urlDB}`);
            }
                
            dbConnexion.close(); 
            await zipDirectory(`./${DIR}`,`${dateString}_${config.nameDB}.zip`);

            logger.info('Backups zipped');

            fs.rmdirSync(DIR, { recursive: true });
                    
            logger.info('Temporal files deleted');

            await sendFile(`${dateString}_${config.nameDB}.zip`,config);

        });
    });
    
    return "backup done"
}