<script>

function dataParser(arrayofData){
    
    let sol =[];
    let setofcountries = new Set();
    let setofyears = new Set();
    //obtenemos el numero de paises
    arrayofData.forEach(element => {
        setofcountries.add(element.country);
        setofyears.add(element.year);
    });
    countries = Array.from(setofcountries);
    years = Array.from(setofyears);
    for(let k = 0;k<years.length;k++){
        let object={};
        object.name="Año "+years[k];
        
        indices_year=arrayofData.filter((element)=>{
            return element.year==years[k];
        });
        indices_year=indices_year.map((e)=>{
            return e.efiindex;
        })
        let diff =countries.length-indices_year.length;
        if (diff>0){
            for (let index = 0; index < diff; index++) {
                indices_year.push(0.0);
            }
        }
        object.data= indices_year;
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