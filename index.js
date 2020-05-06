const express = require("express");
const bodyParser = require("body-parser");
var app = express();
const BASE_API_URL = "/api/v1";

app.use(bodyParser.json());

var port = process.env.PORT || 80;

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

const rutaRPC = BASE_API_URL + '/rents-per-capita';
var rpcs=  require('./src/back/rpc/API_RPC');
app.use(rutaRPC,rpcs);


//Acceso a crime-rate-stats


const rutaCrime = BASE_API_URL + '/crime-rate-stats';
var rcrime=  require('./src/back/crime/API_jose');
app.use(rutaCrime,rcrime);

//Server start up
app.listen(port, () => {
	console.log("Server ready");
});

console.log("Starting server...");