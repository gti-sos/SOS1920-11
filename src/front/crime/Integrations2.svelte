<script>

    import {pop} from "svelte-spa-router";
	import Button from "sveltestrap/src/Button.svelte";
</script>

<main>
<h2>
		Integrations:
		</h2> 
		<ul>
			<li><a href="/#/crimes/integrations/bookExports">Exportaciones de libros</a>
			<li><a href="/#/crimes/integrations/sugarConsume">Consumo de azúcar</a>
			<li><a href="/#/crimes/integrations/drugOffences">Crímenes de drogas</a>
			<li><a href="/#/crimes/integrations/natalityStats">Natalidad</a>
			<li><a href="/#/crimes/integrations/traffic_accidents">Accidentes de tráfico</a>
			<li><a href="/#/crimes/integrations/population">Población por país</a>
			<li><a href="/#/crimes/integrations/countryCodes">Código de cada país</a>
		</ul>

	<a href="/#"><Button outline color="warning">INICIO</Button></a>
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>
</main>