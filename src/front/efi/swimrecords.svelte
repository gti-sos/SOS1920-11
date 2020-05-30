<script>
async function cargadatos(){
    const resData = await fetch("/api/v1/swim-stats");
    let data = await resData.json();
    console.log(data);
    let years=[];
    let records=[];
    let mapa = new Map();
    data.forEach(element => {
        if (mapa.has(element.year)){
            if (mapa.get(element.year)>=element.time){
                mapa.set(element.year,element.time);
            }
        }else{
            mapa.set(element.year,element.time);
        }
        
    });
    //sorting data by year
    console.log(mapa);
    var mapa2 = new Map([...mapa.entries()].sort());
    console.log(mapa2);
    Highcharts.chart('container', {

    title: {
        text: 'Records mundiales en natación'
    },
    xAxis: {
        categories: Array.from(mapa2.keys())
    },
    yAxis: {
        title: {
            text: 'Tiempo'
        }
    },
    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle'
    },

    series: [{
        name: 'tiempo',
        data: Array.from(mapa2.values())
    }],

    responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    }

});
}
</script>
<svelte:head><script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/series-label.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" on:load="{cargadatos}"></script></svelte:head>
<main>
<h1>Records de natación a lo largo del tiempo</h1>


<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Gráfico que muestra la evolución de los records olímpicos de natación a lo largo del tiempo.
    </p>
</figure>
</main>