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
	import RpcsIntegrations from './rpc/RpcsIntegrations.svelte';
	import EmigrationChart from './rpc/EmigrationChart.svelte';
	import CountriesChart from './rpc/CountriesChart.svelte';	
	import OverdoseChart from './rpc/OverdoseChart.svelte';
	import CovidChart from './rpc/CovidChart.svelte';
	import IcmChart from './rpc/IcmChart.svelte';
	import CommonChart from './rpc/CommonChart.svelte';
	import giniChart from './efi/gini_index.svelte';
	import crypto from './efi/bitcoinexchange.svelte';
	import beerimports from './efi/beerimports.svelte';
	import contamination from './efi/gce.svelte';
	import efiintegrations from './efi/Integrations.svelte';
	import swimrecords from './efi/swimrecords.svelte';
	import trafficAccidents from './crime/trafficAccidents.svelte';
	import natalityStats from './crime/natalityStats.svelte';
	import sugarConsume from './crime/sugarConsume.svelte';
	import drugOffences from './crime/drugOffences.svelte';
	import bookExports from './crime/bookExports.svelte';
	import Integrations2 from './crime/Integrations2.svelte';
	import Integrations from './Integrations.svelte';
	import about from './about.svelte';

	const routes ={
		//rpcs
		"/" : Index,
		"/rpcs" : RpcsTable,
		"/rpcs/graph" : RpcsGraph,
		"/rpcs/integrations" : RpcsIntegrations,
		"/rpcs/integrations/emigration" : EmigrationChart,
		"/rpcs/integrations/countries" : CountriesChart,
		"/rpcs/integrations/overdose" : OverdoseChart,
		"/rpcs/integrations/covid19" : CovidChart,
		"/analytics" : CommonChart,
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
		"/crimes/integrations": Integrations2,
		"/crimes/integrations/traffic_accidents": trafficAccidents,
		"/crimes/integrations/natality_stats": natalityStats,
		"/crimes/integrations/sugarconsume": sugarConsume,
		"/crimes/integrations/book_exports": bookExports,
		"/crimes/integrations/drug_offences": drugOffences,
		"/crimes/:country:/year": EditCrime,
		//integrations
		"/integrations" : Integrations,
		"/about": about
		
	}
</script>

<main>
	<Router {routes} />
</main>
