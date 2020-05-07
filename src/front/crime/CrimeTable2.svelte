<script>
	import {
		onMount
	} from "svelte";

	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";

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

    let queryCrime= {
		country: "",
		year: "",
		cr_rate: "",
        cr_saferate: "",
        cr_homicrate: "",
        cr_homicount: "",
        cr_theftrate: "",
        cr_theftcount: ""
    };
    let busquedaEsp=false;
    let queryEntera=""
    async function searchCrime(){
        
        var campos = new Map(Object.entries(queryCrime).filter((o)=>{
            return (o[1]!="")
            }));
        let queryaux="?";
        for (var [clave, valor] of campos.entries()){
            queryaux += clave+"="+valor+"&";
        }
        queryEntera=queryaux.slice(0,-1);

        if (queryEntera!=""){
            console.log("Buscando contactos");
            const res = await fetch("/api/v2/crime-rate-stats"+queryEntera);

            if (res.ok) {
                console.log("Ok:");
                const json = await res.json();
                crimes = json;
                console.log("Recibidos " + crimes.length + " crimes.");
                numTotal= crimes.length;
                userMsg = "Busqueda realizada correctamente" ;
                busquedaEsp=true;
            } else {
                crimes=[];
                if(userMsg!="se ha borrado correctamente"){
                    userMsg = "No se han encontrado datos.";
                }
                console.log("ERROR!");
            }
        }else{
            getCrimes();
        }
        
    }


    let offset = 0;
	let limit = 10;
	let numTotal;
	let numFiltered;
    let userMsg = "";
    
	onMount(getCrimes);
    
	async function getCrimes() {
        busquedaEsp=false;
		console.log("Buscando contactos");
		const res = await fetch("/api/v2/crime-rate-stats?limit="+limit+"&offset="+offset);

		if (res.ok) {
			console.log("Ok:");
			const json = await res.json();
			crimes = json;
            console.log("Recibidos " + crimes.length + " crimenes.");
            numTotal= crimes.length;
		} else {
            crimes=[];
            if(userMsg!="se ha borrado correctamente"){
				userMsg = "No se han encontrado datos.";
			}
			console.log("ERROR!");
		}
	}
    let entradas=Object.entries(newCrime).map((c)=>{return c[0]});
    
    async function insertaCrime() {
        busquedaEsp=false;

        newCrime.year= parseInt(newCrime.year);
			newCrime.cr_rate= parseFloat(newCrime.cr_rate);
			newCrime.cr_saferate= parseFloat(newCrime.cr_saferate);
			newCrime.cr_homicrate= parseFloat(newCrime.cr_homicrate);
			newCrime.cr_homicount= parseInt(newCrime.cr_homicount);
			newCrime.cr_theftrate= parseFloat(newCrime.cr_theftrate);
			newCrime.cr_theftcount= parseInt(newCrime.cr_theftcount);
        
		const res = await fetch("/api/v2/crime-rate-stats/", {
			method: "POST",
			body: JSON.stringify(newEfi),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(function (res) {
                getCrimes();
                if (res.status==201){
                    
                    console.log(entradas);
                    userMsg="Crimen creado correctamente"
                }else{
                    userMsg="el crimen no se ha creado correctamente..."
                }
                
		});

	}
	async function deleteCrime(country,year) {
                busquedaEsp=false;

        console.log(country);
        console.log(year);
		const res = await fetch("/api/v2/crime-rate-stats/" + country + "/" + year, {
			method: "DELETE"
		}).then(function (res) {
            if (res.status!=404){
            
                userMsg="se ha borrado correctamente";
                getCrimes();
            }
            else{
                userMsg="no se ha borrado correctamente";
            }
		});
    }
    
    async function loadData(){
        busquedaEsp=false;
        const res = await fetch("/api/v2/crime-rate-stats/loadInitialData");
        userMsg="Datos iniciales cargados"
		if (res.ok) {
           getCrimes();
		} else {
            crimes=[]
            userMsg = "No se han encontrado datos."
			console.log("ERROR!");
		}
    }
    async function delData(){
        busquedaEsp=false;
        const res = await fetch("/api/v2/crime-rate-stats/", {
			method: "DELETE"
		}).then(function (res) {
            if (res.status!=404){
                userMsg="se ha borrado correctamente";
                getCrimes();
                
            }
            else{
                userMsg="no se ha todo borrado correctamente";
            }
		});
    }
    async function reset(){
        limit=10;
        offset=0;
        getCrimes();
    };
    async function beforeOffset(){
		if (offset >=10) offset = offset - limit;
		getCrimes();
	
	}

	async function nextOffset(){
		if((offset + limit)<=numTotal) offset = offset + limit;
		getCrimes();
	
    }
    let maxpag= numTotal>=limit;
</script>

<main>
     <div>
        <table>
            <tbody>
                <tr><Button outline color="secondary" on:click={loadData}>Cargar Datos iniciales</Button></tr>
                <tr><Button outline color="danger" on:click={delData}>Borrar todo</Button></tr>
                
            </tbody>
        </table>
    </div>
	{#await crimes}    
	{:then crimes}
    <div style="width:auto;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;">
		<Table bordered>
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
			<td>Opciones</td>
				</tr>
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
		
					<td> <Button outline  color="primary" on:click={insertaCrime}>Insertar</Button> </td>
				</tr>

				{#each crimes as crime}
					<tr>
						<td>
							<a href="#/crimes/{crime.country}/{crime.year}">{crime.country}</a>
						</td>
						
                <td>{crime.year}</td>
				<td>{crime.cr_rate}</td>
				<td>{crime.cr_saferate}</td>
				<td>{crime.cr_homicrate}</td>
				<td>{crime.cr_homicount}</td>
				<td>{crime.cr_theftrate}</td>
				<td>{crime.cr_theftcount}</td>
						<td><Button outline color="danger" on:click={deleteCrime(crime.country,crime.year)}>Borrar</Button></td>
					</tr>
				{/each}
			</tbody>
		</Table>
        </div>
        
        <div>
        {#if busquedaEsp}
            
            <Button outline color="secondary" on:click={reset}>Restaurar</Button>
        {:else}
        <Button outline color="secondary" on:click={beforeOffset}>ANTERIOR</Button>
        {/if}
        {#if !maxpag}
	    <Button outline color="secondary" on:click={nextOffset}>SIGUIENTE</Button> 
        {/if}
        {numTotal}
        <br>
        <h3>{userMsg}</h3>
        <br>
        </div>
       
	{/await}
    <div style="width:auto;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;">

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
		
	</Table>
    </div>
    <Button outline color="secondary" on:click={searchCrime}>BUSCAR</Button> 
    
</main>