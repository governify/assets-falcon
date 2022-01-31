// Display items and error alert
$scope.displayItems = {
    statusMessage: '',
    statusType: undefined,
    infrastructureInfo: {},
    automaticComputation: false,
    automaticComputationInfo: { id: 123, status: "stopped", script: "/asdf/script.js" }
};

// Helper: create alerts in page
const setPageAlert = (message, type) => {
    if (type === "error" || $scope.displayItems.statusType !== "error") {
        $scope.displayItems.statusMessage = message;
        $scope.displayItems.statusType = type;
    }
}

// This function is called at the end of the code
const init = () => {
    try {
        //Get infrastructure info from assets
        $http({
            method: 'GET',
            url: "$_[infrastructure.external.assets.default]/api/v1/private/monitoring/infrastructures.json",
            params: {private_key: '$_[PRIVATE_KEY]'}
        }).then(response => {
            $scope.displayItems.infrastructureInfo = response.data.filter(item => item.id === $scope.model.id)[0];
        }).catch(err => {
            setPageAlert("Could not get infrastructure information.", "error");
            console.log(err);
        }).then(() => {
            $scope.modelLoaded = $scope.modelLoaded == false ? true : false 
        });

        //Get existing agreement from mongo
        $http({
            method: 'GET',
            url: `$_[infrastructure.external.registry.default]/api/v6/agreements/${$scope.model.id}`
        }).then(response => {
            console.info("Loaded agreement from mongo.")
            $scope.model = response.data;
            $scope.collectorsUsed = Object.keys($scope.model.context.definitions.collectors);
            
            //Get computation information from director
            $http({
                method: 'GET',
                url: `$_[infrastructure.external.director.default]/api/v1/tasks/${$scope.model.id}`,
            }).then( directorResponse => {
                console.info("Loaded execution from director.");
                $scope.displayItems.automaticComputation = true;
                $scope.displayItems.automaticComputationInfo = directorResponse.data;
            }).catch( directorErr => {
                if (directorErr.status !== 404) console.log(directorErr);
                $scope.displayItems.automaticComputation = false;
                $scope.displayItems.automaticComputationInfo = {};

            });
        }).catch(err => {
            if (directorErr.status !== 404) console.log(err);
            setPageAlert("No agreement found in mongo.", "error");
        }).then( () => {
            $scope.modelLoaded = $scope.modelLoaded == false ? true : false;
        });
        
    } catch (err) {
        $scope.modelLoaded = true;
        console.log(err);
        if (!$scope.model) {
            setPageAlert("Model could not be loaded.", "error");
        } else {
            setPageAlert("Undefined Error.", "error");
        }
    }
}

$scope.swapAutomaticComputation = () => {
    if ($scope.displayItems.automaticComputation) {
        $http({
            method: 'DELETE',
            url: `$_[infrastructure.internal.director.default]/api/v1/tasks/${$scope.model.id}`
        }).then(() => {
            $scope.displayItems.automaticComputation = false;
            $scope.displayItems.automaticComputationInfo = {};
        }).catch(err => {
            setPageAlert("Automatic computation task could not be deactivated.", "error");
            console.log(err);
        });
    } else {
        $http({
            method: 'GET',
            url: `$_[infrastructure.internal.assets.default]/api/v1/info/public/director/calculate.js`
        }).then( async () => {
            let nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            
            let data = await $http({
                method: 'GET',
                url: `$_[infrastructure.internal.assets.default]/api/v1/public/director/calculate.json`
            }).then(response => response.data)
            .catch(() => {return undefined});
            
            let interval = data && data.interval ? data.interval : 3600000;
            const task = {
                id: $scope.model.id,
                script: `$_[infrastructure.internal.assets.default]/api/v1/public/director/calculate.js`,
                running: true,
                config: { 
                    agreementId: $scope.model.id,
                    interval: interval
                },
                init: data && data.init ? data.init : new Date().toISOString(),
                end: data && data.end ? data.end : nextYear.toISOString(),
                interval: interval
            };

            $http({
                method: 'POST',
                url: `$_[infrastructure.external.director.default]/api/v1/tasks`,
                headers: { 'Content-Type': 'application/json' },
                data: task
            }).then( directorResponse => {
                console.log(`Automatic computation activated until ${task.end}`);
                $scope.displayItems.automaticComputation = true;
                $scope.displayItems.automaticComputationInfo = directorResponse.data;
            }).catch( err => {
                setPageAlert("Automatic computation task could not be activated.", "error");
                console.log(err)
            });
        }).catch(err => {
            if (err.status !== 404) console.log(err);
            setPageAlert("Automatic computation task could not be activated: Director script not found", "error");
        });
    }
}

$scope.beautifyMetric = (metric) => { 
    return JSON.stringify(metric, null, 1); 
}

$scope.calculateEventsMetrics = function (id) {
    var proceed = confirm('WARN: All prevoius data will be deleted and recalculated. Continue?');
    if (proceed) {
        setPageAlert("TPA data is being generated for the period.", false);
        $http({
            method: 'POST',
            url: `$_[infrastructure.external.reporter.default]/api/v4/contracts/${id}/reset`,
            data: {},
            headers: { 'Content-Type': 'application/json' }
        }).then(() => {
            $http({
                method: 'POST',
                url: `$_[infrastructure.external.reporter.default]/api/v4/contracts/${id}/createHistory`,
                headers: { 'Content-Type': 'application/json' },
                data: {division: "daily"}
            }).catch( (err) => {
                console.log(err);
                setPageAlert("TPA data could not be generated.", 'error');
            }); 
        }).catch( (err) => {
            console.log(err)
        });
    }      
}

init();