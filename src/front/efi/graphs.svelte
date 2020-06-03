<script>
import Button from "sveltestrap/src/Button.svelte";
let yearofplotting=2020;
function dataParser(arrayofData){
    years=[];
    let sol =[];
    let objetosauxiliares=[]
    let setofyears = new Set();
    
    arrayofData.forEach(element => {
        let objeto_a ={};
        //creamos el objeto del que extraer los datos
        objeto_a.country=element.country;
        objeto_a.index=element.efiindex;
        objeto_a.year=element.year;
        //le añadimos indice, año y pais, lo relevante de la representación
        objetosauxiliares.push(objeto_a);
        //lo introducimos en la lista iterable
        setofyears.add(element.year);
        countries.push(element.country);
    });
    
    years = Array.from(setofyears);
    let totalyears=years;

    let object={};
    let efis_1 =[];
    let efis_2=[];
    objetosauxiliares.forEach(element => {
        if(element.year==yearofplotting){
            efis_1.push(element.index)
        }else{
            efis_1.push(0.0);
        }
    });
    object.name="Año "+yearofplotting;
    object.data=efis_1;        
    sol.push(object);
    return sol;
};
let countries = [];
let years= [];

let treatedData = [];
let indices_year=[];

async function cargaGraph(){
    
    const resData = await fetch ("/api/v2/economic-freedom-indexes?year="+yearofplotting);
    
    let myData = await resData.json();
    let data_ploty = [];
    treatedData = dataParser(myData);
    
    //highcharts
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

};
async function cargatodo(){

    //ploty
    const resData = await fetch ("/api/v2/economic-freedom-indexes");
    let myData = await resData.json();
    let yearset= new Set();
    
    myData.forEach(element => {
        yearset.add(element.year);
        
    });
    
    let data_ploty=[];
    for (let year of yearset){
        let indexes =[];
        let paises= [];
        myData.forEach(element => {
            paises.push(element.country);
            if (element.year==year) {
                indexes.push(element.efiindex.toString());
            }
            else{
                indexes.push("0.0");
            }
        });
        
        
       
        data_ploty.push({
            histfunc: "sum",
            y: indexes,
            x: paises,
            type: "histogram",
            name: "Año " + year
        });
    }
    Plotly.newPlot('myDiv', data_ploty);
};
</script>
<svelte:head>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js" ></script>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargatodo}"></script>
</svelte:head>
<main>
<h1>ÍNDICES DE LIBERTAD ECONÓMICA</h1>
<h2>(Economic Freedom Indexes)</h2>
<input bind:value="{yearofplotting}"><Button outline  color="primary" on:click={cargaGraph}>Buscar</Button>
<figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        Aquí veremos un desglose de distintos indices de libertad económica,
        un índice creado por la Heritage Fundation para medir la libertad económica
        de un país.
    </p>
    
</figure>
<div>
Representación de todo el conjunto de datos con otra librería, plotly:
<br>
<div id="myDiv">

</div>
</div>
</main>