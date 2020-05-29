<script>
    import {pop} from "svelte-spa-router";
	import Button from "sveltestrap/src/Button.svelte";
async function loadGraph(){
    let MyX = [];
    let MyY = [];
    let Data= [];
const resData = await fetch("/api/v3/indice_de_masa_corporal");
Data = await resData.json();
Data.filter(data => data.year == 2020).forEach((data) => {
        let x = data.place;
    
            MyX.push(x);
        let y = data.indice_de_masa_corporal;
            MyY.push(y);
        });     

var MyData = [
  {
    x: MyX,
    y: MyY,
    type: 'bar'
  }
];

Plotly.newPlot('myDiv', MyData);

}
</script>

<svelte:head>
<script src="https://cdn.plot.ly/plotly-latest.min.js" on:load={loadGraph}></script>
</svelte:head>

<main>
    <a href="/#"><Button outline color="warning">INICIO</Button></a>
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>
<h2>ÍNDICES DE MASA CORPORAL (2020)</h2>

<div id='myDiv'>

</div>
</main>