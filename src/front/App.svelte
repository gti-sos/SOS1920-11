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
	import ComunChart from './rpc/ComunChart.svelte';
	import giniChart from './efi/gini_index.svelte';
	import crypto from './efi/bitcoinexchange.svelte';
	import beerimports from './efi/beerimports.svelte';
	import contamination from './efi/gce.svelte';
	import efiintegrations from './efi/Integrations.svelte';
	import swimrecords from './efi/swimrecords.svelte';

	const routes ={
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/graph" : RpcsGraph,
		"/rpcs/integrations" : Integrations,
		"/rpcs/integrations/emigration" : EmigrationChart,
		"/rpcs/integrations/countries" : CountriesChart,
		"/rpcs/integrations/overdose" : OverdoseChart,
		"/rpcs/integrations/covid19" : CovidChart,
		"/analytics" : ComunChart,
		"/rpcs/integrations/icm" : IcmChart,
		"/rpcs/:country/:year" : EditRpc,
		//efis
		"/efis": efistable,
		"/efis/integrations": efiintegrations,
		"/efis/integrations/gini_index": giniChart,
		"/efis/integrations/cryptocurrency": crypto,
		"/efis/integrations/beerimports": beerimports,
		"/efis/integrations/contamination": contamination,
		"/efis/integrations/swimrecords": swimrecords,
		"/efis/graph":efiGraph,
		"/efis/:country/:year": editefi,
		//crimes
		"/crimes": CrimeTable,
		"/crimes/:country:/year": EditCrime,
		
		
	}
</script>

<main>
	<Router {routes} />
</main>
