$scope.tasks = [];
$scope.displayMessage = false;
$scope.message = "";
$scope.responseCode = "";
$scope.taskId = "";
$scope.taskRunning = "";
$scope.taskInit = "";
$scope.taskInterval = undefined;
$scope.taskEnd = "";
$scope.taskScript = "";
$scope.taskConfiguration = "";

var getTasks = function() {
    let url = "$_[infrastructure.external.director.default]/api/v1/tasks";

    $http.get(url).then(response => {
        $scope.tasks = response.data;
        $scope.tasks.sort((a,b) => (a.id > b.id) ? 1 : -1);
    }).catch(err => {
        console.log(err);
    })
}

getTasks();

$scope.changeStatus = function(task) {
    let url = "$_[infrastructure.external.director.default]/api/v1/tasks/" + task.id + "/status/switch";
	$http.post(url).then(response => {
        $scope.tasks[$scope.tasks.indexOf(task)].running = response.data.running;
    }).catch(err => {
        console.log(err);
    })
}

var buildTaskPayload = (id,running,init,interval,end,script,configuration) => {
    return { 
        "id" : id,
        "running" : running,
        "init" : init,
        "interval" : interval,
        "end" : end,
        "script" : script,
        "configuration" : JSON.parse(configuration),
    }
}

$scope.createTask = function() {
    $scope.displayMessage = true;
    if ($scope.taskId !== "" && $scope.taskInit !== "" && $scope.taskEnd !== ""
    && $scope.taskScript !== "" && $scope.taskConfiguration !== "") {
        //Building payload
        let payload= buildTaskPayload($scope.taskId,$scope.taskRunning,$scope.taskInit,$scope.taskInterval,
            $scope.taskEnd,$scope.taskScript,$scope.taskConfiguration);
        
        // Create Task
        let url = "$_[infrastructure.external.director.default]/api/v1/tasks/";
        
        $http.post(url,payload).then(response => {
            $scope.message = "ok";
            $scope.taskCreationResponse = "Task successfully created";
            $scope.responseCode = response.status.toString();
            $scope.tasks.push(response.data);
        }).catch(err => {
            $scope.message = "badRequest";
            $scope.taskCreationResponse = "Task unsuccessfully created";
            $scope.responseCode = err.response.status.toString();
            console.log(err);
        })

        // Clear fields.
        $scope.taskId = "";
        $scope.taskRunning = "";
        $scope.taskInit = "";
        $scope.taskInterval = undefined;
        $scope.taskEnd = "";
        $scope.taskScript = "";
        $scope.taskConfiguration = "";
    }else{
        $scope.message = "badFields";
        $scope.taskCreationResponse = "You must fill in all the fields";
    }
}


$scope.deleteTask = function(task) {
    if (confirm("Do your really want to delete this task?")) {
        let url = "$_[infrastructure.external.director.default]/api/v1/tasks/" + task.id;
        $http.delete(url).then(response => {
            $scope.tasks.splice($scope.tasks.indexOf(task), 1);
        }).catch(err => {
            console.log(err);
        })
    }
}

$scope.sortTasks = function(attribute) {
    if(attribute === "init"){
        $scope.tasks.sort((a,b) => (a.init > b.init) ? 1 : -1);
    }else if(attribute === "end"){
        $scope.tasks.sort((a,b) => (a.end > b.end) ? 1 : -1);
    }else if(attribute === "configuration"){
        $scope.tasks.sort((a,b) => (JSON.stringify(a.configuration) > JSON.stringify(b.configuration)) ? 1 : -1);
    }else{
        $scope.tasks.sort((a,b) => (a.id > b.id) ? 1 : -1);
    }
}

$scope.sortTasksReverse = function(attribute) {
    if(attribute === "init"){
        $scope.tasks.sort((a,b) => (a.init < b.init) ? 1 : -1);
    }else if(attribute === "end"){
        $scope.tasks.sort((a,b) => (a.end < b.end) ? 1 : -1);
    }else if(attribute === "configuration"){
        $scope.tasks.sort((a,b) => (JSON.stringify(a.configuration) < JSON.stringify(b.configuration)) ? 1 : -1);
    }else{
        $scope.tasks.sort((a,b) => (a.id < b.id) ? 1 : -1);
    }
}