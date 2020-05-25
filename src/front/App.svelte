<script>
	import RpcsTable from './rpc/RpcsTable.svelte';
	import EditRpc from './rpc/EditRpc.svelte';
	import RpcsGraph from './rpc/RpcsGraph.svelte';
	import Index from './index.svelte';
	import Router from 'svelte-spa-router';
	import efistable from './efi/efitable.svelte';
	import editefi from './efi/editefi.svelte';
	import CrimeTable from './crime/CrimeTable.svelte';
	import EditCrime from './crime/EditCrime.svelte';
<<<<<<< HEAD
	import efiGraph from './efi/graphs.svelte';
=======
	
>>>>>>> 506d1045b78580a8516c6265e6e2478be7651e3b
	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/graph" : RpcsGraph,
		"/rpcs/:country/:year" : EditRpc,
		"/efis": efistable,
		"/efis/:country/:year": editefi,
		"/crimes": CrimeTable,
		"/crimes/:country:/year": EditCrime,
		"/analytics":efiGraph
	}
</script>

<main>
	<Router {routes} />
</main>
