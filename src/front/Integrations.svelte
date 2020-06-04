<script>

    import {pop} from "svelte-spa-router";
	import Button from "sveltestrap/src/Button.svelte";
</script>

<main>
<h2>
		Integrations:
		</h2> 
		<ul>
        <h3>RPCS INTEGRATIONS</h3>
			<li><a href="/#/rpcs/integrations/emigration">Emigration</a>
			<li><a href="/#/rpcs/integrations/overdose">Overdose</a>
			<li><a href="/#/rpcs/integrations/countries">Countries</a>
			<li><a href="/#/rpcs/integrations/covid19">COVID-19</a>
			<li><a href="/#/rpcs/integrations/icm">ICM </a>
		</ul>
        <ul>
        <h3>EFIS INTEGRATIONS</h3>
			<li><a href="/#/efis/integrations/gini_index">Índice GINI</a>
			<li><a href="/#/efis/integrations/cryptocurrency">Criptomonedas</a>
			<li><a href="/#/efis/integrations/beerimports">Importación de alcohol</a>
			<li><a href="/#/efis/integrations/contamination">Contaminación por producción de vehiculos</a>
			<li><a href="/#/efis/integrations/swimrecords">Records de natacion</a>
		</ul>
        <ul>
        <h3>CRIMES INTEGRATIONS</h3>
			<li><a href="/#/crimes/integrations/book_exports">Exportaciones de libros</a>
			<li><a href="/#/crimes/integrations/sugarConsume">Consumo de azúcar</a>
			<li><a href="/#/crimes/integrations/drugOffences">Crímenes de drogas</a>
			<li><a href="/#/crimes/integrations/natality_stats">Natalidad</a>
			<li><a href="/#/crimes/integrations/traffic_accidents">Accidentes de tráfico</a>
			<li><a href="/#/crimes/integrations/population">Población total por país</a>
			<li><a href="/#/crimes/integrations/countryCodes">Código de cada país</a>
		</ul>

	<a href="/#"><Button outline color="warning">INICIO</Button></a>
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>
</main>