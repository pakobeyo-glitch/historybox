const canvas = document.getElementById("mapCanvas");

const ctx = canvas.getContext("2d");

// =====================================================
// NASTAVENIE MAPY
// =====================================================

const TILE_SIZE = 32;

const MAP_WIDTH = 80;

const MAP_HEIGHT = 50;

canvas.width =
MAP_WIDTH * TILE_SIZE;

canvas.height =
MAP_HEIGHT * TILE_SIZE;

// =====================================================
// TERÉNY
// =====================================================

const terrainColors = {

```
sea: "#3498db",

lowland: "#7ec850",

forest: "#267326",

desert: "#e8c766",

mountains: "#777777",

high_mountains: "#eeeeee",

tundra: "#b7d7e8",

river: "#2471a3"
```

};

const terrainNames = {

```
sea: "More",

lowland: "Nížina",

forest: "Les",

desert: "Púšť",

mountains: "Hory",

high_mountains: "Veľhory",

tundra: "Tundra",

river: "Rieka"
```

};

// =====================================================
// VYTVORENIE SVETA
// =====================================================

let world = [];

for (let y = 0; y < MAP_HEIGHT; y++) {

```
let row = [];

for (let x = 0; x < MAP_WIDTH; x++) {

    row.push({

        terrain: "lowland",

        area: null,

        country: null

    });

}

world.push(row);
```

}

// =====================================================
// OBLASTI
// =====================================================

let areas = {};

let currentArea = null;

// =====================================================
// KRAJINY
// =====================================================

let countries = {};

let selectedCountry = null;

// =====================================================
// AKTUÁLNA VRSTVA
// =====================================================

let currentLayer = "terrain";

// =====================================================
// NÁSTROJ
// =====================================================

let currentTool = "brush";

let selectedTerrain = "lowland";

let brushSize = 1;

// =====================================================
// ZOOM A POLOHA MAPY
// =====================================================

let zoom = 1;

let offsetX = 50;

let offsetY = 50;

// =====================================================
// KRESLENIE MAPY
// =====================================================

function drawMap() {

```
ctx.setTransform(
    zoom,
    0,
    0,
    zoom,
    offsetX,
    offsetY
);

ctx.clearRect(
    -offsetX / zoom,
    -offsetY / zoom,
    canvas.width / zoom,
    canvas.height / zoom
);


// ---------------------------------------------
// TILES
// ---------------------------------------------

for (let y = 0; y < MAP_HEIGHT; y++) {

    for (let x = 0; x < MAP_WIDTH; x++) {

        const tile =
            world[y][x];


        // TERÉN

        ctx.fillStyle =
            terrainColors[tile.terrain];

        ctx.fillRect(

            x * TILE_SIZE,

            y * TILE_SIZE,

            TILE_SIZE,

            TILE_SIZE

        );


        // -------------------------------------
        // KRAJINA
        // -------------------------------------

        if (
            currentLayer === "country" &&
            tile.country !== null &&
            countries[tile.country]
        ) {

            ctx.fillStyle =
                countries[tile.country].color;

            ctx.globalAlpha = 0.65;

            ctx.fillRect(

                x * TILE_SIZE,

                y * TILE_SIZE,

                TILE_SIZE,

                TILE_SIZE

            );

            ctx.globalAlpha = 1;

        }


        // -------------------------------------
        // MRIEŽKA
        // -------------------------------------

        ctx.strokeStyle =
            "rgba(0,0,0,0.15)";

        ctx.strokeRect(

            x * TILE_SIZE,

            y * TILE_SIZE,

            TILE_SIZE,

            TILE_SIZE

        );

    }

}


// =================================================
// HRANICE OBLASTÍ
// =================================================

if (
    currentLayer === "area" ||
    currentLayer === "country"
) {

    drawAreaBorders();

}


// =================================================
// NÁZVY OBLASTÍ
// =================================================

if (
    currentLayer === "area" ||
    currentLayer === "country"
) {

    drawAreaNames();

}


ctx.setTransform(1, 0, 0, 1, 0, 0);
```

}

// =====================================================
// HRANICE OBLASTÍ
// =====================================================

