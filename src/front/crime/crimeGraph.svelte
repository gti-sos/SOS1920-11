<script>
let paises= [];

async function cargadatos (){
    const resData = await fetch("/api/v2/crime-rate-stats");
    let data = await resData.json();
    let data_ploty=[];
    let countries=[];
    let crimerates=[];
    let saferates=[];
    let theftrates=[];
    let theftcounts = [];
    let homirates=[];
    let homicounts = [];
    data.forEach(element => {
        countries.push(element.country);
        crimerates.push(element["cr_rate"]);
        saferates.push(element["cr_saferate"]);
        theftrates.push(element["cr_theftrate"]);
        theftcounts.push(element["cr_theftcount"]);
        homirates.push(element["cr_homicrate"]);
        homicounts.push(element["cr_homicount"]);
    });
//....................................
    let crratemedio = crimerates.reduce((a, b) => a + b, 0)/crimerates.length;
    let sfratemedio= 100.0 - crratemedio;
    let thefmedio= theftrates.reduce((a, b) => a + b, 0)/theftrates.length;
    let hommedio = homirates.reduce((a, b) => a + b, 0)/homirates.length;
    Highcharts.chart('contenedor1', {
        
        chart: {
            type: 'column'
        },
        title: {
            text: 'Crime Rate stats'
        },
        xAxis:{
            categories:["crime rate medio","safe rate medio", "tasa homicidios medios","tasa robo medio"]
        },
        yAxis: {
            allowDecimals: true,
            title: {
                text: 'Crime rates'
            }
        },
        series:{
            name: "Datos medios",
            data:[crratemedio,sfratemedio,thefmedio,hommedio]
        }
    });
//....................................
    data_ploty.push({
        histfunc: "sum",
        y: crimerates,
        x: countries,
        type: "histogram",
        name: "Criminalidad"
    });
    data_ploty.push({
        histfunc: "sum",
        y: saferates,
        x: countries,
        type: "histogram",
        name: "Tasa de seguridad"
    });
    data_ploty.push({
        histfunc: "sum",
        y: theftrates,
        x: countries,
        type: "histogram",
        name: "Tasa de robo"
    });
    data_ploty.push({
        histfunc: "sum",
        y: theftcounts,
        x: countries,
        type: "histogram",
        name: "Conteo de robos"
    });
    data_ploty.push({
        histfunc: "sum",
        y: homirates,
        x: countries,
        type: "histogram",
        name: "Tasa de homicidios"
    });
    data_ploty.push({
        histfunc: "sum",
        y: homicounts,
        x: countries,
        type: "histogram",
        name: "Conteo de homicidios"
    });
    Plotly.newPlot('myDiv', data_ploty);

    
};

</script>
<svelte:head>
    
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js" ></script>
    <script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
    
</svelte:head>
<main>
    <h2>Crime rate stats - Highcharts</h2>
    
    <figure class="highcharts-figure">
        <div id="contenedor1"></div>
        <p class="highcharts-description">
        En este gráfico podemos apreciar la tasa de criminalidad y de seguridad de varios países
        dadas por el índice de asesinatos y el de robos por país. Los datos de la tabla y del gráfico no son
        todos los recursos de mi aplicación. 
    </p>

    </figure>
    <h2>Crime rate stats - Chart.js</h2>
    <div id="myDiv">

    </div>

</main>