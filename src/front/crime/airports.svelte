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
    CountriesData = await resData.json();
    console.log(CountriesData);
    CountriesData.forEach(element => {

        nun = cuentaAeros(element, CountriesData);
        chartData.push([element["nameCountry"],element["gini"]]);
    });
    console.log(chartData);
    //representación
    Highcharts.chart('container', {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Aeropuertos por país'
    },
    subtitle: {
        text: 'Fuente: <a href="https://data.worldbank.org/indicator/SI.POV.GINI">GINI index (World Bank estimate)</a>'
    },
    xAxis: {
        type: 'category',
        labels: {
            rotation: -45,
            style: {
                fontSize: '13px',
                fontFamily: 'Verdana, sans-serif'
            }
        }
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Aeropuertos'
        }
    },
    legend: {
        enabled: false
    },
    tooltip: {
        pointFormat: 'Indice GINI: <b>{point.y:.1f} </b>'
    },
    series: [{
        name: 'Indice GINI por ',
        data: chartData,
        dataLabels: {
            enabled: true,
            rotation: -90,
            color: '#FFFFFF',
            align: 'right',
            format: '{point.y:.1f}', // one decimal
            y: 10, // 10 pixels down from the top
            style: {
                fontSize: '13px',
                fontFamily: 'Verdana, sans-serif'
            }
        }
    }]
});
};
</script>

<svelte:head>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>AEROPUERTOS</h1>
<h2>Medición de la desigualdad de ingresos</h2>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Esta gráfica muestra los índices GINI de los distintos paises del mundo. El índice GINI es
        un derivado del coeficiente GINI. El coeficiente GINI mide la desigualdad de ingresos dentro
        de un país. El índice GINI no es más que presentar el dicho coeficiente GINI en tanto por cien.
    </p>
</figure>

</main>