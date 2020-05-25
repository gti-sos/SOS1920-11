<script>

    let CountriesData = [];
    
    async function loadGraph(){
    const resData = await fetch("api/v2/emigrants-stats");
    
    let DataCountries = [];
    let SeriesCountries = [];
   
    CountriesData = await resData.json();

    CountriesData.forEach((data) => {
            let country = { 
		        'name': data.country +" " + data.year,
                'y': data.em_totals,
                'drilldown': data.country
                
            };
            
            let series = {
                'name': data.country,
                'id': data.country,
                'data': [[
                        "em_man",
                        data.em_man
                    ],
                    [
                        "em_woman",
                        data.em_woman
                    ]]
            }
            DataCountries.push(country);
            SeriesCountries.push(series);
        }); 

    console.log(CountriesData);

    Highcharts.chart('container', {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Countries emigration'
    },
    accessibility: {
        announceNewData: {
            enabled: true
        }
    },
    xAxis: {
        type: 'category'
    },
    yAxis: {
        title: {
            text: 'Total emigrations'
        }

    },
    legend: {
        enabled: false
    },
    plotOptions: {
        series: {
            borderWidth: 0,
            dataLabels: {
                enabled: true,
                format: '{point.y}'
            }
        }
    },

    tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b><br/>'
    },

    series: [
        {
            name: "Countries",
            colorByPoint: true,
            data: DataCountries
        }
    ],
    drilldown: {
        series: 
            SeriesCountries
        
    }
});
    }

    loadGraph();
</script>
<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/data.js"></script>
    <script src="https://code.highcharts.com/modules/drilldown.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js" on:lodad={loadGraph}></script>
</svelte:head>

<main>
    <figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Chart showing emigration numbers by country. Clicking on individual columns
        brings up more detailed data. This chart makes use of the drilldown
        feature in Highcharts to easily switch between datasets.
    </p>
</figure>
</main>