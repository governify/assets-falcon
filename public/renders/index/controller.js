$scope.notmonitoring = [];
$scope.alreadymonitoring = [];
$scope.finishloading = false;

async function load(){
    await load_mongo_tpas().then(async mongo_tpas => {
        await load_asset_tpas().then(asset_tpas => {
            $scope.notmonitoring = asset_tpas.filter(assettpa => !mongo_tpas.map(mongotpa => mongotpa.id).includes(assettpa.id));
            $scope.alreadymonitoring = mongo_tpas;
            $scope.finishloading = true
        });
    })
}

/* Request assetmanager for each json tpa inside tpa directory
   and return array with {name, id} of each one */
function load_asset_tpas(){
    var assets_host = '$_[infrastructure.internal.assets.default]/api/v1'
    var tpa_folder = 'public/renders/tpa';

    return $http({
        method: 'GET',
        url: `${assets_host}/info/${tpa_folder}`
    }).then(async response => {
        var tpa_paths = response.data.files.map(file => `${tpa_folder}/${file.name}`);
        var asset_tpas = [];
        for(var tpa_path of tpa_paths){
            await $http({
                method: 'GET',
                url: `${assets_host}/${tpa_path}`
            }).then( jsonTPAResponse => {
                if(jsonTPAResponse.data.id){
                    asset_tpas.push(jsonTPAResponse.data)
                } else {
                    throw `${tpa_path} has no id`
                }
            }).catch(err1 => {
                console.log(err1);
            });
        }
        return asset_tpas;
    }).catch(err => {
        return [];
    });
}
/* Request registry for each json tpa inside tpa directory
   and return array with {name, id} of each one */
function load_mongo_tpas(){
    var registry_host = '$_[infrastructure.internal.registry.default]/api/v6'

    return $http({
        method: 'GET',
        url: `${registry_host}/agreements`
    }).then(response => {
        return response.data
    }).catch(err => {
        console.log(err);
    });
}
/* Start monitoring infrastructure */
$scope.start_monitoring = function start_monitoring(tpa){
    $http({
        method: 'POST',
        url: '$_[infrastructure.internal.registry.default]/api/v6/agreements',
        data: tpa
    }).then(() => {
        //TODO Show success message?
        load();
    }).catch(() => {
        //TODO Show error msg
    });
}

load()