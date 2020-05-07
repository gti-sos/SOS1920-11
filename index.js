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

const rutaRPC = "/api/v1/rents-per-capita";
var rpcs=  require('./src/back/rpc/v1/API_RPC_v1');
app.use(rutaRPC,rpcs);
const rutaRPC2 = "/api/v2/rents-per-capita";
var rpcs2=  require('./src/back/rpc/v2/API_RPC_v2');
app.use(rutaRPC2,rpcs2);


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

console.log("Starting server...");