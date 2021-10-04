

$scope.sendScript = async function () {
    console.log('Starting agreement update')
    let scriptText = document.getElementById('scriptText').value;
    let scriptConfig = document.getElementById('scriptConfig').value;
    let body = {
            scriptText: scriptText,
            scriptConfig: scriptConfig
        }

    let responsePOST = await fetch("https://director$_[SERVICES_PREFIX]$_[DNS_SUFFIX]/api/v1/tasks/test", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    console.log(responsePOST)
     document.getElementById('scriptResponse').innerText = JSON.stringify(await responsePOST.json());
}

