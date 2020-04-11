const path = require("path");
const express = require("express");
var app = express();
var router = express.Router();
module.exports=router;
const bodyParser = require("body-parser");
app.use(bodyParser.json()); 
const parametros= 15;
const BASE_API_URL = "/api/v1";
const dataStore = require("nedb");
const dbfile = path.join(__dirname,"efis.db") ;

// inicialización de base de datos 

var db = new dataStore ({filename: dbfile, autoload: true});

//app.use(bodyParser.json());
var efis=[];
//route handler
router.use(function procesador(req,res,next){
	console.log('Tratamiento de los efi');
	next();
});

//loadInitialData
var init=[{
		'country':'New Zeland',
		'year':2019,
		'efiindex':84.4,
		'efigovint':95,
		'efipropright':96.7,	
		'efijudefct':83.5,	
		'efitaxburden':71,	
		'efigovspend':50.4,	
		'efisicalhealth':98.6, 	
		'efibusfreed':91,	
		'efilabfreed':86.7,
		'efimonfreed':87.5,	
		'efitradefreed':92.4,	
		'efiinvfreed':80,	
		'efifinfred':80
	},
{
		'country':'Chile',
		'year': 2019,
		'efiindex':75.4,
		'efigovint':62.3,
		'efipropright':68.7,	
		'efijudefct':56.3,	
		'efitaxburden':77.3,	
		'efigovspend':81,	
		'efisicalhealth':89, 	
		'efibusfreed':76.6,	
		'efilabfreed':65,
		'efimonfreed':84.5,	
		'efitradefreed':88.8,	
		'efiinvfreed':85,	
		'efifinfred':70
		}];
router.get('/loadInitialData',(req,res)=>{
	//var init = require("./initaldata.json");
	
	efis=init;
	res.sendStatus(201,"DATA CREATED");
});

//get efis
router.get('/', function(req,res,next){
	
	res.send(efis);
	res.sendStatus(200,'OK')
})
//post efis
router.post('/',(req,res) =>{
	
	var newefi = req.body;
	
	if((newefi == "") || (newefi.country == null)){
		res.sendStatus(400,"BAD REQUEST");
	} else {
		efis.push(newefi); 	
		res.sendStatus(201,"CREATED");
	}
});

//get efi
router.get("/:country/:year", (req,res)=>{
	
	var country = req.params.country;
	var year= req.params.year;
	var efisfiltro = efis.filter((c) => {
		return (c.country == country && c.year==year);
	});
	
	
	if(efisfiltro.length >= 1){
		res.send(efisfiltro[0]);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	}
})

//delete specific efi

router.delete("/:country/:year", (req,res)=>{
	
	var country = req.params.country;
	var year= req.params.year;

	var efisfiltro = efis.filter((c) => {
		return ((c.country != country)||(c.year!=year));
	});
	
	
	if(efisfiltro.length < efis.length){
		efis = efisfiltro;
		res.sendStatus(200);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	}
});

//PUT specific efi

router.put('/:country/:year', (req,res)=>{
	
	var country= req.params.country;
	var year= req.params.year;
	var efisfiltro = efis.filter((c) => {
		return (c.country == country && c.year==year);
	});
	
	if (efisfiltro.length==0){
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
		
			var nuevoefi=efis.map((c)=>{
				if(c.country==country){
					c.country=body["country"];
					c.year=body["year"];
					c.efiindex=body["efiindex"];
					c.efigovint=body["efigovint"];
					c.efipropright=body["efipropright"];
					c.efijudefct=body['efijudefct'];
					c.efitaxburden=body['efitaxburden'];
					c.efigovspend=body['efigovspend'];
					c.efisicalhealth=body['efisicalhealth'];
					c.efibusfreed=body['efibusfreed'];
					c.efilabfreed=body['efilabfreed'];
					c.efimonfreed=body['efimonfreed'];
					c.efitradefreed=body['efitradefreed'];
					c.efiinvfreed=body['efiinvfreed'];
					c.efifinfred=body['efifinfred'];
				}
			});
			res.sendStatus(200,"OK");
		}
	}
});

//post specific efi --> wrong method

router.post('/:country/:year', (req,res)=>{
	res.sendStatus(405,"METHOD NOT ALLOWED");
});


//put to base route --> wrong method

router.put('/', (req,res)=>{
	res.sendStatus(405,"METHOD NOT ALLOWED");
});

// DELETE base route deletes efis resource

router.delete('/', (req,res)=>{
	
	efis=[];
	res.sendStatus(200, "OK, resource destroyed");
});

