
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
router.use(function procesador(req,res,next){
	console.log('Tratamiento de los efi');
	next();
});
router.get('/', function(req,res,next){
	
	res.send(efis);
	res.sendStatus(200,'OK')
})