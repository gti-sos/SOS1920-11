<script>
let paises= [];
import {onMount} from 'svelte';

//Chart.js

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
var x1 = cargaLabels();
var x2 = cargaRates();
var myChart = new Chart(ctx,{
    type: 'bar',
    data: {
        labels: x1,
        datasets: [{
            label: 'Crime rate stats',
            data: x2,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 99, 132, 1)'
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

//Highcharts

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
        dadas por el índice de asesinatos y el de robos por país. Los datos de la tabla y del gráfico no son
        todos los recursos de mi aplicación. 
    </p>

    <table id="datatable">
        <thead>
            <tr>
                <th></th>
                <th>Jane</th>
                <th>John</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Crime Rate</th>
                <td>3</td>
                <td>4</td>
            </tr>
            <tr>
                <th>Safe Rate</th>
                <td>2</td>
                <td>0</td>
            </tr>
            <tr>
                <th>Homicide Rate</th>
                <td>5</td>
                <td>11</td>
            </tr>
            <tr>
                <th>Homicide Count</th>
                <td>1</td>
                <td>1</td>
            </tr>
            <tr>
                <th>Theft Rate</th>
                <td>2</td>
                <td>4</td>
            </tr>
            <tr>
                <th>Theft Count</th>
                <td>2</td>
                <td>4</td>
            </tr>
        </tbody>
    </table>
    </figure>
    <h2>Crime rate stats - Highcharts</h2>
    <canvas id="myChart" width="400" height="400"></canvas>
</main>