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


    let offset = 0;
	let limit = 5;
	let numTotal;
	let numFiltered;
    let userMsg = "";
    
	onMount(getEfis);

	async function getEfis() {

		console.log("Fetching contacts...");
		const res = await fetch("/api/v1/economic-freedom-indexes/");

		if (res.ok) {
			console.log("Ok:");
			const json = await res.json();
			efis = json;
            console.log("Recibidos " + efis.length + " efis.");
            numTotal= efis.length;
		} else {
            userMsg = "No se han encontrado datos."
			console.log("ERROR!");
		}
	}

	async function insertaEfi() {

		console.log("Insertando Efi" + JSON.stringify(newContact));

		const res = await fetch("/api/v1/economic-freedom-indexes/", {
			method: "POST",
			body: JSON.stringify(newContact),
			headers: {
				"Content-Type": "application/json"
			}
		}).then(function (res) {
			getEfis();
		});

	}
	async function deleteEfi(country,year) {
		const res = await fetch("/api/v1/economic-freedom-indexes/" + country + "/" + year, {
			method: "DELETE"
		}).then(function (res) {
			getEfis();
		});
	}
</script>

<main>

	{#await efis}
		Cargando Efis...
	{:then efis}
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
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><input bind:value="{newEfi.country}"></td>
					<td><input bind:value="{newEfi.year}"></td>
                    <td><input bind:value="{newEfi.efiindex}"></td>
					<td><input bind:value="{newEfi.efigovint}"></td>
                    <td><input bind:value="{newEfi.propright}"></td>
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
						<td><input bind:value="{newEfi.country}"></td>
                        <td>{newEfi.year}</td>
                        <td>{newEfi.efiindex}</td>
                        <td>{newEfi.efigovint}</td>
                        <td>{newEfi.propright}</td>
                        <td>{newEfi.efijudefct}</td>
                        <td>{newEfi.efitaxburden}</td>
                        <td>{newEfi.efigovspend}</td>
                        <td>{newEfi.efisicalhealth}</td>
                        <td>{newEfi.efibusfreed}</td>
                        <td>{newEfi.efilabfreed}</td>
                        <td>{newEfi.efimonfreed}</td>
                        <td>{newEfi.efitradefreed}</td>
                        <td>{newEfi.efiinvfreed}</td>
                        <td>{newEfi.efifinfred}</td>
						<td><Button outline color="danger" on:click="{deleteEfi(efi.country,efi.year)}">Borrar</Button></td>
					</tr>
				{/each}
			</tbody>
		</Table>
	{/await}


</main>