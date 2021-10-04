const urlParams = new URLSearchParams(window.location.search);
if (!urlParams.get('agreement')) {
    document.body.innerHTML = "<h3>Agreement param not found in url</h3>"
    return;
}

async function getAgreement() {
    let agreement = await fetch("$_[infrastructure.external.registry.default]/api/v6/agreements/" + urlParams.get('agreement'))
    let agreementJSON = await agreement.json();
    document.getElementById('agreementText').value = JSON.stringify(agreementJSON, undefined, 4)
    console.log(agreementJSON)
}

getAgreement();

$scope.updateAgreement = async function () {
    console.log('Starting agreement update')
    let agreementJSON;
    try {
        agreementJSON = JSON.parse(document.getElementById('agreementText').value);
    } catch (exception) {
        console.log(exception)
        window.alert('Modifición erronea del acuerdo:' + exception)
        return;
    }


    let responseDeletion = await fetch("$_[infrastructure.external.registry.default]/api/v6/agreements/" + urlParams.get('agreement'), {
        method: 'DELETE'
    });
    if (responseDeletion.status !== 200) {
        window.alert('Error al borrar el acuerdo para la actualización.')
        return;
    }
    console.log(responseDeletion)
    let responsePOST = await fetch("$_[infrastructure.external.registry.default]/api/v6/agreements", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: document.getElementById('agreementText').value
    });
    if (responseDeletion.status != 200) {
        window.alert('Error al enviar el acuerdo para la actualización.')
        return;
    } else {
        window.alert('Acuerdo modificado satisfactoriamente.')
        return;
    }
    console.log(responsePOST)
}

