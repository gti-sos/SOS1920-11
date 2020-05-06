<script>
	import RpcsTable from './rpc/RpcsTable.svelte';
	import EditRpc from './rpc/EditRpc.svelte';
	import Index from './index.svelte';
	import Router from 'svelte-spa-router';
<<<<<<< HEAD
	export let userMsg;
=======

	import efistable from './efi/efitable.svelte';
	import editefi from './efi/editefi.svelte';
>>>>>>> efcf2446581d72feeb966b2a220f36898a60cc86
	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/:country/:year" : EditRpc,
		"/efis": efistable,
		"/efis/:country/:year": editefi
		
	}
</script>

<main>
	<Router {routes} />
</main>
