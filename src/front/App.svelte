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
	import efiGraph from './efi/graphs.svelte';
	import Integrations from './rpc/Integrations.svelte';
	import EmigrationChart from './rpc/EmigrationChart.svelte';
	
	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/graph" : RpcsGraph,
		"/rpcs/integrations" : Integrations,
		"/rpcs/integrations/emigration" : EmigrationChart,
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
