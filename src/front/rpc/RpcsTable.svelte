<script>
	import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";
	

	
	let rpcs = [];
	let newRpc = {
		country: "",
		continent: "",
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
		continent: "",
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
	let limit = 10;
	let numTotal;
	let numFiltered;
	let userMsg;
	
	onMount(getRPCS);

	async function loadInitialData(){
		console.log('Loading initial rpcs..');
		const res = await fetch("/api/v3/rents-per-capita/loadInitialData");

		userMsg = "DATOS INICIALES CARGADOS.";
		if (res.ok){
			console.log("DATOS INICIALES CARGADOS!");
			getRPCS();
		}else{
			rpcs = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			}
			console.log("Datasabe empty");
		}
	}

	async function getRPCS(){
		var query = "";
		numTotal = await getNumTotal(query);
		console.log('Fetching rpcs..');
		query = query + "?limit="+limit+"&offset="+offset;
		const res = await fetch("/api/v3/rents-per-capita"+query);

		if (res.ok){
			console.log("OK!");
			const json= await res.json();
			rpcs = json ;
			console.log("Received "+rpcs.length+" rpcs.");
			if(userMsg == "El dato fue insertado correctamente." || userMsg =="El dato ha sido borrado." || userMsg =="DATOS INICIALES CARGADOS."){
				userMsg =userMsg + "\nMostrando "+rpcs.length+" de "+numTotal+" datos. Página:" +(offset/limit+1);

			}else{
				userMsg = "Mostrando "+rpcs.length+" de "+numTotal+" datos. Página:" +(offset/limit+1);

			}
		}else{
			rpcs = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			}
			console.log("Datasabe empty");
		}
	}

	async function insertRPC(){

			newRpc.year= parseInt(newRpc.year);
			newRpc.rpc= parseInt(newRpc.rpc);
			newRpc.piba= parseInt(newRpc.piba);
			newRpc.pib1t= parseInt(newRpc.pib1t);
			newRpc.pib2t= parseInt(newRpc.pib2t);
			newRpc.pib3t= parseInt(newRpc.pib3t);
			newRpc.pib4t= parseInt(newRpc.pib4t);
			newRpc.vpy= parseFloat(newRpc.vpy);
		
		if(newRpc.country!=""&& !isNaN(newRpc.year) && newRpc.year>1900 &&
				((newRpc.continent=="Asia") || (newRpc.continent=="America")|| (newRpc.continent=="Africa")|| (newRpc.continent=="Europe")|| (newRpc.continent=="Oceania"))){
			rpcs.forEach(x => {
			if(x.country ==newRpc.country && x.year == newRpc.year){
				userMsg="El dato de ese año y país ya existe.";
			}
			});

			
		
			if(userMsg!="El dato de ese año y país ya existe."){
				console.log('Inserting rpc... '+ JSON.stringify(newRpc));
			const res = await fetch("/api/v3/rents-per-capita",{
				method: "POST",
				body: JSON.stringify(newRpc),
				headers: { 
					"Content-Type": "application/json"
				}
			}).then(function(res){
				
				userMsg = "El dato fue insertado correctamente.";
				getRPCS();

			});
			}
		
		
		}else{
			userMsg = "El dato insertado no tiene nombre/año/continente válido/s .";
			console.log('Inserted rpc has no valid name, year or continent.');
		}
	}

	async function deleteRPC(country,year){
		console.log('Deleting rpc... ');
		const res = await fetch("/api/v3/rents-per-capita/"+country +"/"+year,{
			method: "DELETE"
		}).then(function(res){
			getRPCS();
			userMsg = "El dato ha sido borrado.";
		});	
	}

	async function deleteRPCS(){
		console.log('Deleting rpcs..');
		const res = await fetch("/api/v3/rents-per-capita",{
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
		if(queryRpc.continent!=""){
			if (query =="?") {
				query = query + "year="+queryRpc.continent;
			}else{
				query = query + "&year="+queryRpc.continent;
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
		
		numTotal = await getNumTotal(query);

		query = query + "&limit="+limit+"&offset="+ offset;
		const res = await fetch("/api/v3/rents-per-capita"+query);
		console.log("Sending ");
		if (numTotal>0){
			console.log("OK!");
			const json= await res.json();
			rpcs = json ;
			console.log("Received "+rpcs.length+" rpcs, offset = "+offset+".");
			userMsg = "Mostrando "+rpcs.length+" de "+numTotal+" datos. Página:" +(offset/limit+1);
			
		}else{
			rpcs = [] ;
			userMsg = "No se han encontrado datos.";
			console.log("Not found");
		}
	}

	async function getNumTotal(query){
		const res = await fetch("/api/v3/rents-per-capita"+query);
		if(res.ok){
			const json= await res.json();
		rpcs = json ;
		return parseInt(rpcs.length);
		}else{
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			}
			return 0;
		}

	}

	async function beforeOffset(){
		if (offset >=limit) offset = offset - limit;
		searchRPCS();
	
	}

	async function nextOffset(){
		if((offset + limit)<numTotal) offset = offset + limit;
		searchRPCS();
	
	}

	async function setOffsetZero(){
		offset = 0;
	}


</script>

<main>
	<h1><a href="/#/">SOS1920-11</a></h1>
	<h2>RPCS GUI</h2>
	<p>*Tips: Country no debe estar vacío / El año debe ser superior a 1900 / Continente debe ser Africa, Asia, America, Europe u Oceania</p>
	<a href="/#"><Button outline color="warning">INICIO</Button></a>
	<Button outline color="danger"  on:click={loadInitialData}>CARGAR DATOS INCIALES</Button>
	<a href="/#/rpcs/graph"><Button outline color="primary">ANÁLISIS GRÁFICO</Button></a>
	<a href="/#/rpcs/integrations"><Button outline color="primary">INTEGRACIONES</Button></a>
	{#if userMsg}
	<h3><p style= "color:orange">{userMsg}</p></h3>
	{/if}
	{#await rpcs};
	{:then rpcs}
	<Table bordered style="width:auto;">
		<thead>
			<tr>
				<td>Country</td>
				<td>Year</td>
				<td>Continent</td>
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
				<td><input style="width: 100px;" bind:value="{newRpc.continent}" /></td>
				<td><input style="width: 100px;" bind:value={newRpc.rpc} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.piba} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.pib1t} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.pib2t} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.pib3t} /></td>
				<td><input style="width: 100px;" bind:value={newRpc.pib4t} /></td>
				<td><input style="width: 50px;" bind:value={newRpc.vpy} /></td>
				<td><Button on:click={insertRPC} outline color="primary">INSERTAR</Button></td>
			</tr>
			{#each rpcs as rpc}
			<tr>
				<td><a href="/#/rpcs/{rpc.country}/{rpc.year}">{rpc.country}</a></td>
				<td>{rpc.year}</td>
				<td>{rpc.continent}</td>
				<td>{rpc.rpc}</td>
				<td>{rpc.piba}</td>
				<td>{rpc.pib1t}</td>
				<td>{rpc.pib2t}</td>
				<td>{rpc.pib3t}</td>
				<td>{rpc.pib4t}</td>
				<td>{rpc.vpy}</td>
				<td><Button on:click={deleteRPC(rpc.country,rpc.year)} outline color="danger">BORRAR</Button></td>
			</tr>
			{/each}
		</tbody>
		<Button outline color="danger" on:click={deleteRPCS}>BORRAR TODO</Button>
	</Table>
	{/await}

	<Table bordered style="width: auto;">
		<thead>
			<tr>
				<td>Country</td>
				<td>Year</td>
				<td>Continent</td>
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
				<td><input style="width: 100px;" bind:value="{queryRpc.continent}" /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.rpc} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.piba} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.pib1t} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.pib2t} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.pib3t} /></td>
				<td><input style="width: 100px;" bind:value={queryRpc.pib4t} /></td>
				<td><input style="width: 50px;" bind:value={queryRpc.vpy} /></td>
			</tr>
		</tbody>
		<Button outline color="secondary" on:click={searchRPCS} on:click={setOffsetZero}>BUSCAR</Button>
	</Table>
	<Button outline color="secondary" on:click={beforeOffset}>ANTERIOR</Button>
	<Button outline color="secondary" on:click={nextOffset}>SIGUIENTE</Button>

</main>

