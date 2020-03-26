const express = require("express");
var app = express();
var router = express.Router();
module.exports=router;
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const parametros = 9;

var rpcs = [
	{ 
		country: "Spain",
		year: 2019,
		rpc:26420,
		piba:1244757,
		pib1t:306678,
		pib2t:310381,
		pib3t:311917,
		pib4t:315781,
		vpy: 2.0	
	},
	{ 
		country: "Slovenia",
		year: 2019,
		rpc:22980,
		piba:48007,
		pib1t:11900,
		pib2t:11961,
		pib3t:12104,
		pib4t:12200,
		vpy: 2.4
	}
];

//route handler
router.use(function procesador(req,res,next){
	console.log('Tratamiento de las rpc');
	next();
});

// GET RPC
router.get("/", (req,res) =>{
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
	
	var country= req.params.country;
	var rpcsfiltro = rpcs.filter((c) => {
		return (c.country == country);
	});
	
	if (rpcsfiltro.length==0){
		res.sendStatus(404,"COUNTRY NOT FOUND");	
	}else{
		
		var body= req.body;
		var len = 0
		for (x in body) {
			len+=1;
  		} 
		if (len!=parametros){
			res.sendStatus(400,"BAD REQUEST");
		}else{
		
			var nuevorpc=rpcs.map((c)=>{
				if(c.country==country){
					c.country=body["country"];
					c.vpy=body["vpy"];
				}
			});
			res.sendStatus(200,"OK");
		}
	}
});


