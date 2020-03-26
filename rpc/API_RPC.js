const express = require("express");
var app = express();
var router = express.Router();
module.exports=router;
const bodyParser = require("body-parser");
app.use(bodyParser.json());

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

//route handler
router.use(function procesador(req,res,next){
	console.log('Tratamiento de las rpc');
	next();
});

// GET RPC
router.get("/r", (req,res) =>{
	res.send(JSON.stringify(rpcs,null,2));
	console.log("Data sent:"+JSON.stringify(rpcs,null,2));
});

// POST RPC
router.post("/",(req,res) =>{
	
	var newRpc = req.body;
	
	if((newRpc == "") || (newRpc.country == null)){
		res.sendStatus(400,"BAD REQUESTT");
	} else {
		rpcs.push(newRpc); 	
		res.sendStatus(201,"CREATED");
	}
});

// DELETE RPC
router.delete("/", (req,res)=>{
	
	
	
	var filteredRpcs = rpcs.filter((c) => {
		return (c.name != null);
	});
	
	
	if(filteredRpcs.length == 0){
		rpcs = filteredRpcs;
		res.sendStatus(200,"OK, RESOURCE EMPTY");
	}else{
		res.sendStatus(400,"SOMETHNG WAS WRONG");
	}
	
	
});

// GET RPC/COUNTRY

router.get("/:country", (req,res)=>{
	
	var country = req.params.country;
	
	var filteredRpcs = rpcs.filter((c) => {
		return (c.country == country);
	});
	
	
	if(filteredRpcs.length >= 1){
		res.send(filteredRpcs[0]);
		sendStatus(200,"OK")
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	}
});

// PUT RPC/COUNTRY

router.put('/:country', (req,res)=>{
	
	var country = req.params.country;
	
	var filteredRpcs = rpcs.filter((c) => {
		return (c.country == country);
	});
	
	
	if(filteredRpcs.length >= 1){
		c.country = req.body;
		res.send(c.country);
		sendStatus(200,"OK")
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	}
});


