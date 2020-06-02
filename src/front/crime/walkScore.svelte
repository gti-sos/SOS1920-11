


<script>

//en proceso
    let CountriesData = [];
    let chartData =[];
    async function cargaDatos(){
    const resData = await fetch("https://walk-score.p.rapidapi.com/score", {
	    "method": "GET",
	    "headers": {
	        "x-rapidapi-host": "walk-score.p.rapidapi.com",
	        "x-rapidapi-key": "3bccf248c4msh3d4a9dedc2c020cp1a889bjsn31014b11cae5",
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
<script src="https://code.highcharts.com/modules/accessibility.js" on:load="{cargadDatos}"></script>
</svelte:head>
<main>
<h1>Walk Score</h1>
<h2>Medición de la "Walk Score"</h2>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Esta gráfica muestra la "Walk Score" de cualquier país, es decir, la caminabilidad de éste. Esto
        nos indica cómo de favorable es el entorno hacia las personas que están en él.
    </p>
</figure>

</main>