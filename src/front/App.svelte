<script>
	import RpcsTable from './rpc/RpcsTable.svelte';
	import EditRpc from './rpc/EditRpc.svelte';
	import Index from './index.svelte';
	import Router from 'svelte-spa-router';

	import efistable from './efi/efitable.svelte';
	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/:country/:year" : EditRpc,
		"/efis": efistable
		
	}
</script>

<main>
	<Router {routes} />
</main>