function drawAreaBorders() {

```
ctx.lineWidth =
    3 / zoom;

ctx.strokeStyle =
    "#ff8c00";


for (let y = 0; y < MAP_HEIGHT; y++) {

    for (let x = 0; x < MAP_WIDTH; x++) {

        const area =
            world[y][x].area;


        if (!area) {
            continue;
        }


        // ĽAVO

        if (
            x === 0 ||
            world[y][x - 1].area !== area
        ) {

            drawLine(

                x * TILE_SIZE,
                y * TILE_SIZE,

                x * TILE_SIZE,
                (y + 1) * TILE_SIZE

            );

        }


        // VPRAVO

        if (
            x === MAP_WIDTH - 1 ||
            world[y][x + 1].area !== area
        ) {

            drawLine(

                (x + 1) * TILE_SIZE,
                y * TILE_SIZE,

                (x + 1) * TILE_SIZE,
                (y + 1) * TILE_SIZE

            );

        }


        // HORE

        if (
            y === 0 ||
            world[y - 1][x].area !== area
        ) {

            drawLine(

                x * TILE_SIZE,
                y * TILE_SIZE,

                (x + 1) * TILE_SIZE,
                y * TILE_SIZE

            );

        }


        // DOLE

        if (
            y === MAP_HEIGHT - 1 ||
            world[y + 1][x].area !== area
        ) {

            drawLine(

                x * TILE_SIZE,
                (y + 1) * TILE_SIZE,

                (x + 1) * TILE_SIZE,
                (y + 1) * TILE_SIZE

            );

        }

    }

}
```

}

// =====================================================
// POMOCNÁ ČIARA
// =====================================================

function drawLine(x1, y1, x2, y2) {

```
ctx.beginPath();

ctx.moveTo(x1, y1);

ctx.lineTo(x2, y2);

ctx.stroke();
```

}

// =====================================================
// NÁZVY OBLASTÍ
// =====================================================

function drawAreaNames() {

```
const centers = {};


for (let y = 0; y < MAP_HEIGHT; y++) {

    for (let x = 0; x < MAP_WIDTH; x++) {

        const areaId =
            world[y][x].area;


        if (!areaId) {
            continue;
        }


        if (!centers[areaId]) {

            centers[areaId] = {

                x: 0,
                y: 0,
                count: 0

            };

        }


        centers[areaId].x += x;

        centers[areaId].y += y;

        centers[areaId].count++;

    }

}


ctx.textAlign = "center";

ctx.textBaseline = "middle";

ctx.font =
    `${14 / zoom}px Arial`;


for (
    const areaId in centers
) {

    const center =
        centers[areaId];


    const area =
        areas[areaId];


    if (!area) {
        continue;
    }


    const x =
        center.x /
        center.count *
        TILE_SIZE +
        TILE_SIZE / 2;


    const y =
        center.y /
        center.count *
        TILE_SIZE +
        TILE_SIZE / 2;


    ctx.fillStyle =
        "rgba(0,0,0,0.75)";


    ctx.fillText(

        area.name,

        x + 1,
        y + 1

    );


    ctx.fillStyle =
        "white";


    ctx.fillText(

        area.name,

        x,
        y

    );

}
```

}

// =====================================================
// VÝBER TERÉNU
// =====================================================

