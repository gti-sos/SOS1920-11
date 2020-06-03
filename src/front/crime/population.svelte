<script>
let CountriesData = [];
let chartData =[];
var nun = 0;
var bb = 0;

async function cargadatos(){
    const resData = await fetch("https://restcountries-v1.p.rapidapi.com/all", {
	    "method": "GET",
	    "headers": {
	"x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
	"x-rapidapi-key": "3bccf248c4msh3d4a9dedc2c020cp1a889bjsn31014b11cae5"
	    }
    });

    let data = await resData.json();
    let data_ploty=[];
    let countries=[];
    let poblacion=[];
    data.forEach(element => {
        countries.push(element.name);
        poblacion.push(element["population"]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: dosis,
        x: drugs,
        type: "histogram",
        name: "Poblacion de paises"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Poblacion por países</h1>
<div>
    En esta gráfica se representan las poblaciones de varios países
<br>
<div id="myDiv"></div>
</div>
</main>