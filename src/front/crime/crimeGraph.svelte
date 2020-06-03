<script>
let paises= [];
import {onMount} from 'svelte';

async function cargaLabels(){

    const resData = await fetch("/api/v2/crime-rate-stats");
    datos = await resData.json;
    for (x in datos){
        paises.push(x.country);
    } 
    return paises;
};

async function cargaRates(){
    const resData = await fetch("/api/v2/crime-rate-stats");
    datos = await resData.json;
    for (x in datos){
        paises.push(x.cr_rate);
    } 
    return paises;
};  

var Chart = require('chart.js');
var ctx = document.getElementById('myChart');
x1 = cargaLabels;
x2 = cargaRates;
var myChart = new Chart(ctx,{
    type: 'bar',
    data: {
        labels: x1,
        datasets: [{
            label: 'Crime rate stats',
            data: x2,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: false
                }
            }]
        }
    }
});

    Highcharts.chart('container', {
    data: {
        table: 'datatable'
    },
    chart: {
        type: 'column'
    },
    title: {
        text: 'Data extracted from a HTML table in the page'
    },
    yAxis: {
        allowDecimals: true,
        title: {
            text: 'Units'
        }
    },
    tooltip: {
        formatter: function () {
            return '<b>' + this.series.name + '</b><br/>' +
                this.point.y + ' ' + this.point.name.toLowerCase();
        }
    }
});
</script>
<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js" ></script>
</svelte:head>
<main>
    <h2>Crime rate stats - Highcharts</h2>
    <figure class="highcharts-figure">
    <div id="container"></div>
    <p class="highcharts-description">
        En este gráfico podemos apreciar la tasa de criminalidad y de seguridad de varios países
        dadas por el índice de asesinatos y el de robos por país.
    </p>
    <h2>Crime rate stats - Highcharts</h2>
    <canvas id="myChart" width="400" height="400"></canvas>
</main>