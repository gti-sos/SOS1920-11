<script>
    import ApexCharts from 'apexcharts';
    import {pop} from "svelte-spa-router";
	import Button from "sveltestrap/src/Button.svelte";
    async function loadGraph(){

        let CountriesData = [];
        let EuropeCountries = [];
        let AsiaCountries = [];
        let AmericaCountries = [];
        let AfricaCountries = [];
        let OceaniaCountries = [];
        let rpcData = [];
        let vpyData = [];
        let countries = [];

        const resData = await fetch("/api/v3/rents-per-capita");
        CountriesData = await resData.json();
        CountriesData.filter(data => data.continent == "Europe" && data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	    };
            EuropeCountries.push(country);
        });     
        CountriesData.filter(data => data.continent == "Asia" && data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	    };
            AsiaCountries.push(country);
        });
        CountriesData.filter(data => data.continent == "America" && data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            AmericaCountries.push(country);
        });
        CountriesData.filter(data => data.continent == "Africa" && data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            AfricaCountries.push(country);
        });
        CountriesData.filter(data => data.continent == "Oceania" && data.year == 2019).forEach((data) => {
            let country = { 
		        'name': data.country,
		        'value': data.rpc
    	};
            OceaniaCountries.push(country);
        });   
        
         CountriesData.forEach((data) => {
            countries.push(data.country+"-"+data.year);
            rpcData.push(data.rpc);
            vpyData.push(data.vpy);
        }); 


        Highcharts.chart('container', {
    chart: {
        type: 'packedbubble',
        height: '100%'
    },
    title: {
        text: 'Rents per capita (2019)'
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

var options = {
          series: [{
          name: 'RPC',
          data: rpcData
        }, {
          name: 'VPY',
          data: vpyData
        }],
          chart: {
          type: 'bar',
          height: 350
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          },
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: countries,
        },
        yaxis: [{
          title: {
            text: 'Rents per capita (€)'
          }
        },{
          title: {
            text: 'Variation per year (%)'
          }
        }],
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val 
            }
          }
        }
        };

        var chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();

}

    

</script>
    <svelte:head>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

        <script src="https://code.highcharts.com/highcharts.js"></script>
        <script src="https://code.highcharts.com/highcharts-more.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <script src="https://code.highcharts.com/modules/accessibility.js" on:load="{loadGraph}"></script>
    </svelte:head>
<main>
    <a href="/#"><Button outline color="warning">INICIO</Button></a>
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>

    <h2>RENTS-PER-CAPITA (highcharts)</h2>

    <figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Packed bubble charts are visualizations where the size and optionally
        the color of the bubbles are used to visualize the data. The positioning
        of the bubbles is not significant, but is optimized for compactness.
        Try dragging the bubbles in this chart around, and see the effects.
    </p>
</figure>

    <h2>RENTS-PER-CAPITA (apexcharts)</h2>
 <div id="chart"></div>

</main>


   