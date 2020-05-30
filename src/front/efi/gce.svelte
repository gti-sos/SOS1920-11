<script>
async function cargadatos() {
    const resData = await fetch("/api/v1/gce");
    let data = await resData.json();
    let data_ploty=[];
    let countrys=[];
    let contaminacion=[];
    let vehiculos=[];
    data.forEach(element => {
        countrys.push(element.country);
        contaminacion.push(element["gce_country"]);
        vehiculos.push(element["gce_cars"]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: contaminacion,
        x: countrys,
        marker: {
        color: 'pink',
	    },
        type: "histogram",
        name: "Contaminacion total"
    });
    data_ploty.push({
        histfunc: "sum",
        y: vehiculos,
        x: countrys,
        marker: {
        color: '#FEE1C7',
	    },
        type: "histogram",
        name: "total de vehiculos generados"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Contaminación producida por la producción de vehículos</h1>
<br>
<div>
Representación de la contaminacion producida por paises a lo largo del tiempo y
comparado con el numero de vehiculos producidos.
<br>
<div id="myDiv"></div>
</div>
</main>