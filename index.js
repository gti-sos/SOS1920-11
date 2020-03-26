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

const rutaEFI = BASE_API_URL + '/economic-freedom-indexes'; 
var efis=  require('./efi/efi');
app.use(rutaEFI,efis);


//Acceso a rents-per-capita

const rutaRPC = BASE_API_URL + '/rents-per-capita';
var rpcs=  require('./rpc/API_RPC');
app.use(rutaRPC,rpcs);


//Acceso a crime-rate-stats


const rutaCrime = BASE_API_URL + '/crimeratestats';
var rcrime=  require('./crime/API_jose');
app.use(rutaCrime,rcrime);

//Server start up
app.listen(port, () => {
	console.log("Server ready");
});

console.log("Starting server...");