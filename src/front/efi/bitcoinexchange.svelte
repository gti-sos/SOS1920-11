<script>
let monedas=[];
let tradevolume=[];
let rankings=[];
async function cargagraph(){
    const resData = await fetch("https://coingecko.p.rapidapi.com/exchanges", {
	    "method": "GET",
	    "headers": {
		"x-rapidapi-host": "coingecko.p.rapidapi.com",
		"x-rapidapi-key": "fbc3a26ce8mshdb989f0848b0219p134cc7jsn7c3ac5c079da"
	    }
    });
   let cryptodata = await resData.json();
   console.log(cryptodata) ;
   cryptodata.forEach(element => {
       monedas.push(element["name"]);
       tradevolume.push(element["trade_volume_24h_btc_normalized"]);
       rankings.push(element["trust_score_rank"]);
   });
   Highcharts.chart('container', {
    title: {
        text: 'Combination chart'
    },
    xAxis: {
        categories: monedas
    },
    labels: {
        items: [{
            html: 'Volumen de intercambios de criptomoneda',
            style: {
                left: '50px',
                top: '18px',
                color: ( // theme
                    Highcharts.defaultOptions.title.style &&
                    Highcharts.defaultOptions.title.style.color
                ) || 'black'
            }
        }]
    },
    series: [{
        type: 'column',
        name: 'Volumen de intercambios de criptomoneda normalizado',
        data: tradevolume
    }, {
        type: 'spline',
        name: 'Ranking de trust factor',
        data: rankings,
        marker: {
            lineWidth: 2,
            lineColor: Highcharts.getOptions().colors[3],
            fillColor: 'white'
        }
    }]
});
}
</script>
<svelte:head>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/series-label.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" on:load="{cargagraph}"></script>
</svelte:head>
<main>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Esta gráfica representa los volumenes de comercio de distintas criptomonedas por su nombre y el
        su puntuación en un ranking de trust factor
    </p>
</figure>
</main>