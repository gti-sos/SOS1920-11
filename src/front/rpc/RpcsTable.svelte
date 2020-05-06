<script>
	import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";

	let rpcs = [];
	let newRpc = {
		country: "",
		year: 0,
		rpc: 0,
		piba: 0,
		pib1t: 0,
		pib2t: 0,
		pib3t: 0,
		pib4t: 0,
		vpy: 0
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

	let offset = 0;
	let limit = 2;
	let numTotal;
	let numFiltered;
	let userMsg = "";
	
	onMount(getRPCS);

	async function loadInitialData(){
		console.log('Loading initial rpcs..');
		const res = await fetch("/api/v1/rents-per-capita/loadInitialData");

		userMsg = "DATOS INICIALES CARGADOS.";
		if (res.ok){
			console.log("DATOS INICIALES CARGADOS!");
			getRPCS();
		}else{
			rpcs = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos."
			}
			console.log("Datasabe empty");
		}
	}

	async function getRPCS(){
		console.log('Fetching rpcs..');
		const res = await fetch("/api/v1/rents-per-capita");

		if (res.ok){
			console.log("OK!");
			const json= await res.json();
			rpcs = json ;
			console.log("Received "+rpcs.length+" rpcs.");
			numTotal = rpcs.length;
		}else{
			rpcs = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			}
			console.log("Datasabe empty");
		}
	}

	async function insertRPC(){
		
		if(newRpc.country!="" && !isNaN(parseInt(newRpc.year))){
			rpcs.forEach(x => {
			if(x.country ==newRpc.country && x.year == newRpc.year){
				userMsg="El dato de ese año y país ya existe.";
			}
			});
		
			if(userMsg!="El dato de ese año y país ya existe."){
				console.log('Inserting rpc... '+ JSON.stringify(newRpc));
			const res = await fetch("/api/v1/rents-per-capita",{
				method: "POST",
				body: JSON.stringify(newRpc),
				headers: { 
					"Content-Type": "application/json"
				}
			}).then(function(res){
				getRPCS();
				userMsg = "El dato fue insertado correctamente.";

			});
			}
		
		
		}else{
			userMsg = "El dato insertado no tiene nombre/año válido/s .";
			console.log('Inserted rpc has no valid name or valid year.');
		}
	}

	async function deleteRPC(country,year){
		console.log('Deleting rpc... ');
		const res = await fetch("/api/v1/rents-per-capita/"+country +"/"+year,{
			method: "DELETE"
		}).then(function(res){
			getRPCS();
			userMsg = "El dato ha sido borrado.";
		});	
	}

	async function deleteteRPCS(){
		console.log('Deleting rpcs..');
		const res = await fetch("/api/v1/rents-per-capita",{
			method: "DELETE"
		}).then(function(res){
			userMsg = "Todos los datos han sido borrados.";
			getRPCS();
		});
	}

	async function searchRPCS(){
		console.log('Searching..');
		var query = "?";
		if(queryRpc.country!=""){
			if (query =="?") {
				query = query + "country="+queryRpc.country;
			}else{
				query = query + "&country="+queryRpc.country;
			}
		}
		if(queryRpc.year!=""){
			if (query =="?") {
				query = query + "year="+queryRpc.year;
			}else{
				query = query + "&year="+queryRpc.year;
			}
		}
		if(queryRpc.rpc!=""){
			if (query =="?") {
				query = query + "rpc="+queryRpc.rpc;
			}else{
				query = query + "&rpc="+queryRpc.rpc;
			}
		}
		if(queryRpc.piba!=""){
			if (query =="?") {
				query = query + "piba="+queryRpc.piba;
			}else{
				query = query + "&piba="+queryRpc.piba;
			}
		}
		if(queryRpc.pib1t!=""){
			if (query =="?") {
				query = query + "pib1y="+queryRpc.pib1t;
			}else{
				query = query + "&pib1t="+queryRpc.pib1t;
			}
		}
		if(queryRpc.pib2t!=""){
			if (query =="?") {
				query = query + "pib2t="+queryRpc.pib2t;
			}else{
				query = query + "&pib2t="+queryRpc.pib2t;
			}
		}
		if(queryRpc.pib3t!=""){
			if (query =="?") {
				query = query + "pib3t="+queryRpc.pib3t;
			}else{
				query = query + "&pib3t="+queryRpc.pib3t;
			}
		}
		if(queryRpc.pib4t!=""){
			if (query =="?") {
				query = query + "pib4t="+queryRpc.pib4t;
			}else{
				query = query + "&pib4t="+queryRpc.pib4t;
			}
		}
		if(queryRpc.vpy!=""){
			if (query =="?") {
				query = query + "vpy="+queryRpc.vpy;
			}else{
				query = query + "&vpy="+queryRpc.vpy;
			}
		}
		query = query + "&limit="+limit+"&offset="+ offset;

		const res = await fetch("/api/v1/rents-per-capita"+query);
		console.log("Sending this.." + JSON.stringify(queryRpc));
		if (res.ok){
			console.log("OK!");
			const json= await res.json();
			rpcs = json ;
			console.log("Received "+rpcs.length+" rpcs, offset = "+offset+".");
			numFiltered = rpcs.length;
			userMsg = "Mostrando "+numFiltered+" de "+numTotal+" datos."
			
		}else{
			rpcs = [] ;
			userMsg = "No se han encontrado datos."
			console.log("Not found");
		}
	}
	
	async function beforeOffset(){
		if (offset >=2) offset = offset - limit;
		searchRPCS();
	
	}

	async function nextOffset(){
		if((offset + limit)<numTotal) offset = offset + limit;
		searchRPCS();
	
	}

</script>

<main>
	<h2>RPCS GUI</h2> <Button outline color="danger" on:click={loadInitialData}>CARGAR DATOS INCIALES</Button>
	{#if userMsg}
	<h3><p style= "color:orange">{userMsg}</p></h3>
	{/if}
	{#await rpcs}
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
				<td><input style="width: 100px;" bind:value="{newRpc.country}" /></td>
				<td><input style="width: 50px;" bind:value="{newRpc.year}" /></td>
				<td><input style="width: 100px;" bind:value={newRpc.rpc} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.piba} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.pib1t} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.pib2t} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.pib3t} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.pib4t} /></td>
				<td><input style="width: 50px;" bind:value={newRpc.vpy} /></td>
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

	<Table bordered style="width: auto;">
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
				<td><input style="width: 100px;" bind:value="{queryRpc.country}" /></td>
				<td><input style="width: 50px;" bind:value="{queryRpc.year}" /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.rpc} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.piba} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.pib1t} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.pib2t} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.pib3t} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.pib4t} /></td>
				<td><input style="width: 50px;" bind:value={queryRpc.vpy} /></td>
			</tr>
		</tbody>
		<Button outline color="secondary" on:click={searchRPCS}>BUSCAR</Button>
	</Table>
	<Button outline color="secondary" on:click={beforeOffset}>ANTERIOR</Button>
	<Button outline color="secondary" on:click={nextOffset}>SIGUIENTE</Button>
</main>

