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
			console.log("ERROR!!!");
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
			method: "DELETE",
		}).then(function(res){
			getRPCS();
		});	
	}

</script>

<main>
	<h1>RPCS TABLE</h1>
	{#await rpcs} 
	{:then rpcs}
	<Table bordered>
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
		
	</Table>
	{/await}
</main>
