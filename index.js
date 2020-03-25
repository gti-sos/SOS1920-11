const express = require("express");
const bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());

var port = process.env.PORT || 80;

/**
app.get("/public",(request,response)=>{
	response.sendFile("/public/", { root: __dirname });
});**/

app.use("/",express.static("./public"));

var rpcs = [
	{ 
		country: "Spain",
		vpy: 2.0	
	},
	{ 
		country: "Slovenia",
		vpy: 2.4
	}
];

const BASE_API_URL = "/api/v1";

// GET RPCS

app.get(BASE_API_URL+"/rpcs", (req,res) =>{
	res.send(JSON.stringify(rpcs,null,2));
	console.log("Data sent:"+JSON.stringify(rpcs,null,2));
});


// POST RPCS

app.post(BASE_API_URL+"/rpcs",(req,res) =>{
	
	var newRpc = req.body;
	
	if((newRpc == "") || (newRpc.country == null)){
		res.sendStatus(400,"BAD REQUESTT");
	} else {
		rpcs.push(newRpc); 	
		res.sendStatus(201,"CREATED");
	}
});

// DELETE RPCS

app.delete(BASE_API_URL+"/rpcs", (req,res)=>{
	
	
	
	var filteredRpcs = rpcs.filter((c) => {
		return (c.name != null);
	});
	
	
	if(filteredRpcs.length == 0){
		rpcs = filteredRpcs;
		res.sendStatus(200);
	}else{
		res.sendStatus(400,"COUNTRY NOT FOUND");
	}
	
	
});


// GET RPCS/XXX

app.get(BASE_API_URL+"/rpcs/:country", (req,res)=>{
	
	var country = req.params.country;
	
	var filteredRpcs = rpcs.filter((c) => {
		return (c.country == country);
	});
	
	
	if(filteredRpcs.length >= 1){
		res.send(filteredRpcs[0]);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	}
});

// PUT RPCS/XXX

// DELETE RPCS/XXX

app.delete(BASE_API_URL+"/rpcs/:country", (req,res)=>{
	
	var country = req.params.country;
	
	var filteredRpcs = rpcs.filter((c) => {
		return (c.country != country);
	});
	
	
	if(filteredRpcs.length < rpcs.length){
		rpcs = filteredRpcs;
		res.sendStatus(200);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	}
	
	
});

//Acceso al recurso economic-freedom-indexes

rutaEFI = BASE_API_URL + '/economic-freedom-indexes'; 
var efis=  require('./efi/efi');
app.use(rutaEFI,efis);





app.listen(port, () => {
	console.log("Server ready");
});

console.log("Starting server...");