<script>

    import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
    import {pop} from "svelte-spa-router";
    export let params = {};

    let efi = {};
    let updatecountry;
    let updateyear;
    let updateefiindex;
    let updateefigovint;
    let updateefipropright;
    let updateefijudefct;
    let updateefitaxburden;
    let updateefigovspend;
    let updateefisicalhealth;
    let updateefibusfreed;
    let updateefilabfreed;
    let updateefimonfreed;
    let updateefitradefreed;
    let updateefiinvfreed;
    let updateefifinfred;
    let msg;
    
    onMount(getEfi);

    async function getEfi(){
        console.log('Fetching efi ...');
        const res = await fetch("/api/v2/economic-freedom-indexes/"+params.country+"/"+params.year);

        if (res.ok){
            console.log("OK!");
            const json= await res.json();
            efi = json ;
            updatecountry=efi.country;
            updateyear=efi.year
            updateefiindex=efi.efiindex;
            updateefigovint=efi.efigovint
            updateefipropright=efi.efipropright;
            updateefijudefct=efi.efijudefct;
            updateefitaxburden=efi.efitaxburden;
            updateefigovspend=efi.efigovspend;
            updateefisicalhealth=efi.efisicalhealth;
            updateefibusfreed=efi.efibusfreed;
            updateefilabfreed=efi.efilabfreed;
            updateefimonfreed=efi.efimonfreed;
            updateefitradefreed=efi.efitradefreed;
            updateefiinvfreed=efi.efiinvfreed;
            updateefifinfred=efi.efifinfred;
            console.log("Received efi");

        }else{
            msg="Fallo en la carga del dato";
            console.log("ERROR!!!");
        }
    }

    async function updateEfi(){
        console.log('Updating efi from '+ JSON.stringify(params.country)+" "+JSON.stringify(params.year));
		const res = await fetch("/api/v2/economic-freedom-indexes/"+params.country+"/"+params.year,{
			method: "PUT",
			body: JSON.stringify({
                country:params.country,
                year:parseInt(params.year),
                efiindex:parseFloat(updateefiindex),
                efigovint:parseFloat(updateefigovint),
                efipropright:parseFloat(updateefipropright),
                efijudefct:parseFloat(updateefijudefct),
                efitaxburden:parseFloat(updateefitaxburden),
                efigovspend:parseFloat(updateefigovspend),
                efisicalhealth:parseFloat(updateefisicalhealth),
                efibusfreed:parseFloat(updateefibusfreed),
                efilabfreed:parseFloat(updateefilabfreed),
                efimonfreed:parseFloat(updateefimonfreed),
                efitradefreed:parseFloat(updateefitradefreed),
                efiinvfreed:parseFloat(updateefiinvfreed),
                efifinfred:parseFloat(updateefifinfred)
            }),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(function(res){
                if(res.ok){
                    msg = "EL DATO FUE ACTUALIZADO";
                    //location.href="/#/efis/";
                    getEfi();
                }else{
                    res.status + ": " + res.statusText;
                    
                }             
                
		    });	
    }
</script>
<main>
<h2>Editando EFI del pais {params.country} y año {params.year}</h2>
{#await efi};

{:then efi}
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
                <td>{updatecountry}</td>
                <td>{updateyear}</td>
                <td><input bind:value="{updateefiindex}"></td>
                <td><input bind:value="{updateefigovint}"></td>
                <td><input bind:value="{updateefipropright}"></td>
                <td><input bind:value="{updateefijudefct}"></td>
                <td><input bind:value="{updateefitaxburden}"></td>
                <td><input bind:value="{updateefigovspend}"></td>
                <td><input bind:value="{updateefisicalhealth}"></td>
                <td><input bind:value="{updateefibusfreed}"></td>
                <td><input bind:value="{updateefilabfreed}"></td>
                <td><input bind:value="{updateefimonfreed}"></td>
                <td><input bind:value="{updateefitradefreed}"></td>
                <td><input bind:value="{updateefiinvfreed}"></td>
                <td><input bind:value="{updateefifinfred}"></td>
    
                <td> <Button outline  color="primary" on:click={updateEfi}>Actualiza</Button> </td>
            </tr>
        </tbody>
    </Table>
</div>
{/await}
    {#if msg}
        <p style="color: red"> {msg}</p>
    {/if}
    <Button outline color="secondary" on:click="{pop}">Atrás</Button>
</main>