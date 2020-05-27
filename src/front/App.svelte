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
	import CountriesChart from './rpc/CountriesChart.svelte';	
	import OverdoseChart from './rpc/OverdoseChart.svelte';
	import CovidChart from './rpc/CovidChart.svelte';
	import IcmChart from './rpc/IcmChart.svelte';

	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/graph" : RpcsGraph,
		"/rpcs/integrations" : Integrations,
		"/rpcs/integrations/emigration" : EmigrationChart,
		"/rpcs/integrations/countries" : CountriesChart,
		"/rpcs/integrations/overdose" : OverdoseChart,
		"/rpcs/integrations/covid19" : CovidChart,
		"/rpcs/integrations/icm" : IcmChart,
		"/rpcs/:country/:year" : EditRpc,
		"/efis": efistable,
		"/efis/:country/:year": editefi,
		"/crimes": CrimeTable,
		"/crimes/:country:/year": EditCrime,
		"/efis/graph":efiGraph
	}
</script>

<main>
	<Router {routes} />
</main>
