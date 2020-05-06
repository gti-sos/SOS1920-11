<script>
    import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
	let msg;
	let offset = 0;
	let limit = 2;
	let numTotal;
	let numFiltered;
	let userMsg = "";
	let crimes = [];
	let newCrime = {
		country: "",
		year: 0,
		cr_rate: 0,
        cr_saferate: 0,
        cr_homicrate: 0,
        cr_homicount: 0,
        cr_theftrate: 0,
        cr_theftcount: 0
	};
	let queryCrime = {
		country: "",
		year: "",
		cr_rate: "",
        cr_saferate: "",
        cr_homicrate: "",
        cr_homicount: "",
        cr_theftrate: "",
        cr_theftcount: ""
	};

	onMount(getCrimes);

    async function getCrimes(){
        console.log("Cargando crimenes");
        const res = await fetch ("/api/v1/crime-rate-stats");

        if (res.ok){
			console.log("OK!");
			const json= await res.json();
			crimes = json ;
			console.log("Received "+crimes.length+" Crimes.");
			numTotal = crimes.length;
		}else{
			Crimes = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			}
			console.log("Base de datos vacía");
		}
    }

	async function loadInitialData(){
        console.log("Cargando crimenes iniciales");
        const res = await fetch ("/api/v1/crime-rate-stat/loadInitialData");

        if (res.ok){
			console.log("Datos iniciales cargados");
			getCrimes();
		}else{
			Crimes = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			}
			console.log("Base de datos vacía");
		}
    }

    async function insertCrime(){
		
		if(newCrime.country!="" && !isNaN(parseInt(newCrime.year))){
			console.log('Insertando crimen... '+ JSON.stringify(newCrime));
			const res = await fetch("/api/v1/crime-rate-stats",{
				method: "POST",
				body: JSON.stringify(newCrime),
				headers: {
					"Content-Type": "application/json"
				}
			}).then(function(res){
				getCrimes();
				userMsg = "El dato fue insertado correctamente.";

			});
		}else{
			userMsg = "El dato insertado no tiene nombre/año válido/s .";
			console.log('Inserted Crime has no valid name or valid year.');
		}
    }
    
    async function deleteCrime(country,year){
		console.log('Borrando crimen... ');
		const res = await fetch("/api/v1/crime-rate-stats/"+country +"/"+year,{
			method: "DELETE"
		}).then(function(res){
			getCrimes();
			userMsg = "El dato ha sido borrado.";
		});	
    }
    
    async function deleteteCrimes(){
		console.log("Borrando crimenes..");
		const res = await fetch("/api/v1/crime-rate-stats",{
			method: "DELETE"
		}).then(function(res){
			userMsg = "Todos los datos han sido borrados.";
			getCrimes();
		});
	}

	async function searchCrimes(){
		console.log("Buscando...");
		var query = "?";
		if(queryCrime.country!=""){
			if (query =="?") {
				query = query + "country="+queryCrime.country;
			}else{
				query = query + "&country="+queryCrime.country;
			}
		}
		if(queryCrime.year!=""){
			if (query =="?") {
				query = query + "year="+queryCrime.year;
			}else{
				query = query + "&year="+queryCrime.year;
			}
		}
		if(queryCrime.cr_rate!=""){
			if (query =="?") {
				query = query + "rpc="+queryCrime.cr_rate;
			}else{
				query = query + "&rpc="+queryCrime.cr_rate;
			}
		}
		if(queryCrime.cr_saferate!=""){
			if (query =="?") {
				query = query + "piba="+queryCrime.cr_saferate;
			}else{
				query = query + "&piba="+queryCrime.cr_saferate;
			}
		}
		if(queryCrime.pib1t!=""){
			if (query =="?") {
				query = query + "pib1y="+queryCrime.pib1t;
			}else{
				query = query + "&pib1t="+queryCrime.pib1t;
			}
		}
		if(queryCrime.pib2t!=""){
			if (query =="?") {
				query = query + "pib2t="+queryCrime.pib2t;
			}else{
				query = query + "&pib2t="+queryCrime.pib2t;
			}
		}
		if(queryCrime.pib3t!=""){
			if (query =="?") {
				query = query + "pib3t="+queryCrime.pib3t;
			}else{
				query = query + "&pib3t="+queryCrime.pib3t;
			}
		}
		if(queryCrime.pib4t!=""){
			if (query =="?") {
				query = query + "pib4t="+queryCrime.pib4t;
			}else{
				query = query + "&pib4t="+queryCrime.pib4t;
			}
		}
		if(queryCrime.vpy!=""){
			if (query =="?") {
				query = query + "vpy="+queryCrime.vpy;
			}else{
				query = query + "&vpy="+queryCrime.vpy;
			}
		}
		query = query + "&limit="+limit+"&offset="+ offset;

		const res = await fetch("/api/v1/rents-per-capita"+query);
		console.log("Sending this.." + JSON.stringify(queryCrime));
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
		searchCrimeS();
	
	}

	async function nextOffset(){
		if((offset + limit)<numTotal) offset = offset + limit;
		searchCrimeS();
	
	}
