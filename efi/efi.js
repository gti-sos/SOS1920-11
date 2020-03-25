
const express = require("express");
var app = express();
var router = express.Router();
module.exports=router;
//const bodyParser = require("body-parser");

const BASE_API_URL = "/api/v1";


//app.use(bodyParser.json());
var efis=[
	
	{
		'country':'New Zeland'
	}
]
//route handler
router.use(function procesador(req,res,next){
	console.log('Tratamiento de los efi');
	next();
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
		efis.push(newContact); 	
		res.sendStatus(201,"CREATED");
	}
});

//get efi
app.get("/:country", (req,res)=>{
	
	var country = req.params.country;
	
	var efisfiltro = efis.filter((c) => {
		return (c.country == country);
	});
	
	
	if(efisfiltro.length >= 1){
		res.send(efisfiltro[0]);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	}
})

//delete specific efi

app.delete("/:country", (req,res)=>{
	
	var country = req.params.country;
	
	var efisfiltro = efis.filter((c) => {
		return (c.country != country);
	});
	
	
	if(efisfiltro.length < efis.length){
		efis = efisfiltro;
		res.sendStatus(200);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	}
	
	
});