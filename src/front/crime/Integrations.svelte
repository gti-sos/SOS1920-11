<script>

    import {pop} from "svelte-spa-router";
	import Button from "sveltestrap/src/Button.svelte";
</script>

<main>
<h2>
		Integrations:
		</h2> 
		<ul>
		
			
		</ul>

	<a href="/#"><Button outline color="warning">INICIO</Button></a>
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>
</main>