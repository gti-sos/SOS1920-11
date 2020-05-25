<script>

    let Data = [];
    let countries = [];
    let CountriesData = [];
    let CountriesData2 = [];
    async function loadGraph(){
            const resData = await fetch("https://covid-193.p.rapidapi.com/statistics", {
	    "method": "GET",
	    "headers": {
		"x-rapidapi-host": "covid-193.p.rapidapi.com",
		"x-rapidapi-key": "0f1c9a6651mshcc6fb880746f7d2p18a345jsna7eda5bbbed3"
	    }
    });

    CountriesData = await resData.json();
        console.log(CountriesData.response);
    
    CountriesData2 = CountriesData.response;
    CountriesData2.forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.deaths.total
    	};
    Data.push(country);
    });

        Highcharts.chart('container', {
    chart: {
        type: 'packedbubble',
        height: '100%'
    },
    title: {
        text: 'Deaths caused by Covid-19'
    },
    tooltip: {
        useHTML: true,
        pointFormat: '<b>{point.name}:</b> {point.value} deaths'
    },
    plotOptions: {
        packedbubble: {
            minSize: '30%',
            maxSize: '120%',
            zMin: 0,
            zMax: 1000,
            layoutAlgorithm: {
                splitSeries: false,
                gravitationalConstant: 0.02
            },
            dataLabels: {
                enabled: true,
                format: '{point.name}',
                filter: {
                    property: 'y',
                    operator: '>',
                    value: 250
                },
                style: {
                    color: 'black',
                    textOutline: 'none',
                    fontWeight: 'normal'
                }
            }
        }
    },
    series: [{
        name: 'Countries',
        data: Data
    }]
});
}
</script>

<svelte:head>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/highcharts-3d.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" on:load={loadGraph}></script>
</svelte:head>

<main>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Packed bubble charts are visualizations where the size and optionally
        the color of the bubbles are used to visualize the data. The positioning
        of the bubbles is not significant, but is optimized for compactness.
        Try dragging the bubbles in this chart around, and see the effects.
    </p>
</figure>
</main>