<script>
 async function cargadatos() {
    const resData = await fetch("/api/v2/traffic-accidents");
    console.log(resData.status);
    let data = await resData.json();
    let data_ploty=[];
    let provincias=[];
    let victimas=[];
    let deads=[];
    let injureds=[];
    data.forEach(element => {
        provincias.push(element.province);
        victimas.push(element["trafficaccidentvictim"]);
        deads.push(element["dead"]);
        injureds.push(element["injured"]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: victimas,
        x: provincias,
        type: "histogram",
        name: "Victimas"
    });
    data_ploty.push({
        histfunc: "sum",
        y: deads,
        x: provincias,
        type: "histogram",
        name: "Muertos"
    });
    data_ploty.push({
        histfunc: "sum",
        y: injureds,
        x: provincias,
        type: "histogram",
        name: "Heridos"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Accidentes de tráfico</h1>
<div>
En esta gráfica se representan los accidentes de tráfico en Andalucía
<br>
<div id="myDiv"></div>
</div>
</main>