<script>
 async function cargadatos() {
    const resData = await fetch("/api/v2/natality-stats");
    let data = await resData.json();
    let data_ploty=[];
    let countrys=[];
    let natalities=[];
    let man_natalities=[];
    let woman_natalities=[];
    data.forEach(element => {
        countrys.push(element.country);
        natalities.push(element["natality_totals"]);
        woman_natalities.push(element["natality_women"]);
        man_natalities.push(element["natality_men"]);
    });
    
    console.log("numero total de natalidades:", natalities);
    console.log("numero total de natalidades hombres:", man_natalities);
    console.log("numero total de natalidades mujeres:", woman_natalities);
    data_ploty.push({
        histfunc: "sum",
        y: natalities,
        x: countrys,
        type: "histogram",
        name: "Natalidad total"
    });
    data_ploty.push({
        histfunc: "sum",
        y: woman_natalities,
        x: countrys,
        type: "histogram",
        name: "Natalidad de mujeres"
    });
    data_ploty.push({
        histfunc: "sum",
        y: man_natalities,
        x: countrys,
        type: "histogram",
        name: "Natalidad de hombres"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Natalidad por países</h1>
<div>
En esta gráfica se representa la natalidad de varios paises
<br>
<div id="myDiv"></div>
</div>
</main>