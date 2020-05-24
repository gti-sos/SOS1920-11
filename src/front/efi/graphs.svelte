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
        for (let a = 0; a < countries.length; a++) {
            let array_busqueda=[countries[a],years[k]];
            console.log(array_busqueda in mapa.keys);
            if (array_busqueda in mapa){
                efis.push(mapa.get(array_busqueda));
            }
            else{
                efis.push(0.0);
            }
        }
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