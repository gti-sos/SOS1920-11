<script>
	import RpcsTable from './rpc/RpcsTable.svelte';
	import EditRpc from './rpc/EditRpc.svelte';
	import Index from './index.svelte';
	import Router from 'svelte-spa-router';
	import efistable from './efi/efitable.svelte';
	import editefi from './efi/editefi.svelte';
	import CrimeTable2 from './crime/CrimeTable2.svelte';
	import EditCrime from './crime/EditCrime.svelte';
	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/:country/:year" : EditRpc,
		"/efis": efistable,
		"/efis/:country/:year": editefi,
		"/crimes": CrimeTable2,
		"/crimes/:country:/year": EditCrime
	}
</script>

<main>
	<Router {routes} />
</main>
