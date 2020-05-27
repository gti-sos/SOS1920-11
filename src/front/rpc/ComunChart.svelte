<script>
    async function loadGraph(){

        let RpcData = [];
        let CrimeData = [];
        let EfiData = [];

        let RpcDataGraph = [];
        let CrimeDataGraph = [];
        let EfiDataGraph = [];

        const resData = await fetch("/api/v3/rents-per-capita");
        RpcData = await resData.json();

        const resData2 = await fetch("/api/v2/economic-freedom-indexes");
        EfiData = await resData2.json();

    //    const resData3 = await fetch("/api/v2/crime-rate-stats");
    //    CrimeData = await resData3.json();

        RpcData.filter(data => data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            RpcDataGraph.push(country);
        });     
        EfiData.filter(data => data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.efiindex
    	};
            EfiDataGraph.push(country);
        });
     /*   CrimeData.filter(data => data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.cr_rate
    	};
            CrimeDataGraph.push(country);
        });
    */
        Highcharts.chart('container', {
    chart: {
        type: 'packedbubble',
        height: '100%'
    },
    title: {
        text: 'Rents per capita / Economic freedom indexes / Crime rate stats (2019)'
    },
    tooltip: {
        useHTML: true,
        pointFormat: '<b>{point.name}:</b> {point.value}'
    },
    plotOptions: {
        packedbubble: {
            minSize: '30%',
            maxSize: '120%',
            zMin: 0,
            zMax: 1000000,
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
                    value: 10000
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
        name: 'Rents-per-capita',
        data: RpcDataGraph
    },
    {
        name: 'Economic-freedom-indexes',
        data: EfiDataGraph
    }/*,
    {
        name: 'Crime-rate-stats',
        data: CrimeDataGraph
    }*/]
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


   