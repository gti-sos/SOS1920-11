<script>
 async function cargadatos() {
    const resData = await fetch("/api/v2/sugarconsume");
    let data = await resData.json();
    let data_ploty=[];
    let countrys=[];
    let consumes=[];
    data.forEach(element => {
        countrys.push(element.country);
        consumes.push(element["sugarconsume"]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: consumes,
        x: countrys,
        type: "histogram",
        name: "Consumo de azucar"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Consumo de azucar</h1>
<div>
En esta gráfica se representa el consumo de azucar por país 
<br>
<div id="myDiv"></div>
</div>
</main>