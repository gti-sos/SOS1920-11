<script>
    import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
    import {pop} from "svelte-spa-router";
    export let params = {};

    let rpc = {};
    let country;
    let year;
    let updatedRPC;
    let updatedPiba;
    let updatedPib1t;
    let updatedPib2t;
    let updatedPib3t;
    let updatedPib4t;
    let updatedVpy;
    let userMsg;

    onMount(getRPC);

    async function getRPC(){
        console.log('Fetching rpc..');
        const res = await fetch("/api/v2/rents-per-capita/"+params.country+"/"+params.year);

        if (res.ok){
            console.log("OK!");
            const json= await res.json();
            rpc = json ;
            country = rpc.country;
            year = rpc.year;
            updatedRPC = rpc.rpc;
            updatedPiba = rpc.piba;
            updatedPib1t = rpc.pib1t;
            updatedPib2t = rpc.pib2t;
            updatedPib3t = rpc.pib3t;
            updatedPib4t = rpc.pib4t;
            updatedVpy = rpc.vpy;
            console.log("Received rpc.");

        }else{
            console.log("ERROR!!!");
        }
    }

    async function updateRPC(){
        console.log('Updating rpc from '+ JSON.stringify(params.country)+" "+JSON.stringify(params.year));
		const res = await fetch("/api/v2/rents-per-capita/"+params.country+"/"+params.year,{
			method: "PUT",
			body: JSON.stringify({
                country: country,
                year: year,
                rpc: updatedRPC,
                piba: updatedPiba,
                pib1t: updatedPib1t,
                pib2t: updatedPib2t,
                pib3t: updatedPib3t,
                pib4t: updatedPib4t,
                vpy: updatedVpy 
            }),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(function(res){
            
            userMsg = "DATO ACTUALIZADO";
		});	
    }
</script>
<main>
    <h2>Editing RPC from {params.country} {params.year} {#if userMsg}<p style= "color:orange">{userMsg}</p>{/if}</h2>

	{#await rpc} 
	{:then rpc}
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
				<td>{rpc.country}</td>
				<td>{rpc.year}</td>
				<td><input style="width: 100px;" bind:value={updatedRPC} /></td>
				<td><input style="width: 100px;" bind:value={updatedPiba} /></td>
				<td><input style="width: 100px;" bind:value={updatedPib1t} /></td>
				<td><input style="width: 100px;" bind:value={updatedPib2t} /></td>
				<td><input style="width: 100px;" bind:value={updatedPib3t} /></td>
				<td><input style="width: 100px;" bind:value={updatedPib4t} /></td>
				<td><input style="width: 50px;" bind:value={updatedVpy} /></td>
				<td><Button on:click={updateRPC} outline color="primary">ACTUALIZAR</Button></td>
			</tr>
		</tbody>
		
	</Table>
    {/await}
    <Button outline color="secondary" on:click="{pop}">VOLVER</Button>
</main>