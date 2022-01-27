// Display items and error alert
$scope.displayItems = {
    statusMessage: '',
    statusType: undefined,
    infrastructureInfo: {},
    automaticComputation: false,
    automaticComputationInfo: { id: 123, status: "stopped", script: "/asdf/script.js" }
};

//Calculate Metrics button modal
$scope.calculateMetrics = {
    timezone: "GMT-8:00",
    timezones: [],
    from: new Date(new Date().toISOString().split('T')[0] + "T00:00:00"),
    to: new Date(new Date().toISOString().split('T')[0] + "T23:59:59"),
    agree: false,
    message: "",
    error: false
}

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
        for (let i = -11; i < 15; i++) {
            $scope.calculateMetrics.timezones.push("GMT" + (i < 0 ? "-" : "+") + Math.abs(i) + ":00")
        }

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
            url: `$_[infrastructure.external.director.default]/api/v1/tasks/${$scope.model.id}`
        }).then(() => {
            $scope.displayItems.automaticComputation = false;
            $scope.displayItems.automaticComputationInfo = {};
        }).catch(err => {
            setPageAlert("Automatic computation task could not be deactivated.", "error");
            console.log(err);
        });
    } else {
        const path = $scope.displayItems.infrastructureInfo.source;
        const file = path.substring(path.lastIndexOf("/") + 1).split(".")[0];
        $http({
            method: 'GET',
            url: `$_[infrastructure.external.assets.default]/api/v1/info/public/director/${file}.js`
        }).then( async () => {
            let nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            
            let data = await $http({
                method: 'GET',
                url: `$_[infrastructure.external.assets.default]/api/v1/public/director/${file}.json`
            }).then(response => response.data)
            .catch(() => {return undefined});
            
            const task = {
                id: $scope.model.id,
                script: `${script}.js`,
                running: true,
                config: { agreementId: $scope.model.id },
                init: data && data.init ? data.init : new Date().toISOString(),
                end: data && data.end ? data.end : nextYear.toISOString(),
                interval: data && data.interval ? data.interval : 7200000
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
    
    //Helper alert function
    const setModalAlert = (message, error = true) => { 
        $scope.calculateMetrics.message = message; 
        $scope.calculateMetrics.error = error; 
    }

    try {
        setModalAlert("");
        if ($scope.calculateMetrics.agree) {
            if (!$scope.calculateMetrics.from || !$scope.calculateMetrics.to) {
                setModalAlert("Invalid date.");
            } else {
                // Periods generation
                var firstDateOffset = new Date(Date.parse($scope.calculateMetrics.from.toISOString())).getTimezoneOffset();
                var firstDate = Date.parse($scope.calculateMetrics.from.toISOString()) - firstDateOffset * 60 * 1000;

                var lastDateOffset = new Date(Date.parse($scope.calculateMetrics.to.toISOString())).getTimezoneOffset();
                var lastDate = Date.parse($scope.calculateMetrics.to.toISOString()) - lastDateOffset * 60 * 1000;

                console.log("Input", $scope.calculateMetrics.to.toISOString());
                console.log("UTC", new Date(lastDate).toISOString());

                var periodDifference = lastDate - firstDate;
                var timezoneOffset = $scope.calculateMetrics.timezone.split("T")[1].split(":")[0] * 60 * 60 * 1000;

                if (periodDifference <= 0) {
                    setModalAlert("End date must be higher than start date.");
                } else {
                    setModalAlert("TPA data is being generated for the period.", false);
                    $http({
                        method: 'POST',
                        url: `$_[infrastructure.external.reporter.default]/api/v4/contracts/${id}/createPointsFromPeriods`,
                        headers: { 'Content-Type': 'application/json' },
                        data: { 
                            periods: [{
                                from: new Date(firstDate - timezoneOffset).toISOString(),
                                to: new Date(lastDate - timezoneOffset - 1).toISOString()
                            }] 
                        }
                    }).then( () => {
                        setModalAlert("TPA data generated successfully", false);
                    }).catch( (err) => {
                        console.log(err);
                        setModalAlert("TPA data could not be generated.", true);
                    });                   
                }
            }
        } else {
            setModalAlert("You must agree to delete old information.");
        }
    } catch (err) {
        console.log(err)
        setModalAlert("Undefined error.");
    }
}

init();