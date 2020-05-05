<script>
    import {onMount} from "svelte";
	import Table from "sveltestrap/src/Table.svelte";
    import Button from "sveltestrap/src/Button.svelte";
    let msg;

    async function getCrimes(){
        console.log("Cargando crimenes");
        const res = await fetch ("/api/v1/crime-rate-stats");

        if (res.ok){
			console.log("OK!");
			const json= await res.json();
			crimes = json ;
			console.log("Received "+crimes.length+" rpcs.");
			numTotal = crimes.length;
		}else{
			rpcs = [] ;
			if(userMsg!="Todos los datos han sido borrados."){
				userMsg = "No se han encontrado datos.";
			}
			console.log("Base de datos vacía");
		}
    }

    async function insertCrimes(){
		
		if(newRpc.country!="" && !isNaN(parseInt(newRpc.year))){
			console.log('Insertando crimen... '+ JSON.stringify(newRpc));
			const res = await fetch("/api/v1/crime-rate-stats",{
				method: "POST",
				body: JSON.stringify(newRpc),
				headers: {
					"Content-Type": "application/json"
				}
			}).then(function(res){
				getRPCS();
				userMsg = "El dato fue insertado correctamente.";

			});
		}else{
			userMsg = "El dato insertado no tiene nombre/año válido/s .";
			console.log('Inserted rpc has no valid name or valid year.');
		}
    }
    
    async function deleteCrime(country,year){
		console.log('Borrando crimen... ');
		const res = await fetch("/api/v1/crime-rate-stats/"+country +"/"+year,{
			method: "DELETE"
		}).then(function(res){
			getRPCS();
			userMsg = "El dato ha sido borrado.";
		});	
    }
    
    async function deleteteCrimes(){
		console.log('Borrando crimenes..');
		const res = await fetch("/api/v1/crime-rate-stats",{
			method: "DELETE"
		}).then(function(res){
			userMsg = "Todos los datos han sido borrados.";
			getRPCS();
		});
	}
</script>
<main>
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
        </tbody>    
    </table>
</main>

