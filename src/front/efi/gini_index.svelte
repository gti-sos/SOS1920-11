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
    for (element in CountriesData){

    }
    //representación
    Highcharts.chart('container', {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Indices GINI'
    },
    subtitle: {
        text: 'Source: <a href="http://en.wikipedia.org/wiki/List_of_cities_proper_by_population">Wikipedia</a>'
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
        data: ,
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
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Esta gráfica muestra los índices GINI de los distintos paises a lo largo del tiempo.
    </p>
</figure>
{patata}
</main>