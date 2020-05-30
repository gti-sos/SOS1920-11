<script>
async function cargadatos() {
    const resData = await fetch("/api/v2/imports");
    let data = await resData.json();
    let data_ploty=[];
    let countrys=[];
    let wastes=[];
    let alcoholimports=[];
    data.forEach(element => {
        countrys.push(element.country);
        wastes.push(element["gdawaste"]);
        alcoholimports.push(element["gdaethylalcohol"]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: wastes,
        x: countrys,
        type: "histogram",
        name: "Desechos totales"
    });
    data_ploty.push({
        histfunc: "sum",
        y: alcoholimports,
        x: countrys,
        type: "histogram",
        name: "importaciones totales"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<div>
Representación del nivel de importación de alcohol comparado con los residuos producidos por pais
<br>
<div id="myDiv"></div>
</div>
</main>