$scope.notmonitoring = [];
$scope.alreadymonitoring = [];
$scope.finishloading = false;

async function load(){
    await load_registered_tpas().then(async registered_tpas => {
        await load_asset_tpas().then(asset_tpas => {
            $scope.notmonitoring = asset_tpas.filter(assettpa => !registered_tpas.map(registeredtpa => registeredtpa.id).includes(assettpa.id));
            $scope.alreadymonitoring = registered_tpas;
            $scope.finishloading = true
        });
    })
}

/* Request assetmanager for each json tpa inside tpa directory
   and return array with {name, id} of each one */
function load_asset_tpas(){
    var assets_host = '$_[infrastructure.internal.assets.default]/api/v1'
    var tpa_folder = 'public/renders/tpa/agreements';

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
/* Read infrastructures.json file in private folder
   and return array with {name, id} of each one */
function load_registered_tpas(){
    return $http({
        method: 'GET',
        url: '$_[infrastructure.internal.assets.default]/api/v1/private/monitoring/infrastructures.json',
        params: {private_key: '$_[PRIVATE_KEY]'}
    }).then(response => {
        return response.data;
    }).catch(err => {
        if(err.status === 404){
            $http({
                method: 'POST',
                url: '$_[infrastructure.internal.assets.default]/api/v1/private/monitoring/infrastructures.json',
                params: {private_key: '$_[PRIVATE_KEY]', createDirectories: true},
                headers: {contentType: 'application/json'},
                data: []
            });
        }
        return [];
    });
}
/* Requests registry for tpas in mongo */
function load_mongo_tpas(){
    return $http({
        method: 'GET',
        url: '$_[infrastructure.internal.registry.default]/api/v6/agreements'
    }).then(response => {
        return response.data;
    }).catch(err => {
        return [];
    })
}
/* Start monitoring infrastructure */
$scope.start_monitoring = async function start_monitoring(tpa){
    var prom = [];
    var registered_list = await load_registered_tpas();
    var mongo_list = await load_mongo_tpas();

    if(!mongo_list.map(el => el.id).includes(tpa.id)){
        prom.push( $http({
            method: 'POST',
            url: '$_[infrastructure.internal.registry.default]/api/v6/agreements',
            data: tpa 
        }));
    }

    if(!registered_list.map(el => el.id).includes(tpa.id)) {
        registered_list.push({id: tpa.id, name: tpa.name, services: tpa.context.definitions.group.services});
        prom.push( $http({
            method: 'PUT',
            url: '$_[infrastructure.internal.assets.default]/api/v1/private/monitoring/infrastructures.json',
            params: {private_key: '$_[PRIVATE_KEY]'},
            headers: {contentType: 'application/json'},
            data: registered_list,
        }));   
    }
    Promise.all(prom).then(() => load()).catch(() => {/* TODO show in view */});
}
/* Stop monitoring infrastructure*/
$scope.stop_monitoring = async function stop_monitoring(tpa_id){
    var prom = [];

    prom.push( $http({
        method: 'DELETE',
        url: `$_[infrastructure.internal.registry.default]/api/v6/agreements/${tpa_id}`,
    }));

    var registered_list = await load_registered_tpas().then(res => res.filter(el => el.id !== tpa_id));
    prom.push( $http({
        method: 'PUT',
        url: '$_[infrastructure.internal.assets.default]/api/v1/private/monitoring/infrastructures.json',
        params: {private_key: '$_[PRIVATE_KEY]'},
        headers: {contentType: 'application/json'},
        data: registered_list,
    })); 

    Promise.all(prom).then(() => load()).catch(() => {/* TODO show in view */});
}

load();