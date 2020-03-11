const express= require("express");

var app = express();

var tiempo= new Date()

app.get("/public",(request,response)=>{
	response.sendFile("/public/index.html", { root: __dirname });
});


app.listen(80);

console.log("iniciando servidor...")