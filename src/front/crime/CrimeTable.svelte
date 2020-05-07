<script>
    import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
	
	let msg;
	let busquedaEsp=false;
	let crimenes;
	let offset = 0;
	let limit = 10;
	let numTotal=0;
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
		var query = "";
		//numTotal = await getNumTotal(query);
		console.log('Buscando..');
		query = query + "?limit="+limit+"&offset="+offset;
		const res = await fetch("/api/v2/crime-rate-stats"+query);

		if (res.ok){
			console.log("OK!");
			const json= await res.json();
			crimes = json ;
			console.log("Received "+crimes.length+" rpcs.");
			numTotal=crimes.length;
			if(userMsg == "El dato fue insertado correctamente." || userMsg =="El dato ha sido borrado."){
				userMsg =userMsg + "\nMostrando "+crimes.length+" de "+numTotal+" datos. Página:" +(offset/limit+1);

			}else{
				userMsg = "Mostrando "+crimes.length+" de "+numTotal+" datos. Página:" +(offset/limit+1);

			}
		}else{
			crimes = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			}
			console.log("Datasabe empty");
		}
    }

	async function loadInitialData(){
        console.log("Cargando crimenes iniciales");
        res = await fetch ("/api/v2/crime-rate-stats/loadInitialData");

        if (res.ok){
			console.log("Datos iniciales cargados");
			userMsg = "Estos son los datos iniciales";
			getCrimes();
		}else{
			crimes = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos. "+ res.statusText;
			}
			console.log("Base de datos vacía");
		}
    }

    async function insertCrime(){
		
		if(newCrime.country!="" && !isNaN(parseInt(newCrime.year))){
			crimes.forEach(x => {
			if(x.country ==newCrime.country && x.year == newCrime.year){
				userMsg="El dato de ese año y país ya existe.";
			}
			});

			newCrime.country = newCrime.country;
			newCrime.year= parseInt(newCrime.year);
			newCrime.cr_rate= parseFloat(newCrime.cr_rate);
			newCrime.cr_saferate= parseFloat(newCrime.cr_saferate);
			newCrime.cr_homicrate= parseFloat(newCrime.cr_homicrate);
			newCrime.cr_homicount= parseInt(newCrime.cr_homicount);
			newCrime.cr_theftrate= parseFloat(newCrime.cr_theftrate);
			newCrime.cr_theftcount= parseInt(newCrime.cr_theftcount);
		
			if(userMsg!="El dato de ese año y país ya existe."){
				console.log('Inserting rpc... '+ JSON.stringify(newCrime));
			const res = await fetch("/api/v2/crime-rate-stats",{
				method: "POST",
				body: JSON.stringify(newCrime),
				headers: { 
					"Content-Type": "application/json"
				}
			}).then(function(res){
				
				userMsg = "El dato fue insertado correctamente.";
				getCrimes();

			});
			}
		
		}else{
			userMsg = "El dato insertado no tiene nombre/año válido/s .";
			console.log('Inserted crime has no valid name or valid year.');
			getCrimes();
		}
    }
    
    async function deleteCrime(country,year){
		console.log('Borrando crimen... ');
		const res = await fetch("/api/v2/crime-rate-stats/"+country +"/"+year,{
			method: "DELETE"
		}).then(function(res){
			getCrimes();
			userMsg = "El dato ha sido borrado.";
		});	
    }
    
    async function deleteteCrimes(){
		console.log("Borrando crimenes..");
		const res = await fetch("/api/v2/crime-rate-stats",{
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
				query = query + "cr_rate="+queryCrime.cr_rate;
			}else{
				query = query + "&cr_rate="+queryCrime.cr_rate;
			}
		}
		if(queryCrime.cr_saferate!=""){
			if (query =="?") {
				query = query + "cr_saferate="+queryCrime.cr_saferate;
			}else{
				query = query + "&cr_saferate="+queryCrime.cr_saferate;
			}
		}
		if(queryCrime.cr_homicrate!=""){
			if (query =="?") {
				query = query + "cr_homicrate="+queryCrime.cr_homicrate;
			}else{
				query = query + "&cr_homicrate="+queryCrime.cr_homicrate;
			}
		}
		if(queryCrime.cr_homicount!=""){
			if (query =="?") {
				query = query + "cr_homicount="+queryCrime.cr_homicount;
			}else{
				query = query + "&cr_homicount="+queryCrime.cr_homicount;
			}
		}
		if(queryCrime.cr_theftrate!=""){
			if (query =="?") {
				query = query + "cr_theftrate="+queryCrime.cr_theftrate;
			}else{
				query = query + "&cr_theftrate="+queryCrime.cr_theftrate;
			}
		}
		if(queryCrime.cr_theftcount!=""){
			if (query =="?") {
				query = query + "cr_theftcount="+queryCrime.cr_theftcount;
			}else{
				query = query + "&cr_theftcount="+queryCrime.cr_theftcount;
			}
		}
		query = query + "&limit="+limit+"&offset="+ offset;

		const res = await fetch("/api/v2/crime-rate-stats"+query);
		console.log("Sending this.." + JSON.stringify(queryCrime));
		if (res.ok){
			console.log("OK!");
			const json= await res.json();
			crimes2 = json ;
			console.log("Received "+crimes2+" crimes, offset = "+offset+".");
			numFiltered = crimes2.length;
			userMsg = "Mostrando "+numFiltered+" de "+numTotal+" datos."
			
		}else{
			crimes = [] ;
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

	async function getNumTotal(query){
		const res = await fetch("/api/v2/crime-rate-stats"+query);
		if(res.ok){
			const json= await res.json();
			crimenes = json ;
			return parseInt(crimenes.length);
		}else{
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			};
		}

	}
</script>
<main>
	<h2>GUI Crimes</h2> 
	<Button outline color="danger" on:click={loadInitialData()}>CARGAR DATOS INCIALES</Button>
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
			<td>Opciones</td>
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
				<td><Button on:click={insertCrime()} outline color="primary">INSERTAR</Button></td>
			</tr>
			{#each crimes as crime}
			<tr>
				<td><a href="/#/crimes/{crime.country}/{crime.year}">{crime.country}</a></td>
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
            <td>Crime Rate</td>
            <td>Safe Rate</td>
            <td>Homicide Rate</td>
            <td>Homicide Count</td>
            <td>Theft Rate</td>
            <td>Theft Count</td>
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

