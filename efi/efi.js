const express = require("express");
var app = express();
var router = express.Router();
const BASE_API_URL = "/api/v1";

app.use(bodyParser.json());
var efis=[
	
	{
		'country':'New Zeland'
	}
	
]
app.get(BASE_API_URL+'/economic-freedom-indexes', (req,res)=>{
	
	res.send(JSON.stringify(efis,null,2));
	res.sendStatus(200,'OK')
})