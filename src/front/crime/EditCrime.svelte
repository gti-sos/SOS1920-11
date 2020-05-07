<script>
    import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
    import {pop} from "svelte-spa-router";
    export let params = {};
    
    let crime = {};
    let country;
    let year; 
    let cr_rateU;
    let cr_saferateU;
    let cr_homicrateU;
    let cr_homicountU;
    let cr_theftrateU;
    let cr_theftcountU;
    let userMsg;

    onMount(getCrime);

    async function getCrime(){
        console.log("Buscando crimen...");
        const res = await fetch("/api/v2/crime-rate-stats/"+params.country+"/"+params.year);

        if (res.ok){
            console.log("OK!");
            const json= await res.json();
            crime = json ;
            country = crime.country;
            year = crime.year;
            cr_rateU = crime.cr_rate;
            cr_saferateU = crime.cr_saferate;
            cr_homicrateU = crime.cr_homicrate;
            cr_homicountU = crime.cr_homicount;
            cr_theftrateU = crime.cr_theftrate;
            cr_theftcountU = crime.cr_theftcount;
            console.log("Crimen recibido.");

        }else{
            console.log("Error, algo ha ido mal");
        }
    }
    
    async function updateCrime(){
        console.log('Actualizando crimen con '+ JSON.stringify(params.country)+" "+JSON.stringify(params.year));
		const res = await fetch("/api/v2/crime-rate-stats/"+params.country+"/"+params.year,{
			method: "PUT",
			body: JSON.stringify({
                country: country,
                year: year,
                cr_rate: cr_rateU,
                cr_saferate: cr_saferateU,
                cr_homicrate: cr_homicrateU,
                cr_homicount: cr_homicountU,
                cr_theftrate: cr_theftrateU,
                cr_theftcount: cr_theftcountU, 
            }),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(function(res){
            
            userMsg = "DATO ACTUALIZADO";
		});	
    
    };
</script>
<main>
    <h2>Editando crimen para el país {params.country} y el año {params.year} {#if userMsg}<p style= "color:orange">{userMsg}</p>{/if}</h2>
    {#await crime}

    {:then crime}
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
				<td>OPCIONES</td>
        </thead>
        <tbody>
            <td>{country}</td>
                <td>{year}</td>
                <td><input bind:value="{cr_rateU}"></td>
                <td><input bind:value="{cr_saferateU}"></td>
                <td><input bind:value="{cr_homicrateU}"></td>
                <td><input bind:value="{cr_homicountU}"></td>
                <td><input bind:value="{cr_theftrateU}"></td>
                <td><input bind:value="{cr_theftcountU}"></td>
                <td> <Button outline  color="primary" on:click={updateCrime}>Actualizar</Button> </td>
        </tbody>
    </table>
    {/await}
    <Button outline color="secondary" on:click="{pop}">Volver</Button>
</main>