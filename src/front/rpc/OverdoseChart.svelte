<script>
    import {pop} from "svelte-spa-router";
	import Button from "sveltestrap/src/Button.svelte";
    async function loadGraph(){
        let countries = [];
        let rpcData = [];
        let totalDeaths = [];
        let femaleDeaths = [];
        let maleDeaths = [];
        let Data = [];

         let CountriesData1 = [];
        const resData1 = await fetch("api/v3/rents-per-capita");
        
        CountriesData1 = await resData1.json();

       

        let CountriesData2 = [];

        const resData2 = await fetch("api/v2/overdose-deaths");
        
        CountriesData2 = await resData2.json();

        CountriesData1.forEach((data) => {
            let country = data.country +" " + data.year;
            
            let rpc = data.rpc;

            countries.push(country);
            rpcData.push(rpc);
           totalDeaths.push("-");
           femaleDeaths.push("-");
           maleDeaths.push("-");

        }); 

        CountriesData2.forEach((data) => {
            let country = data.country +" " + data.year;
            
            let maledeaths = data.death_male;
            let femaledeaths = data.death_female;
            let totaldeaths = data.death_total;

            countries.push(country);
            rpcData.push("-");
           totalDeaths.push(totaldeaths);
           femaleDeaths.push(femaledeaths);
           maleDeaths.push(maledeaths);

        }); 



        console.log(CountriesData2);

     
        console.log(CountriesData1);

       

        Highcharts.chart('container', {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Comparing Rents per capita and Overdose Deaths'
    },
    xAxis: {
        categories: countries
    },
    yAxis: [{
        min: 0,
        title: {
            text: 'RPC'
        }
    }, {
        title: {
            text: 'Deaths'
        },
        opposite: true
    }],
    legend: {
        shadow: false
    },
    tooltip: {
        shared: true
    },
    plotOptions: {
        column: {
            grouping: false,
            shadow: false,
            borderWidth: 0
        }
    },
    series: [{
        name: 'RPC',
        color: 'rgba(165,170,217,1)',
        data: rpcData,
        pointPadding: 0.3,
        pointPlacement: -0.2
    }, {
        name: 'Total Deaths',
        color: 'rgba(126,86,134,.9)',
        data: totalDeaths,
        pointPadding: 0.4,
        pointPlacement: -0.2
    }, {
        name: 'Women Deaths',
        color: 'rgba(248,161,63,1)',
        data: femaleDeaths,
        pointPadding: 0.3,
        pointPlacement: 0.2,
        yAxis: 1
    }, {
        name: 'Men Deaths',
        color: 'rgba(186,60,61,.9)',
        data: maleDeaths,
        pointPadding: 0.4,
        pointPlacement: 0.2,
        yAxis: 1
    }]
});
    }
</script>

<svelte:head>
<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" on:load={loadGraph}></script>
</svelte:head>

<main>
    <a href="/#"><Button outline color="warning">INICIO</Button></a>
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Chart showing overlapping placement of columns, using different data
        series. The chart is also using multiple y-axes, allowing data in
        different ranges to be visualized on the same chart.
    </p>
</figure>

</main>