<script>

    let Data = [];
    let countries = [];
    let CountriesData = [];
    async function loadGraph(){
            const resData = await fetch("https://restcountries-v1.p.rapidapi.com/all", {
	"method": "GET",
	"headers": {
		"x-rapidapi-host": "restcountries-v1.p.rapidapi.com",
		"x-rapidapi-key": "0f1c9a6651mshcc6fb880746f7d2p18a345jsna7eda5bbbed3"
    }
    
});

    
    CountriesData = await resData.json();
        console.log(CountriesData);

    CountriesData.forEach((data) => {
            let country = data.name;
            
            let area = data.area;
            countries.push(country);
            Data.push(area);

        }); 
        
    Highcharts.chart('container', {
    chart: {
        type: 'cylinder',
        options3d: {
            enabled: true,
            alpha: 15,
            beta: 15,
            depth: 50,
            viewDistance: 25
        }
    },
    title: {
        text: 'Countries areas'
    },
    xAxis: {
        categories: countries
    },
    plotOptions: {
        series: {
            depth: 25,
            colorByPoint: true
        }
    },
    series: [{
        data: Data,
        name: 'Country Area:',
        showInLegend: false
    }]
});

}




    
</script>

<svelte:head>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/highcharts-3d.js"></script>
<script src="https://code.highcharts.com/modules/cylinder.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" on:load={loadGraph}></script>
</svelte:head>

<main>

<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Chart showing basic use of 3D cylindrical columns. A 3D cylinder chart
        is similar to a 3D column chart, with a different shape.
    </p>
</figure>
</main>


   