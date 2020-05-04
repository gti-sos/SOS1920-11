<script>
	import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";
	let rpcs = [];
	let newRpc = {
		country: "",
		year: "",
		rpc: "",
		piba: "",
		pib1t: "",
		pib2t: "",
		pib3t: "",
		pib4t: "",
		vpy: ""
	};
	let queryRpc = {
		country: "",
		year: "",
		rpc: "",
		piba: "",
		pib1t: "",
		pib2t: "",
		pib3t: "",
		pib4t: "",
		vpy: ""
	};

	onMount(getRPCS);

	async function getRPCS(){
		console.log('Fetching rpcs..');
		const res = await fetch("/api/v1/rents-per-capita");

		if (res.ok){
			console.log("OK!");
			const json= await res.json();
			rpcs = json ;
			console.log("Received "+rpcs.length+" rpcs.");

		}else{
			rpcs = [] ;
			console.log("Datasabe empty");
		}
	}

	async function insertRPC(){
		console.log('Inserting rpc... '+ JSON.stringify(newRpc));
		const res = await fetch("/api/v1/rents-per-capita",{
			method: "POST",
			body: JSON.stringify(newRpc),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(function(res){
			getRPCS();
		});	
	}

	async function deleteRPC(country,year){
		console.log('Deleting rpc... ');
		const res = await fetch("/api/v1/rents-per-capita/"+country +"/"+year,{
			method: "DELETE"
		}).then(function(res){
			getRPCS();
		});	
	}

	async function deleteteRPCS(){
		console.log('Deleting rpcs..');
		const res = await fetch("/api/v1/rents-per-capita",{
			method: "DELETE"
		}).then(function(res){
			getRPCS();
		});
	}

	async function searchRPCS(){
		console.log('Searching..');
		var query = "?";
		if(queryRpc.country!=null){
			if (query =="?") {
				query = query + "country="+queryRpc.country;
			}else{
				query = query + "&country="+queryRpc.country;
			}
		}
		const res = await fetch("/api/v1/rents-per-capita"+query);
		if (res.ok){
			console.log("OK!");
			const json= await res.json();
			rpcs = json ;
			console.log("Received "+rpcs.length+" rpcs.");

		}else{
			rpcs = [] ;
			console.log("Not found");
		}
	}

</script>

<main>
	<h2>RPCS TABLE</h2>
	{#await rpcs} ;
	{:then rpcs}
	<Table bordered style="width:auto;">
		<thead>
			<tr>
				<td>Country</td>
				<td>Year</td>
				<td>RPC</td>
				<td>PIB A</td>
				<td>PIB 1T</td>
				<td>PIB 2T</td>
				<td>PIB 3T</td>
				<td>PIB 4T</td>
				<td>VPY</td>
				<td>ACTIONS</td>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><input bind:value="{newRpc.country}" /></td>
				<td><input bind:value="{newRpc.year}" /></td>
				<td><input bind:value={newRpc.rpc} /></td>
				<td><input bind:value={newRpc.piba} /></td>
				<td><input bind:value={newRpc.pib1t} /></td>
				<td><input bind:value={newRpc.pib2t} /></td>
				<td><input bind:value={newRpc.pib3t} /></td>
				<td><input bind:value={newRpc.pib4t} /></td>
				<td><input bind:value={newRpc.vpy} /></td>
				<td><Button on:click={insertRPC} outline color="primary">INSERT</Button></td>
			</tr>
			{#each rpcs as rpc}
			<tr>
				<td><a href="/#/rpcs/{rpc.country}/{rpc.year}">{rpc.country}</a></td>
				<td>{rpc.year}</td>
				<td>{rpc.rpc}</td>
				<td>{rpc.piba}</td>
				<td>{rpc.pib1t}</td>
				<td>{rpc.pib2t}</td>
				<td>{rpc.pib3t}</td>
				<td>{rpc.pib4t}</td>
				<td>{rpc.vpy}</td>
				<td><Button on:click={deleteRPC(rpc.country,rpc.year)} outline color="danger">DELETE</Button></td>
			</tr>
			{/each}
		</tbody>
		<Button outline color="danger" on:click={deleteteRPCS}>BORRAR TODO</Button>
	</Table>
	{/await}

	<Table bordered style="width:auto;">
		<thead>
			<tr>
				<td>Country</td>
				<td>Year</td>
				<td>RPC</td>
				<td>PIB A</td>
				<td>PIB 1T</td>
				<td>PIB 2T</td>
				<td>PIB 3T</td>
				<td>PIB 4T</td>
				<td>VPY</td>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><input bind:value="{queryRpc.country}" /></td>
				<td><input bind:value="{queryRpc.year}" /></td>
				<td><input bind:value={queryRpc.rpc} /></td>
				<td><input bind:value={queryRpc.piba} /></td>
				<td><input bind:value={queryRpc.pib1t} /></td>
				<td><input bind:value={queryRpc.pib2t} /></td>
				<td><input bind:value={queryRpc.pib3t} /></td>
				<td><input bind:value={queryRpc.pib4t} /></td>
				<td><input bind:value={queryRpc.vpy} /></td>
			</tr>
		</tbody>
		<Button outline color="secondary" on:click={searchRPCS}>BUSCAR</Button>
	</Table>
</main>
