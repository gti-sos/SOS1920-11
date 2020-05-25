<script>

function dataParser(arrayofData){
    
    let sol =[];
    let setofcountries = new Set();
    let setofyears = new Set();
    let mapa = new Map();
    //obtenemos el numero de paises
    arrayofData.forEach(element => {
        setofcountries.add(element.country);
        setofyears.add(element.year);
        let aux_arr=[element.country,element.year];
        mapa.set(aux_arr,element.efiindex);
    });
    countries = Array.from(setofcountries);
    years = Array.from(setofyears);
    console.log(mapa);
    for(let k = 0;k<years.length;k++){
        let object={};
        let efis=[];
        arrayofData.forEach(element => {
            if(element.year==years[k]){
                efis.push(element.efiindex);
            }else{
                efis.push(0.0);
            }
        });
        object.data= efis;
        sol.push(object);
    }
    return sol;
};
let countries = [];
let years= [];
let myData= [];
let treatedData = [];
let tipo = typeof treatedData;
let indices_year=[];
async function cargaGraph(){
    
    const resData = await fetch ("/api/v2/economic-freedom-indexes");
    
    myData = await resData.json();
    treatedData = dataParser(myData);
    Highcharts.chart('container', {
    chart: {
        type: 'bar'
    },
    title: {
        text: 'Índices de libertad económica'
    },
    subtitle: {
        text: 'Source: <a href="https://www.heritage.org/index/">Heritage Foundation</a>'
    },
    xAxis: {
        categories: countries,
        title: {
            text: null
        }
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Índice de libertad económica',
            align: 'high'
        },
        labels: {
            overflow: 'justify'
        }
    },
    
    plotOptions: {
        bar: {
            dataLabels: {
                enabled: true
            }
        }
    },
    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor:
            Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
        shadow: true
    },
    credits: {
        enabled: false
    },
    series: treatedData
});


}
</script>
<svelte:head>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" on:load="{cargaGraph}"></script>
<style>
.highcharts-figure, .highcharts-data-table table {
    min-width: 310px; 
    max-width: 800px;
    margin: 1em auto;
}

#container {
    height: 400px;
}

.highcharts-data-table table {
	font-family: Verdana, sans-serif;
	border-collapse: collapse;
	border: 1px solid #EBEBEB;
	margin: 10px auto;
	text-align: center;
	width: 100%;
	max-width: 500px;
}
.highcharts-data-table caption {
    padding: 1em 0;
    font-size: 1.2em;
    color: #555;
}
.highcharts-data-table th {
	font-weight: 600;
    padding: 0.5em;
}
.highcharts-data-table td, .highcharts-data-table th, .highcharts-data-table caption {
    padding: 0.5em;
}
.highcharts-data-table thead tr, .highcharts-data-table tr:nth-child(even) {
    background: #f8f8f8;
}
.highcharts-data-table tr:hover {
    background: #f1f7ff;
}
</style>
</svelte:head>
<main>
<h1>ÍNDICES DE LIBERTAD ECONÓMICA</h1>
<h2>(Economic Freedom Indexes)</h2>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Aquí veremos un desglose de distintos indices de libertad económica,
        un índice creado por la Heritage Fundation para medir la libertad económica
        de un país.
    </p>
    
</figure>
</main>