const express= require("express");

var app = express();

var tiempo= new Date()

var port = process.env.PORT || 80;
/**
app.get("/public",(request,response)=>{
	response.sendFile("/public/", { root: __dirname });
});**/

app.use("/",express.static("./public"));

app.listen(port, ()=>{
	console.log("Ready!")
});

console.log("iniciando servidor...")