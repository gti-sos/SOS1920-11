const express = require("express");
const bodyParser = require("body-parser");
var request = require("request");
var app = express();
app.use(bodyParser.json());

var port = process.env.PORT || 80;

var pathEmigrants='/api/v2/emigrants-stats';
var apiServerHostEmigrants = 'https://sos1920-01.herokuapp.com';

app.use(pathEmigrants, function(req, res) {
	var url = apiServerHostEmigrants + req.baseUrl + req.url;
	console.log('piped: '+req.baseUrl + req.url);
	req.pipe(request(url)).pipe(res);
});

var pathOverdose='/api/v2/overdose-deaths';
var apiServerHostOverdose = 'https://sos1920-12.herokuapp.com';

app.use(pathOverdose, function(req, res) {
	var url = apiServerHostOverdose + req.baseUrl + req.url;
	console.log('piped: '+req.baseUrl + req.url);
	req.pipe(request(url)).pipe(res);
});


/**
app.get("/public",(request,response)=>{
	response.sendFile("/public/", { root: __dirname });
});**/

app.use("/",express.static("./public"));


//Acceso al recurso economic-freedom-indexes

const rutaEFI1 = "/api/v1/economic-freedom-indexes"; 
const rutaEFI2 = '/api/v2/economic-freedom-indexes'; 
var efis=  require('./src/back/efi/v1/efi');
var efis2= require('./src/back/efi/v2/efi');
app.use(rutaEFI1,efis);
app.use(rutaEFI2,efis2);


//Acceso a rents-per-capita

const rutaRPC = "/api/v1/rents-per-capita";
var rpcs=  require('./src/back/rpc/v1/API_RPC_v1');
app.use(rutaRPC,rpcs);
const rutaRPC2 = "/api/v2/rents-per-capita";
var rpcs2=  require('./src/back/rpc/v2/API_RPC_v2');
app.use(rutaRPC2,rpcs2);
const rutaRPC3 = "/api/v3/rents-per-capita";
var rpcs3=  require('./src/back/rpc/v3/API_RPC_v3');
app.use(rutaRPC3,rpcs3);


//Acceso a crime-rate-stats


const rutaCrime = "/api/v1/crime-rate-stats";
const rutaCrime2 = "/api/v2/crime-rate-stats";
var rcrime2 = require("./src/back/crime/v2/API_jose2");
var rcrime=  require('./src/back/crime/v1/API_jose');
app.use(rutaCrime,rcrime);
app.use(rutaCrime2, rcrime2);

//Server start up
app.listen(port, () => {
	console.log("Server ready");
});
 
console.log("Starting server in port " + port);