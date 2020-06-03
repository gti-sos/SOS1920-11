<script>  

 async function cargadatos() {
    const resData = await fetch("https://geohub3.p.rapidapi.com/countries", {
	    "method": "GET",
	    "headers": {
	"x-rapidapi-host": "geohub3.p.rapidapi.com",
	"x-rapidapi-key": "3bccf248c4msh3d4a9dedc2c020cp1a889bjsn31014b11cae5"
        }});
        
    let data = await resData.json();
    let data_ploty=[];
    let paises=[];
    let codigos=[];
    data.forEach(element => {
        paises.push(element.name);
        codigos.push(element["countryCode"]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: codigos,
        x: paises,
        type: "histogram",
        name: "Códigos de países"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Códigos de cada país</h1>
<div>
    En esta gráfica se representan las codigos de cada país en el mundo
<br>
<div id="myDiv"></div>
</div>
</main>