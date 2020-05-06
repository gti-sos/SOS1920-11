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
            console.log("ERROR!!!");
        }
    }

    async function updateRPC(){
        console.log('Updating rpc from '+ JSON.stringify(params.country)+" "+JSON.stringify(params.year));
		const res = await fetch("/api/v1/rents-per-capita/"+params.country+"/"+params.year,{
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
            
            msg = "EL DATO FUE ACTUALIZADO";
            location.href="/#/rpcs/";
		});	
    }
</script>
<main>saludos</main>