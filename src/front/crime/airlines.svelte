<script>
let CountriesData = [];
let chartData =[];
var nun = 0;
var bb = 0;
async function cuentaAeros(p, a){
    for (i in a) {
        if (i.nameCountry == p.nameCountry){
            bb = bb +1;
        }
    }
    return bb;
};
async function cargadatos(){
    const resData = await fetch("https://iatacodes-iatacodes-v1.p.rapidapi.com/api/v5/airports", {
	    "method": "GET",
	    "headers": {
		"x-rapidapi-host": "leopieters-iata-and-icao-v1.p.rapidapi.com",
	    "x-rapidapi-key": "3bccf248c4msh3d4a9dedc2c020cp1a889bjsn31014b11cae5"
	    }
    });

    let data = await resData.json();
    let data_ploty=[];
    let countries=[];
    let aeropuertos=[];
    data.forEach(element => {
        drugs.push(element.name);
        dosis.push(element[""]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: dosis,
        x: drugs,
        type: "histogram",
        name: "Dosis de drogas"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Aerolíneas</h1>
<div>
    En esta gráfica se representan las dosis de diversas drogas
<br>
<div id="myDiv"></div>
</div>
</main>