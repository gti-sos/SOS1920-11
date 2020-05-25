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
            let country = data.country;
            
            let deaths = data.deaths.total;
            countries.push(country);
            let data2 = [{country,deaths}];
            Data.push(data2);

        }); 



        Highcharts.chart('container', {
    chart: {
        type: 'pie',
        options3d: {
            enabled: true,
            alpha: 45,
            beta: 0
        }
    },
    title: {
        text: 'Covid Deaths by Country'
    },
    accessibility: {
        point: {
            valueSuffix: '%'
        }
    },
    tooltip: {
        pointFormat: '{series.name}: <b></b>'
    },
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            depth: 35,
            dataLabels: {
                enabled: true,
                format: '{point.name}'
            }
        }
    },
    series: [{
        type: 'pie',
        name: 'Covid Deaths by Country',
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
        Chart demonstrating the use of a 3D pie layout.
        The "Chrome" slice has been selected, and is offset from the pie.
        Click on slices to select and unselect them.
        Note that 3D pies, while decorative, can be hard to read, and the
        viewing angles can make slices close to the user appear larger than they
        are.
    </p>
</figure>
</main>