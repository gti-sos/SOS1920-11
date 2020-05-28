<script>

    import {pop} from "svelte-spa-router";
	import Button from "sveltestrap/src/Button.svelte";
</script>

<main>
<h2>
		Integrations:
		</h2> 
		<ul>
			<li><a href="/#/rpcs/integrations/emigration">Emigration</a>
			<li><a href="/#/rpcs/integrations/overdose">Overdose</a>
			<li><a href="/#/rpcs/integrations/countries">Countries</a>
			<li><a href="/#/rpcs/integrations/covid19">COVID-19</a>
			<li><a href="/#/rpcs/integrations/icm">ICM </a>
			<li><a href="/#/rpcs/integrations/comun">Comun </a>
		</ul>

	<a href="/#"><Button outline color="warning">INICIO</Button></a>
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>
</main>