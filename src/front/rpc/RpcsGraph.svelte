<script>
    async function loadGraph(){

        let CountriesData = [];
        let EuropeCountries = [];
        let AsiaCountries = [];
        let AmericaCountries = [];
        let AfricaCountries = [];
        let OceaniaCountries = [];

        const resData = await fetch("/api/v3/rents-per-capita");
        CountriesData = await resData.json();
        CountriesData.filter(data => data.continent == "Europe" && data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            EuropeCountries.push(country);
        });     
        CountriesData.filter(data => data.continent == "Asia").forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            AsiaCountries.push(country);
        });
        CountriesData.filter(data => data.continent == "America").forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            AmericaCountries.push(country);
        });
        CountriesData.filter(data => data.continent == "Africa").forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            AfricaCountries.push(country);
        });
        CountriesData.filter(data => data.continent == "Oceania").forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            OceaniaCountries.push(country);
        });     


        Highcharts.chart('container', {
    chart: {
        type: 'packedbubble',
        height: '100%'
    },
    title: {
        text: 'Carbon emissions around the world (2014)'
    },
    tooltip: {
        useHTML: true,
        pointFormat: '<b>{point.name}:</b> {point.value} mill €'
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
            series:  [{
        name: 'Europe',
        data: EuropeCountries
    },
    {
        name: 'Asia',
        data: AsiaCountries
    },
    {
        name: 'Africa',
        data: AfricaCountries
    },
    {
        name: 'America',
        data: AmericaCountries
    },
    {
        name: 'Oceania',
        data: OceaniaCountries
    }]
});

    }

</script>
    <svelte:head>
        <script src="https://code.highcharts.com/highcharts.js"></script>
        <script src="https://code.highcharts.com/highcharts-more.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <script src="https://code.highcharts.com/modules/accessibility.js" on:load="{loadGraph}"></script>
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


   