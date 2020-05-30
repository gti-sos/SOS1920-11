<script>

    import {pop} from "svelte-spa-router";
	import Button from "sveltestrap/src/Button.svelte";
</script>

<main>
<h2>
		Integrations:
		</h2> 
		<ul>
			<li><a href="/#/efis/integrations/gini_index">Índice GINI</a>
			<li><a href="/#/efis/integrations/cryptocurrency">Criptomonedas</a>
			<li><a href="/#/efis/integrations/beerimports">Importación de alcohol</a>
			<li><a href="/#/efis/integrations/contamination">Contaminación por producción de vehiculos</a>
			<li><a href="/#/efis/integrations/icm">ICM </a>
			
		</ul>

	<a href="/#"><Button outline color="warning">INICIO</Button></a>
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>
</main>