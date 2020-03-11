const express= require("express");

var app = express();

var tiempo= new Date()

app.get("/time",(request,response)=>{
	response.sendFile("/hora.html", { root: __dirname });
});
app.listen(80);

console.log("iniciando servidor...")