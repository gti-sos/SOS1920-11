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
	}
	let queryCrime = {
		country: "",
		year: "",
		cr_rate: "",
        cr_saferate: "",
        cr_homicrate: "",
        cr_homicount: "",
        cr_theftrate: "",
        cr_theftcount: ""
	}

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
	<h2>GUI de Crimes</h2> 
	<Button outline color="danger" on:click={loadInitialData}>CARGAR DATOS INCIALES</Button>
	{#if userMsg}
	<h3><p>{userMsg}</p></h3>
	{/if}
	{#await crimes}
	{:then crimes}
    <table>
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
				<td>{Crime.year}</td>
				<td>{Crime.Crime}</td>
				<td>{Crime.piba}</td>
				<td>{Crime.pib1t}</td>
				<td>{Crime.pib2t}</td>
				<td>{Crime.pib3t}</td>
				<td>{Crime.pib4t}</td>
				<td>{Crime.vpy}</td>
				<td><Button on:click={deleteCrime(Crime.country,Crime.year)} outline color="danger">DELETE</Button></td>
			</tr>
			{/each}
		</tbody>
		<Button outline color="danger" on:click={deleteteCrimeS}>BORRAR TODO</Button>
        </tbody>    
    </table>
</main>

