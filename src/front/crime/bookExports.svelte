<script>
import Button from "sveltestrap/src/Button.svelte";
 async function cargadatos() {
     console.log("cargando datos...");
    const resData = await fetch("/api/v1/books-exports");
    console.log(resData.status);
    let data = await resData.json();
    let data_ploty=[];
    let countrys=[];
    let books=[];
    let editorials=[];
    let graph_sectors=[];
    data.forEach(element => {
        countrys.push(element.country);
        books.push(element["exp_book"]);
        editorials.push(element["exp_editorial"]);
        graph_sectors.push(element["exp_graphic_sector"]);
    });
    console.log(books,editorials,graph_sectors);
    data_ploty.push({
        histfunc: "sum",
        y: books,
        x: countrys,
        type: "histogram",
        name: "Libros Exportados"
    });
    data_ploty.push({
        histfunc: "sum",
        y: editorials,
        x: countrys,
        type: "histogram",
        name: "Exportaciones de editoriales"
    });
    data_ploty.push({
        histfunc: "sum",
        y: graph_sectors,
        x: countrys,
        type: "histogram",
        name: "Exportaciones de sectores gráficos"
    });
    Plotly.newPlot('myDiv', data_ploty);
}
</script>
<svelte:head>
<script src='https://cdn.plot.ly/plotly-latest.min.js' on:click="{cargadatos}"></script>
</svelte:head>
<main>
<h1>Exportaciones de libros</h1>
<div>
En esta gráfica se representan las exportaciones de libros por país:
<br>
<div id="myDiv"></div>
</div>
</main>