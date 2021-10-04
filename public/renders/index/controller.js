$scope.tpaprojects = [];
$scope.notpaprojects = [];
$scope.finishloading = true;
$scope.initialsetup = false;
$scope.setupdomain = false;
$scope.setuptoken = false;
$scope.setuptpa = false;
$scope.edittpa = false;
$scope.deftpa = '';

$scope.displayItems = {
    "statusMessage": '',
    "statusType": undefined
};

$scope.consejerias = [
    {
        "name": "Agencia de Servicios Sociales y Dependencia de Andalucía"
        , servicios: [
            "INT_PRV_TAJ65_v1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Consejería de Agricultura, Pesca y Desarrollo Rural"
        , servicios: [
            "INT_PUB_CONSULTA_LICENCIA_PESCA_CAPDER_V1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Consejería de Cultura"
        , servicios: [
            "INT_PRV_CarnetBiblioteca_v1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Consejería de Educación"
        , servicios: [
            "INT_PRV_DIPA_V1.0.0",
            "INT_PRV_CertificadoAcreditacionCompetencias_v1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Consejería de Empleo, Empresa y Comercio"
        , servicios: [
            "INT_PRV_CertificadoProfesionalidad_V1.0.0",
            "INT_PRV_CartaAdjudicacionRTL_V1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Consejería de Hacienda, Industria y Energía"
        , servicios: [
            "INT_PRV_CONSULTA_GASTOS_PAGOS_v1.0.0",
            "INT_PRV_CONSULTA_GASTOS_PAGOS_DETALLES_v1.0.0",
            "INT_PRV_notificacionesCC_JDA_1.8",
            "INT_PRV_CITASTRIBUTARIAS_V1.0.0",
            "INT_PRV_GESTIONDECITAS_V1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Consejería de Igualdad y Políticas Sociales"
        , servicios: [
            "INT_PRV_CITASEVO_V1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Consejería de Medio Ambiente y Ordenación del Territorio"
        , servicios: [
            "INT_PUB_CONSULTA_LICENCIA_CAZA_PESCA_CMAOT_V1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Consejería de Turismo y Deporte"
        , servicios: [
            "INT_PRV_CarnetGuiaTuristico_V1.0.0",
            "INT_PRV_RecuperacionFotografiaGT_v1.0.0",
            "INT_PRV_GeneracionCertificadoDeportistaRendimiento_v1.0.0",
            "INT_PRV_CertificadoDAR_V1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Fundación Andalucía Emprende"
        , servicios: [
            "INT_PRV_CITASCADE_V1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Instituto Andaluz de la Juventud"
        , servicios: [
            "INT_PRV_CarnetJoven_V1.0.0 "
        ],
        urlVariables: ""
    }, {
        "name": "Ministerio de Educación"
        , servicios: [
            "INT_PUB_CONSULTA_TITULOS_UNIVERSITARIOS_MECD_V1.0.0",
            "INT_PUB_CONSULTA_TITULOS_NO_UNIVERSITARIOS_MECD_V1.0.0"
        ],
        urlVariables: ""
    }, {
        "name": "Ministerio de Hacienda"
        , servicios: [
            "INT_PRV_notificacionesCC_AGE_1.3"
        ],
        urlVariables: ""
    }, {
        "name": "Servicio Andaluz de Empleo"
        , servicios: [
            "INT_PRV_ConsultaDemDatosDARDE_v1.0.0",
            "INT_PRV_CitasSAE_v1.0.0"

        ],
        urlVariables: ""
    }, {
        "name": "Servicio Andaluz de Salud"
        , servicios: [
            "INT_PRV_TARJETASANITARIA_V1.0.0",
            "INT_PRV_citasPaciente_v1.0",
            "INT_PRV_citasRadiologia_v1.0"
        ],
        urlVariables: ""
    }
]


for (var consejeria of $scope.consejerias){
    var finalVars = "";
    consejeria.servicios.forEach(serv=>{
        finalVars+= "&var-Servicio=" + serv;
    })
    consejeria.urlVariables = finalVars;
}

$scope.developmentScopeJSON = {};

var scopeManagerURL = "";
var domain = '$_[SERVICES_PREFIX]$_[DNS_SUFFIX]';
$scope.domain = '$_[SERVICES_PREFIX]$_[DNS_SUFFIX]';



function loadProjects() {
    try {
        var scopeTpaprojects = [];
        var scopeNotpaprojects = [];

 
      
                $http({
                    method: 'GET',
                    url: '$_[infrastructure.external.registry.default]/api/v6/agreements'
                }).then((regresponse) => {
                    try {
                   
                        $scope.agreements = regresponse.data;
                        $scope.finishloading = true;
                    } catch (err) {
                        $scope.displayItems.statusMessage = "Comparing registry projects failed.";
                        $scope.displayItems.statusType = "error";
                        $scope.finishloading = true;
                        console.log(err);
                    }
                }, (err) => {
                    $scope.displayItems.statusMessage = "Error when obtaining registry agreements.";
                    $scope.displayItems.statusType = "error";
                    $scope.finishloading = true;
                    console.log(err);
                });
          
        
    } catch (err) {
        $scope.displayItems.statusMessage = "Projects loading failed.";
        $scope.displayItems.statusType = "error";
        $scope.finishloading = true;
        console.log(err);
    }
}


loadProjects();



