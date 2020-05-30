<script>
let CountriesData = [];
let chartData =[];
let patata = ["patata",11];
async function cargadatos(){
    const resData = await fetch("https://restcountries-v1.p.rapidapi.com/all", {
	    "method": "GET",
	    "headers": {
		"x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
		"x-rapidapi-key": "fbc3a26ce8mshdb989f0848b0219p134cc7jsn7c3ac5c079da"
	    }
    });
    CountriesData = await resData.json();
    console.log(CountriesData);
    CountriesData.forEach(element => {
        if (element["gini"]!=null){chartData.push([element["name"],element["gini"]]);}
    });
    console.log(chartData);
    //representación
    Highcharts.chart('container', {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Indices GINI'
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
            text: 'Indice GINI'
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
<h1>INDICES GINI</h1>
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