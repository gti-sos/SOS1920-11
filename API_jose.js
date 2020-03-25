const express = require("express");
const bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.json());

var port = process.env.PORT || 80;

var crimeratestats = [
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

const BASE_API_URL = "/api/v1";

// GET CONTACTS

app.get(BASE_API_URL+"/crimeratestats", (req,res) =>{
	res.send(JSON.stringify(crimeratestats,null,2));
	console.log("Data sent:"+JSON.stringify(crimeratestats,null,2));
});


// POST CONTACTS

app.post(BASE_API_URL+"/crimeratestats",(req,res) =>{
	
	var newCrime = req.body;
	
	if((newCrime == "") || (newCrime.name == null)){
		res.sendStatus(400,"BAD REQUEST");
	} else {
		crimeratestats.push(newContact); 	
		res.sendStatus(201,"CREATED");
	}
});

// DELETE CONTACTS

// GET CONTACT/XXX

app.get(BASE_API_URL+"/crimeratestats/:name", (req,res)=>{
	
	var name = req.params.name;
	
	var filteredCrimes = crimeratestats.filter((c) => {
		return (c.name == name);
	});
	
	
	if(filteredCrimes.length >= 1){
		res.send(filteredContacts[0]);
	}else{
		res.sendStatus(404,"CONTACT NOT FOUND");
	}
});

// PUT CONTACT/XXX

// DELETE CONTACT/XXX

app.delete(BASE_API_URL+"/ccrimeratestats/:country", (req,res)=>{
	
	var name = req.params.name;
	
	var filteredContacts = crimeratestats.filter((c) => {
		return (c.country != name);
	});
	
	
	if(filteredContacts.length < contacts.length){
		contacts = filteredContacts;
		res.sendStatus(200);
	}else{
		res.sendStatus(404,"CONTACT NOT FOUND");
	}
	
	
});


app.listen(port, () => {
	console.log("Server ready");
});

console.log("Starting server...");