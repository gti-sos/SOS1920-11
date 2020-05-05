<script>
	import RpcsTable from './rpc/RpcsTable.svelte';
	import EditRpc from './rpc/EditRpc.svelte';
	import Index from './index.svelte';
//	export let name;
	import Router from 'svelte-spa-router';

	import efistable from '/efi/EfisTable.svelte';
	import editEfi from 'efi/EditEfi.svelte';

	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/:country/:year" : EditRpc,
		"/efis": efistable,
		"/efis/:country/:year": editEfi
	}
</script>

<main>
	<Router {routes} />
</main>
