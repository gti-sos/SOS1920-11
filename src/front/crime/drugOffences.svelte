<script>
 async function cargadatos() {
    const resData = await fetch("/api/v1/drug_offences");
    let data = await resData.json();
    let data_ploty=[];
    let countrys=[];
    let ofensas=[];
    let uses = [];
    let supplies = [];
    data.forEach(element => {
        countrys.push(element.country);
        ofensas.push(element["cannabis_offences"]);
        uses.push(element["offences_use"]);
        supplies.push(element["offences_supply"]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: ofensas,
        x: countrys,
        type: "histogram",
        name: "Crimenes"
    });
    data_ploty.push({
        histfunc: "sum",
        y: uses,
        x: countrys,
        type: "histogram",
        name: "Consumos"
    });
    data_ploty.push({
        histfunc: "sum",
        y: supplies,
        x: countrys,
        type: "histogram",
        name: "Distribuidores"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Crímenes de drogas</h1>
<div>
En esta gráfica se representan la cantidad de delitos relacionados con drogas por país
<br>
<div id="myDiv"></div>
</div>
</main>