document
.querySelectorAll(".terrain-button")
.forEach(button => {

```
    button.addEventListener(
        "click",
        () => {

            selectedTerrain =
                button.dataset.terrain;

            currentLayer =
                "terrain";

            updateInterface();

        }
    );

});
```

// =====================================================
// VRSTVY
// =====================================================

document
.getElementById("terrainLayer")
.onclick = () => {

```
    currentLayer = "terrain";

    updateInterface();

};
```

document
.getElementById("areaLayer")
.onclick = () => {

```
    currentLayer = "area";

    updateInterface();

};
```

document
.getElementById("countryLayer")
.onclick = () => {

```
    currentLayer = "country";

    updateInterface();

};
```

// =====================================================
// NÁSTROJE
// =====================================================

document
.getElementById("brushButton")
.onclick = () => {

```
    currentTool = "brush";

    updateInterface();

};
```

document
.getElementById("eraserButton")
.onclick = () => {

```
    currentTool = "eraser";

    updateInterface();

};
```

// =====================================================
// VEĽKOSŤ ŠTETCA
// =====================================================

document
.getElementById("brushSize")
.addEventListener(
"input",
event => {

```
        brushSize =
            Number(event.target.value);

        document
            .getElementById(
                "brushSizeValue"
            )
            .innerText =
            brushSize;

    }
);
```

// =====================================================
// MAĽOVANIE
// =====================================================

let isPainting = false;

canvas.addEventListener(
"mousedown",
event => {

```
    if (event.button === 0) {

        isPainting = true;

        paint(event);

    }

}
```

);

canvas.addEventListener(
"mousemove",
event => {

```
    if (isPainting) {

        paint(event);

    }

}
```

);

window.addEventListener(
"mouseup",
() => {

```
    isPainting = false;

}
```

);

// =====================================================
// KRESLENIE
// =====================================================

function paint(event) {

```
const position =
    getMousePosition(event);


if (!position) {
    return;
}


const x =
    position.x;


const y =
    position.y;


// ---------------------------------------------
// VRSTVA TERÉNU
// ---------------------------------------------

if (
    currentLayer === "terrain"
) {

    paintTerrain(x, y);

}


// ---------------------------------------------
// VRSTVA OBLASTÍ
// ---------------------------------------------

else if (
    currentLayer === "area"
) {

    paintArea(x, y);

}


// ---------------------------------------------
// VRSTVA KRAJÍN
// ---------------------------------------------

else if (
    currentLayer === "country"
) {

    assignCountryToArea(x, y);

}


drawMap();
```

}

// =====================================================
// POZÍCIA MYŠI
// =====================================================

function getMousePosition(event) {

```
const rect =
    canvas.getBoundingClientRect();


const mouseX =
    event.clientX -
    rect.left;


const mouseY =
    event.clientY -
    rect.top;


const x =
    Math.floor(
        (mouseX - offsetX) /
        zoom /
        TILE_SIZE
    );


const y =
    Math.floor(
        (mouseY - offsetY) /
        zoom /
        TILE_SIZE
    );


if (
    x < 0 ||
    x >= MAP_WIDTH ||
    y < 0 ||
    y >= MAP_HEIGHT
) {

    return null;

}


return {
    x,
    y
};
```

}

// =====================================================
// MAĽOVANIE TERÉNU
// =====================================================

function paintTerrain(x, y) {

```
const radius =
    Math.floor(brushSize / 2);


for (
    let dy = -radius;
    dy <= radius;
    dy++
) {

    for (
        let dx = -radius;
        dx <= radius;
        dx++
    ) {

        const tx =
            x + dx;

        const ty =
            y + dy;


        if (
            tx < 0 ||
            tx >= MAP_WIDTH ||
            ty < 0 ||
            ty >= MAP_HEIGHT
        ) {

            continue;

        }


        if (
            currentTool === "eraser"
        ) {

            world[ty][tx].terrain =
                "lowland";

        }

        else {

            world[ty][tx].terrain =
                selectedTerrain;

        }

    }

}
```

}

// =====================================================
// MAĽOVANIE OBLASTI
// =====================================================

function paintArea(x, y) {

```
if (!currentArea) {

    alert(
        "Najprv vytvor novú oblasť."
    );

    return;

}


const tile =
    world[y][x];


// ak už tile patrí do tejto oblasti,
// nič nerobíme

if (
    tile.area === currentArea
) {

    return;

}


tile.area =
    currentArea;


if (
    !areas[currentArea].tiles
        .some(
            t =>
                t[0] === x &&
                t[1] === y
        )
) {

    areas[currentArea].tiles.push(
        [x, y]
    );

}
```

}

// =====================================================
// KRAJINA DOSTANE OBLASŤ
// =====================================================

function assignCountryToArea(x, y) {

```
if (!selectedCountry) {

    alert(
        "Najprv vytvor alebo vyber krajinu."
    );

    return;

}


const areaId =
    world[y][x].area;


if (!areaId) {

    alert(
        "Tento tile ešte nepatrí do žiadnej oblasti."
    );

    return;

}


const country =
    countries[selectedCountry];


if (
    !country.areas.includes(areaId)
) {

    country.areas.push(
        areaId
    );

}


// CELÁ OBLASŤ

for (
    const [tx, ty]
    of areas[areaId].tiles
) {

    world[ty][tx].country =
        selectedCountry;

}


updateCountryList();
```

}

// =====================================================
// NOVÁ OBLASŤ
// =====================================================

document
.getElementById("newAreaButton")
.onclick = () => {

```
    const name =
        prompt(
            "Názov novej oblasti:"
        );


    if (!name) {
        return;
    }


    const id =
        "area_" +
        Date.now();


    areas[id] = {

        name: name,

        tiles: []

    };


    currentArea = id;


    currentLayer =
        "area";


    updateAreaList();

    updateInterface();


    alert(
        "Oblasť '" +
        name +
        "' bola vytvorená.\n\n" +
        "Teraz ju namaľuj na mape."
    );

};
```

// =====================================================
// NOVÁ KRAJINA
// =====================================================

document
.getElementById("newCountryButton")
.onclick = () => {

```
    const name =
        prompt(
            "Názov novej krajiny:"
        );


    if (!name) {
        return;
    }


    const color =
        prompt(
            "Farba krajiny:",
            "#ff4444"
        );


    const id =
        "country_" +
        Date.now();


    countries[id] = {

        name: name,

        color: color,

        areas: []

    };


    selectedCountry =
        id;


    currentLayer =
        "country";


    updateCountryList();

    updateInterface();


    alert(
        "Krajina '" +
        name +
        "' bola vytvorená.\n\n" +
        "Teraz klikaj na oblasti, ktoré jej patria."
    );

};
```

// =====================================================
// ZOZNAM OBLASTÍ
// =====================================================

function updateAreaList() {

```
const list =
    document.getElementById(
        "areaList"
    );


list.innerHTML = "";


for (
    const id in areas
) {

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "area-item";


    div.innerText =
        areas[id].name;


    div.onclick = () => {

        currentArea = id;

        currentLayer =
            "area";

        updateInterface();

    };


    list.appendChild(div);

}
```

}

// =====================================================
// ZOZNAM KRAJÍN
// =====================================================

function updateCountryList() {

```
const list =
    document.getElementById(
        "countryList"
    );


list.innerHTML = "";


for (
    const id in countries
) {

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "country-item";


    div.innerHTML = `

        <span
            class="country-color"
            style="background:
                ${countries[id].color}">
        </span>

        ${countries[id].name}

    `;


    div.onclick = () => {

        selectedCountry =
            id;

        currentLayer =
            "country";

        updateInterface();

    };


    list.appendChild(div);

}
```

}

// =====================================================
// AKTUALIZÁCIA ROZHRANIA
// =====================================================

function updateInterface() {

```
document
    .querySelectorAll(
        ".layer-button"
    )
    .forEach(button => {

        button.classList.remove(
            "active"
        );

    });


document
    .getElementById(
        currentLayer + "Layer"
    )
    .classList.add(
        "active"
    );


const terrainPanel =
    document.getElementById(
        "terrainPanel"
    );


const areaPanel =
    document.getElementById(
        "areaPanel"
    );


const countryPanel =
    document.getElementById(
        "countryPanel"
    );


terrainPanel.classList.toggle(
    "hidden",
    currentLayer !== "terrain"
);


areaPanel.classList.toggle(
    "hidden",
    currentLayer !== "area"
);


countryPanel.classList.toggle(
    "hidden",
    currentLayer !== "country"
);


document
    .getElementById(
        "modeInfo"
    )
    .innerText =
    "Vrstva: " +
    currentLayer.toUpperCase();


document
    .getElementById(
        "toolInfo"
    )
    .innerText =
    "Nástroj: " +
    (
        currentTool === "brush"
            ? "Štetec"
            : "Guma"
    );


drawMap();
```

}

// =====================================================
// ZOOM
// =====================================================

document
.getElementById("zoomIn")
.onclick = () => {

```
    zoom *= 1.2;

    zoom =
        Math.min(
            zoom,
            5
        );

    updateZoomText();

    drawMap();

};
```

document
.getElementById("zoomOut")
.onclick = () => {

```
    zoom /= 1.2;

    zoom =
        Math.max(
            zoom,
            0.3
        );

    updateZoomText();

    drawMap();

};
```

function updateZoomText() {

```
document
    .getElementById(
        "zoomValue"
    )
    .innerText =
    Math.round(
        zoom * 100
    ) + "%";
```

}

// =====================================================
// KOLIESKO MYŠI = ZOOM
// =====================================================

canvas.addEventListener(
"wheel",
event => {

```
    event.preventDefault();


    if (event.deltaY < 0) {

        zoom *= 1.1;

    }

    else {

        zoom /= 1.1;

    }


    zoom =
        Math.max(
            0.3,
            Math.min(
                zoom,
                5
            )
        );


    updateZoomText();

    drawMap();

},
{
    passive: false
}
```

);

// =====================================================
// POSÚVANIE MAPY
// =====================================================

let dragging = false;

let dragStartX = 0;

let dragStartY = 0;

canvas.addEventListener(
"contextmenu",
event => {

```
    event.preventDefault();

}
```

);

canvas.addEventListener(
"mousedown",
event => {

```
    if (event.button === 2) {

        dragging = true;

        dragStartX =
            event.clientX -
            offsetX;

        dragStartY =
            event.clientY -
            offsetY;

    }

}
```

);

window.addEventListener(
"mouseup",
event => {

```
    if (event.button === 2) {

        dragging = false;

    }

}
```

);

canvas.addEventListener(
"mousemove",
event => {

```
    if (!dragging) {
        return;
    }


    offsetX =
        event.clientX -
        dragStartX;


    offsetY =
        event.clientY -
        dragStartY;


    drawMap();

}
```

);

// =====================================================
// CELÁ MAPA
// =====================================================

document
.getElementById("resetView")
.onclick = () => {

```
    const container =
        document.querySelector(
            ".map-container"
        );


    const scaleX =
        container.clientWidth /
        canvas.width;


    const scaleY =
        container.clientHeight /
        canvas.height;


    zoom =
        Math.min(
            scaleX,
            scaleY
        ) * 0.9;


    offsetX =
        (
            container.clientWidth -
            canvas.width * zoom
        ) / 2;


    offsetY =
        (
            container.clientHeight -
            canvas.height * zoom
        ) / 2;


    updateZoomText();

    drawMap();

};
```

// =====================================================
// ULOŽENIE
// =====================================================

document
.getElementById("saveButton")
.onclick = () => {

```
    const saveData = {

        world: world,

        areas: areas,

        countries: countries

    };


    const json =
        JSON.stringify(
            saveData
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href = url;

    a.download =
        "moj-svet.json";

    a.click();


    URL.revokeObjectURL(url);

};
```

// =====================================================
// NAČÍTANIE
// =====================================================

document
.getElementById("loadButton")
.onclick = () => {

```
    const input =
        document.createElement(
            "input"
        );


    input.type = "file";

    input.accept =
        ".json";


    input.onchange =
        event => {

            const file =
                event.target.files[0];


            const reader =
                new FileReader();


            reader.onload =
                e => {

                    const data =
                        JSON.parse(
                            e.target.result
                        );


                    world =
                        data.world ||
                        world;


                    areas =
                        data.areas ||
                        {};


                    countries =
                        data.countries ||
                        {};


                    currentArea =
                        null;


                    selectedCountry =
                        null;


                    updateAreaList();

                    updateCountryList();

                    drawMap();

                };


            reader.readAsText(file);

        };


    input.click();

};
```

// =====================================================
// VYMAZANIE MAPY
// =====================================================

document
.getElementById("clearButton")
.onclick = () => {

```
    const answer =
        confirm(
            "Naozaj chceš vymazať celý svet?"
        );


    if (!answer) {
        return;
    }


    for (
        let y = 0;
        y < MAP_HEIGHT;
        y++
    ) {

        for (
            let x = 0;
            x < MAP_WIDTH;
            x++
        ) {

            world[y][x] = {

                terrain: "lowland",

                area: null,

                country: null

            };

        }

    }


    areas = {};

    countries = {};

    currentArea = null;

    selectedCountry = null;


    updateAreaList();

    updateCountryList();

    drawMap();

};
```

// =====================================================
// ŠTART
// =====================================================

updateAreaList();

updateCountryList();

updateZoomText();

updateInterface();

drawMap();

drawMap();

updateStatus();
