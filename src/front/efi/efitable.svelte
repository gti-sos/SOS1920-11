<script>
	import {
		onMount
	} from "svelte";

	import Table from "sveltestrap/src/Table.svelte";
	import Button from "sveltestrap/src/Button.svelte";

	let efis = [];
	let newEfi = {
		country:"",
        year:0,
        efiindex:0.0,
        efigovint:0.0,
        efipropright:0.0,
        efijudefct:0.0,
        efitaxburden:0.0,
        efigovspend:0.0,
        efisicalhealth:0.0,
        efibusfreed:0.0,
        efilabfreed:0.0,
        efimonfreed:0.0,
        efitradefreed:0.0,
        efiinvfreed:0.0,
        efifinfred:0.0
	};

    let queryEfi= {
		country:"",
        year:"",
        efiindex:"",
        efigovint:"",
        efipropright:"",
        efijudefct:"",
        efitaxburden:"",
        efigovspend:"",
        efisicalhealth:"",
        efibusfreed:"",
        efilabfreed:"",
        efimonfreed:"",
        efitradefreed:"",
        efiinvfreed:"",
        efifinfred:""
    };
    let busquedaEsp=false;
    let queryEntera=""
    async function searchefi(){
        
        var campos = new Map(Object.entries(queryEfi).filter((o)=>{
            return (o[1]!="")
            }));
        let queryaux="?";
        for (var [clave, valor] of campos.entries()){
            queryaux += clave+"="+valor+"&";
        }
        queryEntera=queryaux.slice(0,-1);

        if (queryEntera!=""){
            console.log("Buscando contactos");
            const res = await fetch("/api/v2/economic-freedom-indexes"+queryEntera);

            if (res.ok) {
                console.log("Ok:");
                const json = await res.json();
                efis = json;
                console.log("Recibidos " + efis.length + " efis.");
                numTotal= efis.length;
                userMsg = "Busqueda realizada correctamente" ;
                busquedaEsp=true;
            } else {
                efis=[];
                if(userMsg!="se ha borrado correctamente"){
                    userMsg = "No se han encontrado datos.";
                }
                console.log("ERROR!");
            }
        }else{
            getEfis();
        }
        
    }


    let offset = 0;
	let limit = 10;
	let numTotal;
	let numFiltered;
    let userMsg = "";
    
	onMount(getEfis);
    
	async function getEfis() {
        busquedaEsp=false;
		console.log("Buscando contactos");
		const res = await fetch("/api/v2/economic-freedom-indexes?limit="+limit+"&offset="+offset);

		if (res.ok) {
			console.log("Ok:");
			const json = await res.json();
			efis = json;
            console.log("Recibidos " + efis.length + " efis.");
            numTotal= efis.length;
		} else {
            efis=[];
            if(userMsg!="se ha borrado correctamente"){
				userMsg = "No se han encontrado datos.";
			}
			console.log("ERROR!");
		}
	}
    let entradas=Object.entries(newEfi).map((c)=>{return c[0]});
    
    async function insertaEfi() {
        busquedaEsp=false;

        newEfi.year=parseInt(newEfi.year),
        newEfi.efiindex=parseFloat(newEfi.efiindex),
        newEfi.efigovint=parseFloat(newEfi.efigovint),
        newEfi.efipropright=parseFloat(newEfi.efipropright),
        newEfi.efijudefct=parseFloat(newEfi.efijudefct),
        newEfi.efitaxburden=parseFloat(newEfi.efitaxburden),
        newEfi.efigovspend=parseFloat(newEfi.efigovspend),
        newEfi.efisicalhealth=parseFloat(newEfi.efisicalhealth),
        newEfi.efibusfreed=parseFloat(newEfi.efibusfreed),
        newEfi.efilabfreed=parseFloat(newEfi.efilabfreed),
        newEfi.efimonfreed=parseFloat(newEfi.efimonfreed),
        newEfi.efitradefreed=parseFloat(newEfi.efitradefreed),
        newEfi.efiinvfreed=parseFloat(newEfi.efiinvfreed),
        newEfi.efifinfred=parseFloat(newEfi.efifinfred)
        
		const res = await fetch("/api/v2/economic-freedom-indexes/", {
			method: "POST",
			body: JSON.stringify(newEfi),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(function (res) {
                getEfis();
                if (res.status==201){
                    
                    console.log(entradas);
                    userMsg="EFI creado correctamente"
                }else{
                    userMsg="el EFI no se creado correctamente..."
                }
                
		});

	}
	async function deleteEfi(country,year) {
                busquedaEsp=false;

        console.log(country);
        console.log(year);
		const res = await fetch("/api/v2/economic-freedom-indexes/" + country + "/" + year, {
			method: "DELETE"
		}).then(function (res) {
            if (res.status!=404){
            
                userMsg="se ha borrado correctamente";
                getEfis();
            }
            else{
                userMsg="no se ha borrado correctamente";
            }
		});
    }
    
    async function loadData(){
        busquedaEsp=false;
        const res = await fetch("/api/v2/economic-freedom-indexes/loadInitialData");
        userMsg="Datos iniciales cargados"
		if (res.ok) {
           getEfis();
		} else {
            efis=[]
            userMsg = "No se han encontrado datos."
			console.log("ERROR!");
		}
    }
    async function delData(){
        busquedaEsp=false;
        const res = await fetch("/api/v2/economic-freedom-indexes/", {
			method: "DELETE"
		}).then(function (res) {
            if (res.status!=404){
                userMsg="se ha borrado correctamente";
                getEfis();
                
            }
            else{
                userMsg="no se ha todo borrado correctamente";
            }
		});
    }
    async function reset(){
        limit=10;
        offset=0;
        getEfis();
    };
    async function beforeOffset(){
		if (offset >=10) offset = offset - limit;
		getEfis();
	
	}

	async function nextOffset(){
		if((offset + limit)<=numTotal) offset = offset + limit;
		getEfis();
	
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
	{#await efis};   
	{:then efis}
    <div style="width:auto;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;">
		<Table bordered>
			<thead>
				<tr>
					<th>country</th>
					<th>year</th>
					<th>efiindex</th>
                    <th>efigovint</th>
                    <th>efipropright</th>
                    <th>efijudefct</th>
                    <th>efitaxburden</th>
                    <th>efigovspend</th>
                    <th>efifiscalhealth</th>
                    <th>efibusfreed</th>
                    <th>efilabfreed</th>
                    <th>efimonfreed</th>
                    <th>efitradefreed</th>
                    <th>efiinvfreed</th>
                    <th>efifinfreed</th>
					<th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><input bind:value="{newEfi.country}"></td>
					<td><input bind:value="{newEfi.year}"></td>
                    <td><input bind:value="{newEfi.efiindex}"></td>
					<td><input bind:value="{newEfi.efigovint}"></td>
                    <td><input bind:value="{newEfi.efipropright}"></td>
					<td><input bind:value="{newEfi.efijudefct}"></td>
					<td><input bind:value="{newEfi.efitaxburden}"></td>
                    <td><input bind:value="{newEfi.efigovspend}"></td>
					<td><input bind:value="{newEfi.efisicalhealth}"></td>
					<td><input bind:value="{newEfi.efibusfreed}"></td>
                    <td><input bind:value="{newEfi.efilabfreed}"></td>
					<td><input bind:value="{newEfi.efimonfreed}"></td>
					<td><input bind:value="{newEfi.efitradefreed}"></td>
                    <td><input bind:value="{newEfi.efiinvfreed}"></td>
					<td><input bind:value="{newEfi.efifinfred}"></td>
		
					<td> <Button outline  color="primary" on:click={insertaEfi}>Insertar</Button> </td>
				</tr>

				{#each efis as efi}
					<tr>
						<td>
							<a href="#/efis/{efi.country}/{efi.year}">{efi.country}</a>
						</td>
						
                        <td>{efi.year}</td>
                        <td>{efi.efiindex}</td>
                        <td>{efi.efigovint}</td>
                        <td>{efi.efipropright}</td>
                        <td>{efi.efijudefct}</td>
                        <td>{efi.efitaxburden}</td>
                        <td>{efi.efigovspend}</td>
                        <td>{efi.efisicalhealth}</td>
                        <td>{efi.efibusfreed}</td>
                        <td>{efi.efilabfreed}</td>
                        <td>{efi.efimonfreed}</td>
                        <td>{efi.efitradefreed}</td>
                        <td>{efi.efiinvfreed}</td>
                        <td>{efi.efifinfred}</td>
						<td><Button outline color="danger" on:click={deleteEfi(efi.country,efi.year)}>Borrar</Button></td>
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
				<th>country</th>
                <th>year</th>
                <th>efiindex</th>
                <th>efigovint</th>
                <th>efipropright</th>
                <th>efijudefct</th>
                <th>efitaxburden</th>
                <th>efigovspend</th>
                <th>efifiscalhealth</th>
                <th>efibusfreed</th>
                <th>efilabfreed</th>
                <th>efimonfreed</th>
                <th>efitradefreed</th>
                <th>efiinvfreed</th>
                <th>efifinfreed</th>
			</tr>
		</thead>
		<tbody>
			<tr>
                <td><input bind:value="{queryEfi.country}"></td>
                <td><input bind:value="{queryEfi.year}"></td>
                <td><input bind:value="{queryEfi.efiindex}"></td>
                <td><input bind:value="{queryEfi.efigovint}"></td>
                <td><input bind:value="{queryEfi.efipropright}"></td>
                <td><input bind:value="{queryEfi.efijudefct}"></td>
                <td><input bind:value="{queryEfi.efitaxburden}"></td>
                <td><input bind:value="{queryEfi.efigovspend}"></td>
                <td><input bind:value="{queryEfi.efisicalhealth}"></td>
                <td><input bind:value="{queryEfi.efibusfreed}"></td>
                <td><input bind:value="{queryEfi.efilabfreed}"></td>
                <td><input bind:value="{queryEfi.efimonfreed}"></td>
                <td><input bind:value="{queryEfi.efitradefreed}"></td>
                <td><input bind:value="{queryEfi.efiinvfreed}"></td>
                <td><input bind:value="{queryEfi.efifinfred}"></td>
			</tr>
		</tbody>
		
	</Table>
    </div>
    <Button outline color="secondary" on:click={searchefi}>BUSCAR</Button> 
    
</main>