<script>
import {onMount} from "svelte";
import Table from "sveltestrap/src/Table.svelte";
import Button from "sveltestrap/src/Button.svelte";

let efis=[];
let newEfi={
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
onMount(getEfis);

</script>


<main>


</main>