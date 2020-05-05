<script>
	import RpcsTable from './rpc/RpcsTable.svelte';
	import EditRpc from './rpc/EditRpc.svelte';
	import Index from './index.svelte';
	export let msg;
	import Router from 'svelte-spa-router';

	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/:country/:year" : EditRpc,
		
	}
</script>

<main>
	<Router {routes} />
</main>
