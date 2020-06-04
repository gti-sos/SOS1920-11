<script>
let paises= [];
import {onMount} from 'svelte';
import Button from "sveltestrap/src/Button.svelte";

//Chart.js
async function cargadatos (){
    const resData = await fetch("/api/v2/crime-rate-stats");
    let data = await resData.json();
    let data_ploty=[];
    let countries=[];
    let crimerates=[];
    let saferates=[];
    let theftrates=[];
    let theftcounts = [];
    let homirates=[];
    let homicounts = [];
    data.forEach(element => {
        countries.push(element.country);
        crimerates.push(element["cr_rate"]);
        saferates.push(element["cr_saferate"]);
        theftrates.push(element["cr_theftrate"]);
        theftcounts.push(element["cr_theftcount"]);
        homirates.push(element["cr_homicrate"]);
        homicounts.push(element["cr_homicount"]);
    });
    data_ploty.push({
        histfunc: "sum",
        y: crimerates,
        x: countries,
        type: "histogram",
        name: "Criminalidad"
    });
    data_ploty.push({
        histfunc: "sum",
        y: saferates,
        x: countries,
        type: "histogram",
        name: "Tasa de seguridad"
    });
    data_ploty.push({
        histfunc: "sum",
        y: theftrates,
        x: countries,
        type: "histogram",
        name: "Tasa de robo"
    });
    data_ploty.push({
        histfunc: "sum",
        y: theftcounts,
        x: countries,
        type: "histogram",
        name: "Conteo de robos"
    });
    data_ploty.push({
        histfunc: "sum",
        y: homirates,
        x: countries,
        type: "histogram",
        name: "Tasa de homicidios"
    });
    data_ploty.push({
        histfunc: "sum",
        y: homicounts,
        x: countries,
        type: "histogram",
        name: "Conteo de homicidios"
    });
    Plotly.newPlot('myDiv', data_ploty);
};

//Highcharts
async function cargaHigh() {

    const resData = await fetch("/api/v2/crime-rate-stats");

    Highcharts.chart('container', {
    data: {
        table: 'datatable'
    },
    chart: {
        type: 'column'
    },
    title: {
        text: 'Crime Rate stats'
    },
    yAxis: {
        allowDecimals: true,
        title: {
            text: 'Crime rates'
        }
    },
    tooltip: {
        formatter: function () {
            return '<b>' + this.series.name + '</b><br/>' +
                this.point.y + ' ' + this.point.name.toLowerCase();
        }
    }
});
};

</script>
<svelte:head>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
    <script src="https://code.highcharts.com/modules/export-data.js"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js" ></script>
    <script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
    <script src="https://code.highcharts.com/modules/accessibility.js" on:load="{cargaHigh}"></script>
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
                <th>Venezuela</th>
                <th>España</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Crime Rate</th>
                <td>84.49</td>
                <td>31.77</td>
            </tr>
            <tr>
                <th>Safe Rate</th>
                <td>15.51</td>
                <td>68.23</td>
            </tr>
            <tr>
                <th>Homicide Rate</th>
                <td>56.3</td>
                <td>0.6</td>
            </tr>
            <tr>
                <th>Homicide Count</th>
                <td>17778</td>
                <td>276</td>
            </tr>
            <tr>
                <th>Theft Rate</th>
                <td>39.39</td>
                <td>42.21</td>
            </tr>
            <tr>
                <th>Theft Count</th>
                <td>213769</td>
                <td>195910</td>
            </tr>
        </tbody>
    </table>
    </figure>
    <h2>Crime rate stats - Chart.js</h2>
    <div id="myDiv">

    </div>

</main>