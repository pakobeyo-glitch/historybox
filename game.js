const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");


// --------------------------------
// VEĽKOSŤ MAPY
// --------------------------------

const TILE_SIZE = 20;

const MAP_WIDTH = 50;
const MAP_HEIGHT = 35;

canvas.width = MAP_WIDTH * TILE_SIZE;
canvas.height = MAP_HEIGHT * TILE_SIZE;


// --------------------------------
// TERÉNY
// --------------------------------

const terrainColors = {

    sea: "#3498db",

    lowland: "#7ec850",

    forest: "#267326",

    desert: "#e8c766",

    mountains: "#777777",

    high_mountains: "#eeeeee",

    tundra: "#b7d7e8",

    river: "#1e90ff"
};


// --------------------------------
// MAPA
// --------------------------------

let world = [];

for (let y = 0; y < MAP_HEIGHT; y++) {

    let row = [];

    for (let x = 0; x < MAP_WIDTH; x++) {

        row.push({

            terrain: "lowland",

            area: null,

            country: null

        });

    }

    world.push(row);
}


// --------------------------------
// OBLASTI
// --------------------------------

let areas = {};


// --------------------------------
// KRAJINY
// --------------------------------

let countries = {};


// --------------------------------
// AKTUÁLNY REŽIM
// --------------------------------

let mode = "terrain";

let selectedTerrain = "lowland";


// --------------------------------
// VÝBER TERÉNU
// --------------------------------

function selectTerrain(terrain) {

    selectedTerrain = terrain;

    mode = "terrain";

    updateStatus();

}


// --------------------------------
// ZMENA REŽIMU
// --------------------------------

function setMode(newMode) {

    mode = newMode;

    updateStatus();

}


// --------------------------------
// TEXT STAVU
// --------------------------------

function updateStatus() {

    document.getElementById("status").innerText =
        "Režim: " + mode +
        " | Terén: " + selectedTerrain;

}


// --------------------------------
// VYKRESLENIE MAPY
// --------------------------------

function drawMap() {

    for (let y = 0; y < MAP_HEIGHT; y++) {

        for (let x = 0; x < MAP_WIDTH; x++) {

            const tile = world[y][x];

            ctx.fillStyle =
                terrainColors[tile.terrain];

            ctx.fillRect(
                x * TILE_SIZE,
                y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );


            // hranice tile

            ctx.strokeStyle = "#444";

            ctx.strokeRect(
                x * TILE_SIZE,
                y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );


            // ak má tile krajinu

            if (tile.country !== null) {

                ctx.fillStyle =
                    countries[tile.country].color;

                ctx.globalAlpha = 0.45;

                ctx.fillRect(
                    x * TILE_SIZE,
                    y * TILE_SIZE,
                    TILE_SIZE,
                    TILE_SIZE
                );

                ctx.globalAlpha = 1;

            }

        }

    }

}


// --------------------------------
// KLIKNUTIE NA MAPU
// --------------------------------

canvas.addEventListener(
    "mousedown",
    function(event) {

        paint(event);

        canvas.isPainting = true;

    }
);


canvas.addEventListener(
    "mouseup",
    function() {

        canvas.isPainting = false;

    }
);


canvas.addEventListener(
    "mousemove",
    function(event) {

        if (canvas.isPainting) {

            paint(event);

        }

    }
);


// --------------------------------
// MAĽOVANIE
// --------------------------------

function paint(event) {

    const rect =
        canvas.getBoundingClientRect();


    const x =
        Math.floor(
            (event.clientX - rect.left)
            / TILE_SIZE
        );


    const y =
        Math.floor(
            (event.clientY - rect.top)
            / TILE_SIZE
        );


    if (
        x < 0 ||
        x >= MAP_WIDTH ||
        y < 0 ||
        y >= MAP_HEIGHT
    ) {

        return;

    }


    // TERÉN

    if (mode === "terrain") {

        world[y][x].terrain =
            selectedTerrain;

    }


    // OBLASŤ

    if (mode === "area") {

        if (currentArea !== null) {

            world[y][x].area =
                currentArea;

            areas[currentArea].tiles.push([x, y]);

        }

    }


    // KRAJINA

    if (mode === "country") {

        if (selectedCountry !== null) {

            world[y][x].country =
                selectedCountry;

        }

    }


    drawMap();

}


// --------------------------------
// VYTVORENIE OBLASTI
// --------------------------------

let currentArea = null;

function createArea() {

    const name =
        prompt("Názov oblasti:");

    if (!name) {
        return;
    }


    const id =
        "area_" +
        Object.keys(areas).length;


    areas[id] = {

        name: name,

        tiles: []

    };


    currentArea = id;

    mode = "area";

    updateStatus();


    alert(
        "Oblasť '" +
        name +
        "' vytvorená.\n\n" +
        "Teraz ju namaľuj na mape."
    );

}


// --------------------------------
// VYTVORENIE KRAJINY
// --------------------------------

let selectedCountry = null;

function createCountry() {

    const name =
        prompt("Názov krajiny:");

    if (!name) {
        return;
    }


    const color =
        prompt(
            "Farba krajiny (napr. #ff0000):",
            "#ff0000"
        );


    const id =
        "country_" +
        Object.keys(countries).length;


    countries[id] = {

        name: name,

        color: color,

        areas: []

    };


    selectedCountry = id;

    mode = "country";

    updateStatus();


    alert(
        "Krajina '" +
        name +
        "' vytvorená.\n\n" +
        "Teraz klikaj na jej územie."
    );

}


// --------------------------------
// SPUSTENIE
// --------------------------------

drawMap();

updateStatus();
