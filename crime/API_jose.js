const express = require("express");
const bodyParser = require("body-parser");
var router = express.Router();
module.exports=router;
var app = express();
app.use(bodyParser.json());

const dataStore = require("nedb")
const path = require("path")

const dbFileName = path.join(__dirname,"crimes.db")

const db = new dataStore({
	filename: dbFileName,
	autoload: true	
});
//var port = process.env.PORT || 80;

var crimeratestats =  [
	{ 
		country: "Venezuela",
		year: 2016,
		cr_rate: 84.49,
		cr_saferate: 15.51,
		cr_homicrate: 56.3,
		cr_homicount: 17778,
		cr_theftrate: 1139.39,
		cr_theftcount: 213769
	},
	{ 
		country: "España",
		year: 2016,
		cr_rate: 31.77,
		cr_saferate: 68.23,
		cr_homicrate: 0.6,
		cr_homicount: 276,
		cr_theftrate: 422.21,
		cr_theftcount:195910 
	}		
];

router.put(":/loadInitialData", (req, res) =>{
	
	db.insert(crimeratestats);
	res.sendStatus(201,"DATA CREATED");
	console.log("Datos enviados:"+JSON.stringify(crimeratestats, null, 2));
	
});
//const BASE_API_URL = "/api/v1";

// GET CONTACTS

router.get("/", (req,res) =>{
	
	db.find ({}, (err, crimes) => {
		
		crimes.forEach ( (c) => {
			delete c._id;
		});
		
	res.send(JSON.stringify(crimes,null,2));
	console.log("Data sent:"+JSON.stringify(crimes,null,2));
	});
	
});


// POST CONTACTS

router.post("/",(req,res) =>{
	
	var newCrime = req.body;
	
	if((newCrime == "") || (newCrime.name == null)){
		res.sendStatus(400,"BAD REQUEST");
	} else {
		
		db.insert(newCrime);	
		res.sendStatus(201,"CREATED");
	}
});

// DELETE CONTACTS

// GET CONTACT/XXX

router.get("/:country/:year", (req,res)=>{
	
	var name = new Object();
	var year = new Object();
	name.name = req.params.country;
	year.year = parseInt(req.params.year);
/*	var filteredCrimes = crimeratestats.filter((c) => {
		return (c.name == name);
	});
	
	
	if(filteredCrimes.length >= 1){
		res.send(filteredContacts[0]);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	} */
	
	db.find({country:name, year:year}, function(err, crimes) {
    if (err) {
       	res.sendStatus(404,"COUNTRY NOT FOUND");
    }
    res.send(JSON.stringify(crimes,null,2));
	console.log("Data sent:"+JSON.stringify(crimes,null,2));
	}); 
}); 

// PUT CONTACT/XXX

router.put('/:country', (req,res)=>{
	
	var country= req.params.country;
	var body = req.body;
/*	var filtro = crimeratestats.filter((c) => {
		return (c.country == country);
	});
	
	if (filtro.length==0){
		res.sendStatus(404,"COUNTRY NOT FOUND");	
	}else{
		var body= req.body;
		var nuevocrate=crimeratestats.map((c)=>{
			if(c.country==country){
				c.country=body["country"];
				c.year=body["year"];
				c.cr_rate=body["cr_rate"];
			}
		});
		res.sendStatus(200,"OK");
	}
}); */
	
	db.update({country: country}, {$set: {country: body["country"], year: parseInt(body["year"]), 		cr_rate:parseFloat(body["cr_rate"])}}, {}, function(err, crimes) {
		if (err){
			res.sendStatus(404,"COUNTRY NOT FOUND");
		}
		res.sendStatus(200,"OK");
	});

router.delete("/:country", (req,res)=>{
	
	var name = req.params.country;
	
/*	var filteredContacts = crimeratestats.filter((c) => {
		return (c.country != name);
	});
	
	
	if(filteredContacts.length < contacts.length){
		contacts = filteredContacts;
		res.sendStatus(200);
	}else{
		res.sendStatus(404,"COUNTRY NOT FOUND");
	} */
	
	db.remove({country: name}, {multi:true}, function  (err, crimes) {
		if (err) {
			res.sendStatus(400,"BAD REQUEST");
		} else {
			res.sendStatus(200,"OK");}
	
	});
});
	
router.delete("/", (req,res)=>{
	
/*ar empt = [];
	
	if(crimeratestats.length > 0){
		crimeratestats = empt;
		res.sendStatus(200,"OK");
	}else{
		res.sendStatus(400,"BAD REQUEST");
	} */
	
	db.remove({}, {multi:true}, function  (err, crimes) {
		if (err) {
			res.sendStatus(400,"BAD REQUEST");
		} else {
			res.sendStatus(200,"OK");}
	
	});

});

