<script>
 async function cargadatos() {
    const resData = await fetch("/api/v2/sugarconsume");
    console.log(resData.status);
    let data = await resData.json();   
    
    let data_ploty=[];
    let countrys=[];
    let consumes=[];
    data.forEach(element => {
        countrys.push(element["place"]);
        consumes.push(element["sugarconsume"]);
    });
    console.log(countrys,consumes);
    var data1 = [
  {
    x: countrys,
    y: consumes,
    type: 'bar'
  }
];
    Plotly.newPlot('myDiv', data1);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:load="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Consumo de azucar</h1>
<div>
En esta gráfica se representa el consumo de azucar por país 
<br>
<div id="myDiv"></div>
</div>
</main>