</script>
<main>
	<h2>GUI Crimes</h2> 
	<Button outline color="danger" on:click={loadInitialData}>CARGAR DATOS INCIALES</Button>
	{#if userMsg}
	<h3><p>{userMsg}</p></h3>
	{/if}
	{#await crimes}
	{:then crimes}
    <Table bordered style="width: auto;">
        <thead>
            <td>Country</td>
            <td>Year</td>
            <td>Crime Rate</td>
            <td>Safe Rate</td>
            <td>Homicide Rate</td>
            <td>Homicide Count</td>
            <td>Theft Rate</td>
            <td>Theft Count</td>
        </thead>
        <tbody>
			<tr>
				<td><input style="width: 100px;" bind:value="{newCrime.country}" /></td>
				<td><input style="width: 50px;" bind:value="{newCrime.year}" /></td>
				<td><input style="width: 50px;" bind:value="{newCrime.cr_rate}" /></td>
				<td><input style="width: 100px;" bind:value={newCrime.cr_saferate} /></td>
				<td><input style="width: 100px;" bind:value={newCrime.cr_homicrate} /></td>
				<td><input style="width: 100px;" bind:value={newCrime.cr_homicount} /></td>
				<td><input style="width: 100px;" bind:value={newCrime.cr_theftrate} /></td>
				<td><input style="width: 100px;" bind:value={newCrime.cr_theftcount} /></td>
				<td><Button on:click={insertCrime} outline color="primary">INSERTAR</Button></td>
			</tr>
			{#each crimes as crime}
			<tr>
				<td><a href="/#/Crimes/{crime.country}/{crime.year}">{crime.country}</a></td>
				<td>{crime.year}</td>
				<td>{crime.cr_rate}</td>
				<td>{crime.cr_saferate}</td>
				<td>{crime.cr_homicrate}</td>
				<td>{crime.cr_homicount}</td>
				<td>{crime.cr_theftrate}</td>
				<td>{crime.cr_theftcount}</td>
				<td><Button on:click={deleteCrime(crime.country,crime.year)} outline color="danger">BORRAR</Button></td>
			</tr>
			{/each}
		</tbody>
		<Button outline color="danger" on:click={deleteteCrimes}>BORRAR TODO</Button>   
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
				<td><input style="width: 100px;" bind:value="{queryCrime.country}" /></td>
				<td><input style="width: 50px;" bind:value="{queryCrime.year}" /></td>
				<td><input style="width: 100px;" bind:value={queryCrime.cr_rate} /></td>
				<td><input style="width: 100px;" bind:value={queryCrime.cr_saferate} /></td>
				<td><input style="width: 100px;" bind:value={queryCrime.cr_homicrate} /></td>
				<td><input style="width: 100px;" bind:value={queryCrime.cr_homicount} /></td>
				<td><input style="width: 100px;" bind:value={queryCrime.cr_theftrate} /></td>
				<td><input style="width: 100px;" bind:value={queryCrime.cr_theftcount} /></td>

			</tr>
		</tbody>
		<Button outline color="secondary" on:click={searchCrimes}>BUSCAR</Button>
	</Table>
	<Button outline color="secondary" on:click={beforeOffset}>ANTERIOR</Button>
	<Button outline color="secondary" on:click={nextOffset}>SIGUIENTE</Button>
</main>

