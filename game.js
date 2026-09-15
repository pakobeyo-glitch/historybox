const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 32;
const MAP_WIDTH = 200;
const MAP_HEIGHT = 200;

let zoom = 1;
let offsetX = 20;
let offsetY = 20;


// ======================================================
// TERÉN
// ======================================================

const terrainTypes = {
    desert: {
        name: "Púšť",
        color: "#d8c27a"
    },
    mountain: {
        name: "Hory",
        color: "#777777"
    },
    highMountain: {
        name: "Vysoké hory",
        color: "#eeeeee"
    },
    lowland: {
        name: "Nížina",
        color: "#8dbb65"
    },
    tundra: {
        name: "Tundra",
        color: "#a9c4bd"
    },
    river: {
        name: "Rieka",
        color: "#4d9ed8"
    },
    sea: {
        name: "More",
        color: "#377bb5"
    },
    forest: {
        name: "Les",
        color: "#3e7942"
    }
};


// ======================================================
// SVET
// ======================================================

let world = [];

for (let y = 0; y < MAP_HEIGHT; y++) {
    world[y] = [];

    for (let x = 0; x < MAP_WIDTH; x++) {
        world[y][x] = {
            terrain: "lowland",
            area: null,
            country: null
        };
    }
}


// ======================================================
// OBLASTI / KRAJINY / MESTÁ
// ======================================================

let areas = {};
let countries = {};
let cities = {};

let selectedArea = null;
let selectedCountry = null;
let selectedCity = null;


// ======================================================
// NÁSTROJE
// ======================================================

let currentMode = "terrain";

let terrainTool = "brush";
let areaTool = "brush";
let infraTool = "cityPlace";

let terrainBrushSize = 1;
let areaBrushSize = 1;

let selectedTerrain = "lowland";

let mouseDown = false;
let isPanning = false;

let lastMouseX = 0;
let lastMouseY = 0;


// ======================================================
// CANVAS
// ======================================================

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    draw();
}

window.addEventListener("resize", resizeCanvas);


// ======================================================
// POMOCNÉ FUNKCIE
// ======================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


function screenToWorld(mouseX, mouseY) {
    const worldX = (mouseX - offsetX) / zoom;
    const worldY = (mouseY - offsetY) / zoom;

    return {
        x: Math.floor(worldX / TILE_SIZE),
        y: Math.floor(worldY / TILE_SIZE)
    };
}


function isInsideMap(x, y) {
    return (
        x >= 0 &&
        y >= 0 &&
        x < MAP_WIDTH &&
        y < MAP_HEIGHT
    );
}


// ======================================================
// KRESLENIE TERÉNU
// ======================================================

function drawTerrain() {
    const startX = Math.max(
        0,
        Math.floor((-offsetX) / (TILE_SIZE * zoom)) - 1
    );

    const startY = Math.max(
        0,
        Math.floor((-offsetY) / (TILE_SIZE * zoom)) - 1
    );

    const endX = Math.min(
        MAP_WIDTH,
        Math.ceil((canvas.width - offsetX) / (TILE_SIZE * zoom)) + 1
    );

    const endY = Math.min(
        MAP_HEIGHT,
        Math.ceil((canvas.height - offsetY) / (TILE_SIZE * zoom)) + 1
    );

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {

            const tile = world[y][x];
            const terrain = terrainTypes[tile.terrain];

            const px = offsetX + x * TILE_SIZE * zoom;
            const py = offsetY + y * TILE_SIZE * zoom;

            const size = TILE_SIZE * zoom;

            ctx.fillStyle = terrain.color;
            ctx.fillRect(px, py, size, size);
        }
    }
}


// ======================================================
// OBLASTI
// ======================================================

function getAreaColor() {
    return "#999999";
}


function drawAreas() {

    const startX = Math.max(
        0,
        Math.floor((-offsetX) / (TILE_SIZE * zoom)) - 1
    );

    const startY = Math.max(
        0,
        Math.floor((-offsetY) / (TILE_SIZE * zoom)) - 1
    );

    const endX = Math.min(
        MAP_WIDTH,
        Math.ceil((canvas.width - offsetX) / (TILE_SIZE * zoom)) + 1
    );

    const endY = Math.min(
        MAP_HEIGHT,
        Math.ceil((canvas.height - offsetY) / (TILE_SIZE * zoom)) + 1
    );


    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {

            const tile = world[y][x];

            if (!tile.area) {
                continue;
            }

            const px = offsetX + x * TILE_SIZE * zoom;
            const py = offsetY + y * TILE_SIZE * zoom;

            const size = TILE_SIZE * zoom;

            ctx.fillStyle = getAreaColor();

            ctx.fillRect(
                px,
                py,
                size,
                size
            );
        }
    }


    // Okraje oblastí
    ctx.lineWidth = Math.max(1, 2 * zoom);
    ctx.strokeStyle = "#f39c12";

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {

            const tile = world[y][x];

            if (!tile.area) {
                continue;
            }

            const px = offsetX + x * TILE_SIZE * zoom;
            const py = offsetY + y * TILE_SIZE * zoom;

            const size = TILE_SIZE * zoom;

            if (
                x === 0 ||
                world[y][x - 1].area !== tile.area
            ) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, py + size);
                ctx.stroke();
            }

            if (
                x === MAP_WIDTH - 1 ||
                world[y][x + 1].area !== tile.area
            ) {
                ctx.beginPath();
                ctx.moveTo(px + size, py);
                ctx.lineTo(px + size, py + size);
                ctx.stroke();
            }

            if (
                y === 0 ||
                world[y - 1][x].area !== tile.area
            ) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + size, py);
                ctx.stroke();
            }

            if (
                y === MAP_HEIGHT - 1 ||
                world[y + 1][x].area !== tile.area
            ) {
                ctx.beginPath();
                ctx.moveTo(px, py + size);
                ctx.lineTo(px + size, py + size);
                ctx.stroke();
            }
        }
    }


    // Názvy oblastí
    drawAreaNames();
}


function drawAreaNames() {

    for (const id in areas) {

        const area = areas[id];

        if (!area.tiles || area.tiles.length === 0) {
            continue;
        }

        let totalX = 0;
        let totalY = 0;

        for (const tile of area.tiles) {
            totalX += tile.x;
            totalY += tile.y;
        }

        const centerX = totalX / area.tiles.length;
        const centerY = totalY / area.tiles.length;

        const px =
            offsetX +
            (centerX + 0.5) *
            TILE_SIZE *
            zoom;

        const py =
            offsetY +
            (centerY + 0.5) *
            TILE_SIZE *
            zoom;


        ctx.save();

        ctx.font =
            `bold ${Math.max(10, 14 * zoom)}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "rgba(0,0,0,0.7)";

        ctx.fillText(
            area.name,
            px + 1,
            py + 1
        );

        ctx.fillStyle = "white";

        ctx.fillText(
            area.name,
            px,
            py
        );

        ctx.restore();
    }
}


// ======================================================
// KRAJINY
// ======================================================

function drawCountries() {

    const startX = Math.max(
        0,
        Math.floor((-offsetX) / (TILE_SIZE * zoom)) - 1
    );

    const startY = Math.max(
        0,
        Math.floor((-offsetY) / (TILE_SIZE * zoom)) - 1
    );

    const endX = Math.min(
        MAP_WIDTH,
        Math.ceil((canvas.width - offsetX) / (TILE_SIZE * zoom)) + 1
    );

    const endY = Math.min(
        MAP_HEIGHT,
        Math.ceil((canvas.height - offsetY) / (TILE_SIZE * zoom)) + 1
    );


    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {

            const tile = world[y][x];

            if (!tile.country) {
                continue;
            }

            const country = countries[tile.country];

            if (!country) {
                continue;
            }

            const px =
                offsetX +
                x * TILE_SIZE * zoom;

            const py =
                offsetY +
                y * TILE_SIZE * zoom;

            const size =
                TILE_SIZE * zoom;

            ctx.fillStyle =
                country.color;

            ctx.globalAlpha = 0.45;

            ctx.fillRect(
                px,
                py,
                size,
                size
            );

            ctx.globalAlpha = 1;
        }
    }


    drawCountryNames();
}


function drawCountryNames() {

    for (const id in countries) {

        const country = countries[id];

        let tiles = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {

            for (let x = 0; x < MAP_WIDTH; x++) {

                if (world[y][x].country === id) {

                    tiles.push({
                        x,
                        y
                    });
                }
            }
        }


        if (tiles.length === 0) {
            continue;
        }


        let totalX = 0;
        let totalY = 0;

        for (const tile of tiles) {
            totalX += tile.x;
            totalY += tile.y;
        }


        const centerX =
            totalX / tiles.length;

        const centerY =
            totalY / tiles.length;


        const px =
            offsetX +
            (centerX + 0.5) *
            TILE_SIZE *
            zoom;

        const py =
            offsetY +
            (centerY + 0.5) *
            TILE_SIZE *
            zoom;


        ctx.save();

        ctx.font =
            `bold ${Math.max(11, 16 * zoom)}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "rgba(0,0,0,0.75)";

        ctx.fillText(
            country.name,
            px + 1,
            py + 1
        );

        ctx.fillStyle = "white";

        ctx.fillText(
            country.name,
            px,
            py
        );

        ctx.restore();
    }
}


// ======================================================
// MESTÁ
// ======================================================

function drawCities() {

    for (const id in cities) {

        const city = cities[id];

        if (
            city.x === null ||
            city.y === null
        ) {
            continue;
        }

        const px =
            offsetX +
            (city.x + 0.5) *
            TILE_SIZE *
            zoom;

        const py =
            offsetY +
            (city.y + 0.5) *
            TILE_SIZE *
            zoom;


        // Červená bodka
        ctx.save();

        ctx.fillStyle = "red";

        ctx.beginPath();

        ctx.arc(
            px,
            py,
            Math.max(3, 5 * zoom),
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Názov mesta
        ctx.font =
            `bold ${Math.max(10, 13 * zoom)}px Arial`;

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "rgba(0,0,0,0.8)";

        ctx.fillText(
            city.name,
            px + 8 * zoom + 1,
            py + 1
        );

        ctx.fillStyle = "white";

        ctx.fillText(
            city.name,
            px + 8 * zoom,
            py
        );

        ctx.restore();
    }
}


// ======================================================
// MRIEŽKA
// ======================================================

function drawGrid() {

    if (zoom < 0.35) {
        return;
    }

    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;


    const startX = Math.max(
        0,
        Math.floor((-offsetX) / (TILE_SIZE * zoom))
    );

    const startY = Math.max(
        0,
        Math.floor((-offsetY) / (TILE_SIZE * zoom))
    );

    const endX = Math.min(
        MAP_WIDTH,
        Math.ceil((canvas.width - offsetX) / (TILE_SIZE * zoom))
    );

    const endY = Math.min(
        MAP_HEIGHT,
        Math.ceil((canvas.height - offsetY) / (TILE_SIZE * zoom))
    );


    for (let x = startX; x <= endX; x++) {

        const px =
            offsetX +
            x * TILE_SIZE * zoom;

        ctx.beginPath();

        ctx.moveTo(px, offsetY + startY * TILE_SIZE * zoom);
        ctx.lineTo(px, offsetY + endY * TILE_SIZE * zoom);

        ctx.stroke();
    }


    for (let y = startY; y <= endY; y++) {

        const py =
            offsetY +
            y * TILE_SIZE * zoom;

        ctx.beginPath();

        ctx.moveTo(offsetX + startX * TILE_SIZE * zoom, py);
        ctx.lineTo(offsetX + endX * TILE_SIZE * zoom, py);

        ctx.stroke();
    }
}


// ======================================================
// HLAVNÉ KRESLENIE
// ======================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawTerrain();

    drawAreas();

    drawCountries();

    drawCities();

    drawGrid();
}


// ======================================================
// TERÉN – ŠTETEC
// ======================================================

function paintTerrain(x, y) {

    const radius =
        Math.floor(terrainBrushSize / 2);


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

            const tx = x + dx;
            const ty = y + dy;

            if (!isInsideMap(tx, ty)) {
                continue;
            }


            if (terrainTool === "eraser") {

                world[ty][tx].terrain =
                    "lowland";

                continue;
            }


            world[ty][tx].terrain =
                selectedTerrain;


            // Oblasti sa nesmú nachádzať
            // na riekach ani na mori.
            if (
                selectedTerrain === "river" ||
                selectedTerrain === "sea"
            ) {

                removeTileFromArea(
                    tx,
                    ty
                );
            }
        }
    }


    updateAreaList();

    draw();
}


// ======================================================
// OBLASTI – POMOCNÉ
// ======================================================

function addTileToArea(
    areaId,
    x,
    y
) {

    if (!areas[areaId]) {
        return;
    }


    if (!areas[areaId].tiles) {
        areas[areaId].tiles = [];
    }


    const exists =
        areas[areaId].tiles.some(
            tile =>
                tile.x === x &&
                tile.y === y
        );


    if (!exists) {

        areas[areaId].tiles.push({
            x,
            y
        });
    }
}


function removeTileFromArea(
    x,
    y
) {

    const oldArea =
        world[y][x].area;

    if (!oldArea) {
        return;
    }


    if (areas[oldArea]) {

        areas[oldArea].tiles =
            areas[oldArea].tiles.filter(
                tile =>
                    !(
                        tile.x === x &&
                        tile.y === y
                    )
            );
    }


    world[y][x].area = null;
}


// ======================================================
// OBLASTI – MAĽOVANIE
// ======================================================

function paintArea(x, y) {

    const radius =
        Math.floor(areaBrushSize / 2);


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

            const tx = x + dx;
            const ty = y + dy;

            if (!isInsideMap(tx, ty)) {
                continue;
            }


            const tile =
                world[ty][tx];


            // Oblasti sa NESMÚ maľovať
            // na rieke ani na mori.
            if (
                areaTool === "brush" &&
                (
                    tile.terrain === "river" ||
                    tile.terrain === "sea"
                )
            ) {
                continue;
            }


            // Guma
            if (areaTool === "eraser") {

                removeTileFromArea(
                    tx,
                    ty
                );

                continue;
            }


            // Musí byť vybraná oblasť.
            if (!selectedArea) {
                continue;
            }


            // Ak už patrí do inej oblasti,
            // odstránime staré priradenie.
            if (
                tile.area &&
                tile.area !== selectedArea
            ) {

                removeTileFromArea(
                    tx,
                    ty
                );
            }


            tile.area =
                selectedArea;


            addTileToArea(
                selectedArea,
                tx,
                ty
            );
        }
    }


    updateAreaList();

    draw();
}


// ======================================================
// VYTVORENIE OBLASTI
// ======================================================

function createArea() {

    const name =
        prompt("Názov oblasti:");

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


    selectedArea = id;

    updateAreaList();

    draw();
}


// ======================================================
// ZOZNAM OBLASTÍ
// ======================================================

function updateAreaList() {

    const list =
        document.getElementById("areaList");

    if (!list) {
        return;
    }


    list.innerHTML = "";


    for (const id in areas) {

        const area =
            areas[id];


        const button =
            document.createElement("button");

        button.className =
            "list-item";


        if (id === selectedArea) {
            button.classList.add("selected");
        }


        button.textContent =
            area.name;


        button.addEventListener(
            "click",
            () => {

                selectedArea = id;

                updateAreaList();

                draw();
            }
        );


        list.appendChild(button);
    }
}


// ======================================================
// VYTVORENIE KRAJINY
// ======================================================

function randomCountryColor() {

    const colors = [
        "#e74c3c",
        "#3498db",
        "#2ecc71",
        "#9b59b6",
        "#f1c40f",
        "#e67e22",
        "#1abc9c",
        "#e84393",
        "#6c5ce7",
        "#00b894"
    ];


    return colors[
        Math.floor(
            Math.random() *
            colors.length
        )
    ];
}


function createCountry() {

    const name =
        prompt("Názov krajiny:");

    if (!name) {
        return;
    }


    const id =
        "country_" +
        Date.now();


    countries[id] = {
        name: name,
        color: randomCountryColor()
    };


    selectedCountry = id;

    updateCountryList();

    draw();
}


// ======================================================
// ZOZNAM KRAJÍN
// ======================================================

function updateCountryList() {

    const list =
        document.getElementById("countryList");

    if (!list) {
        return;
    }


    list.innerHTML = "";


    for (const id in countries) {

        const country =
            countries[id];


        const button =
            document.createElement("button");

        button.className =
            "list-item";


        if (id === selectedCountry) {
            button.classList.add("selected");
        }


        button.textContent =
            country.name;


        button.style.borderLeft =
            `8px solid ${country.color}`;


        button.addEventListener(
            "click",
            () => {

                selectedCountry = id;

                updateCountryList();

                draw();
            }
        );


        list.appendChild(button);
    }
}


// ======================================================
// PRIRADENIE OBLASTI KRAJINE
// ======================================================

function assignAreaToCountry(
    areaId
) {

    if (!selectedCountry) {
        alert(
            "Najprv vyber krajinu."
        );

        return;
    }


    if (!areas[areaId]) {
        return;
    }


    const area =
        areas[areaId];


    for (const tile of area.tiles) {

        if (
            isInsideMap(
                tile.x,
                tile.y
            )
        ) {

            world[tile.y][tile.x].country =
                selectedCountry;
        }
    }


    draw();
}


// ======================================================
// VYTVORENIE MESTA
// ======================================================

function createCity() {

    const name =
        prompt("Názov mesta:");

    if (!name) {
        return;
    }


    const id =
        "city_" +
        Date.now();


    cities[id] = {
        name: name,
        x: null,
        y: null
    };


    selectedCity = id;

    infraTool = "cityPlace";

    updateInfrastructureTools();

    updateCityList();

    draw();
}


// ======================================================
// ZOZNAM MIEST
// ======================================================

function updateCityList() {

    const list =
        document.getElementById("cityList");

    if (!list) {
        return;
    }


    list.innerHTML = "";


    for (const id in cities) {

        const city =
            cities[id];


        const button =
            document.createElement("button");

        button.className =
            "list-item";


        if (id === selectedCity) {
            button.classList.add("selected");
        }


        let text =
            city.name;


        if (
            city.x !== null &&
            city.y !== null
        ) {

            text +=
                ` (${city.x}, ${city.y})`;
        }


        button.textContent =
            text;


        button.addEventListener(
            "click",
            () => {

                selectedCity = id;

                infraTool = "cityPlace";

                updateInfrastructureTools();

                updateCityList();

                draw();
            }
        );


        list.appendChild(button);
    }
}


// ======================================================
// UMIESTNENIE MESTA
// ======================================================

function placeCity(
    x,
    y
) {

    if (!selectedCity) {
        return;
    }


    if (!isInsideMap(x, y)) {
        return;
    }


    // Na jednom políčku môže byť
    // iba jedno mesto.
    for (const id in cities) {

        const city =
            cities[id];


        if (
            id !== selectedCity &&
            city.x === x &&
            city.y === y
        ) {

            alert(
                "Na tomto políčku už je mesto."
            );

            return;
        }
    }


    cities[selectedCity].x = x;
    cities[selectedCity].y = y;


    updateCityList();

    draw();
}


// ======================================================
// VYMAZANIE MESTA
// ======================================================

function eraseCity(
    x,
    y
) {

    for (const id in cities) {

        const city =
            cities[id];


        if (
            city.x === x &&
            city.y === y
        ) {

            delete cities[id];


            if (selectedCity === id) {
                selectedCity = null;
            }


            updateCityList();

            draw();

            return;
        }
    }
}


// ======================================================
// INFRAŠTRUKTÚRA – TLAČIDLÁ
// ======================================================

function updateInfrastructureTools() {

    const place =
        document.getElementById(
            "cityPlace"
        );

    const eraser =
        document.getElementById(
            "cityEraser"
        );


    if (place) {

        place.classList.toggle(
            "active",
            infraTool === "cityPlace"
        );
    }


    if (eraser) {

        eraser.classList.toggle(
            "active",
            infraTool === "cityEraser"
        );
    }
}


// ======================================================
// REŽIMY
// ======================================================

function setMode(mode) {

    currentMode = mode;


    const modes = [
        "terrain",
        "area",
        "country",
        "infrastructure"
    ];


    for (const m of modes) {

        const panel =
            document.getElementById(
                m + "Layer"
            );

        if (panel) {

            panel.classList.toggle(
                "hidden",
                m !== mode
            );
        }
    }


    const buttons = {
        terrain:
            document.getElementById(
                "terrainMode"
            ),

        area:
            document.getElementById(
                "areaMode"
            ),

        country:
            document.getElementById(
                "countryMode"
            ),

        infrastructure:
            document.getElementById(
                "infrastructureMode"
            )
    };


    for (const key in buttons) {

        if (buttons[key]) {

            buttons[key].classList.toggle(
                "active",
                key === mode
            );
        }
    }


    draw();
}


// ======================================================
// TERRAIN LIST
// ======================================================

function createTerrainList() {

    const list =
        document.getElementById(
            "terrainList"
        );

    if (!list) {
        return;
    }


    list.innerHTML = "";


    for (const id in terrainTypes) {

        const terrain =
            terrainTypes[id];


        const button =
            document.createElement("button");

        button.className =
            "terrain-item";


        if (id === selectedTerrain) {

            button.classList.add(
                "selected"
            );
        }


        button.textContent =
            terrain.name;


        button.style.backgroundColor =
            terrain.color;


        button.addEventListener(
            "click",
            () => {

                selectedTerrain = id;

                createTerrainList();

                draw();
            }
        );


        list.appendChild(button);
    }
}


// ======================================================
// TOOL BUTTONS
// ======================================================

function updateTerrainTools() {

    const brush =
        document.getElementById(
            "terrainBrush"
        );

    const eraser =
        document.getElementById(
            "terrainEraser"
        );


    if (brush) {

        brush.classList.toggle(
            "active",
            terrainTool === "brush"
        );
    }


    if (eraser) {

        eraser.classList.toggle(
            "active",
            terrainTool === "eraser"
        );
    }
}


function updateAreaTools() {

    const brush =
        document.getElementById(
            "areaBrush"
        );

    const eraser =
        document.getElementById(
            "areaEraser"
        );


    if (brush) {

        brush.classList.toggle(
            "active",
            areaTool === "brush"
        );
    }


    if (eraser) {

        eraser.classList.toggle(
            "active",
            areaTool === "eraser"
        );
    }
}


// ======================================================
// EVENTY – REŽIMY
// ======================================================

document
    .getElementById("terrainMode")
    ?.addEventListener(
        "click",
        () => setMode("terrain")
    );


document
    .getElementById("areaMode")
    ?.addEventListener(
        "click",
        () => setMode("area")
    );


document
    .getElementById("countryMode")
    ?.addEventListener(
        "click",
        () => setMode("country")
    );


document
    .getElementById("infrastructureMode")
    ?.addEventListener(
        "click",
        () => setMode("infrastructure")
    );


// ======================================================
// TERÉN – EVENTY
// ======================================================

document
    .getElementById("terrainBrush")
    ?.addEventListener(
        "click",
        () => {

            terrainTool = "brush";

            updateTerrainTools();
        }
    );


document
    .getElementById("terrainEraser")
    ?.addEventListener(
        "click",
        () => {

            terrainTool = "eraser";

            updateTerrainTools();
        }
    );


document
    .getElementById("terrainBrushSize")
    ?.addEventListener(
        "input",
        event => {

            terrainBrushSize =
                Number(
                    event.target.value
                );


            const value =
                document.getElementById(
                    "terrainBrushSizeValue"
                );


            if (value) {

                value.textContent =
                    terrainBrushSize;
            }
        }
    );


// ======================================================
// OBLASTI – EVENTY
// ======================================================

document
    .getElementById("createArea")
    ?.addEventListener(
        "click",
        createArea
    );


document
    .getElementById("areaBrush")
    ?.addEventListener(
        "click",
        () => {

            areaTool = "brush";

            updateAreaTools();
        }
    );


document
    .getElementById("areaEraser")
    ?.addEventListener(
        "click",
        () => {

            areaTool = "eraser";

            updateAreaTools();
        }
    );


document
    .getElementById("areaBrushSize")
    ?.addEventListener(
        "input",
        event => {

            areaBrushSize =
                Number(
                    event.target.value
                );


            const value =
                document.getElementById(
                    "areaBrushSizeValue"
                );


            if (value) {

                value.textContent =
                    areaBrushSize;
            }
        }
    );


// ======================================================
// KRAJINY – EVENTY
// ======================================================

document
    .getElementById("createCountry")
    ?.addEventListener(
        "click",
        createCountry
    );


// ======================================================
// MESTÁ – EVENTY
// ======================================================

document
    .getElementById("createCity")
    ?.addEventListener(
        "click",
        createCity
    );


document
    .getElementById("cityPlace")
    ?.addEventListener(
        "click",
        () => {

            infraTool =
                "cityPlace";

            updateInfrastructureTools();
        }
    );


document
    .getElementById("cityEraser")
    ?.addEventListener(
        "click",
        () => {

            infraTool =
                "cityEraser";

            updateInfrastructureTools();
        }
    );


// ======================================================
// MYŠ – DOWN
// ======================================================

canvas.addEventListener(
    "mousedown",
    event => {

        lastMouseX =
            event.clientX;

        lastMouseY =
            event.clientY;


        // Pravé tlačidlo = posúvanie mapy
        if (event.button === 2) {

            isPanning = true;

            canvas.classList.add(
                "panning"
            );

            return;
        }


        // Ľavé tlačidlo
        if (event.button !== 0) {
            return;
        }


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const pos =
            screenToWorld(
                mouseX,
                mouseY
            );


        if (
            !isInsideMap(
                pos.x,
                pos.y
            )
        ) {
            return;
        }


        // Infraštruktúra:
        // mestá sa umiestňujú iba kliknutím.
        if (
            currentMode ===
            "infrastructure"
        ) {

            if (
                infraTool ===
                "cityPlace"
            ) {

                placeCity(
                    pos.x,
                    pos.y
                );

            } else if (
                infraTool ===
                "cityEraser"
            ) {

                eraseCity(
                    pos.x,
                    pos.y
                );
            }


            return;
        }


        mouseDown = true;


        if (
            currentMode ===
            "terrain"
        ) {

            paintTerrain(
                pos.x,
                pos.y
            );

        } else if (
            currentMode ===
            "area"
        ) {

            paintArea(
                pos.x,
                pos.y
            );

        } else if (
            currentMode ===
            "country"
        ) {

            const tile =
                world[pos.y][pos.x];


            if (tile.area) {

                assignAreaToCountry(
                    tile.area
                );
            }
        }
    }
);


// ======================================================
// MYŠ – MOVE
// ======================================================

canvas.addEventListener(
    "mousemove",
    event => {

        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const pos =
            screenToWorld(
                mouseX,
                mouseY
            );


        updateCoordinates(
            pos.x,
            pos.y
        );


        // Posúvanie mapy
        if (isPanning) {

            const dx =
                event.clientX -
                lastMouseX;

            const dy =
                event.clientY -
                lastMouseY;


            offsetX += dx;
            offsetY += dy;


            lastMouseX =
                event.clientX;

            lastMouseY =
                event.clientY;


            draw();

            return;
        }


        // Maľovanie pri držaní ľavého tlačidla.
        // Mesto sa tu zámerne NEUMIESTŇUJE.
        if (!mouseDown) {
            return;
        }


        if (
            !isInsideMap(
                pos.x,
                pos.y
            )
        ) {
            return;
        }


        if (
            currentMode ===
            "terrain"
        ) {

            paintTerrain(
                pos.x,
                pos.y
            );

        } else if (
            currentMode ===
            "area"
        ) {

            paintArea(
                pos.x,
                pos.y
            );
        }
    }
);


// ======================================================
// MYŠ – UP
// ======================================================

canvas.addEventListener(
    "mouseup",
    event => {

        if (event.button === 0) {

            mouseDown = false;
        }


        if (event.button === 2) {

            isPanning = false;

            canvas.classList.remove(
                "panning"
            );
        }
    }
);


canvas.addEventListener(
    "mouseleave",
    () => {

        mouseDown = false;
    }
);


// ======================================================
// ZABRÁNENIE KONTEXTOVÉMU MENU
// ======================================================

canvas.addEventListener(
    "contextmenu",
    event => {
        event.preventDefault();
    }
);


// ======================================================
// SÚRADNICE
// ======================================================

function updateCoordinates(
    x,
    y
) {

    const element =
        document.getElementById(
            "coordinates"
        );


    if (!element) {
        return;
    }


    if (
        isInsideMap(x, y)
    ) {

        element.textContent =
            `X: ${x} | Y: ${y}`;

    } else {

        element.textContent =
            "X: - | Y: -";
    }
}


// ======================================================
// ZOOM
// ======================================================

function setZoom(
    newZoom,
    centerX = canvas.width / 2,
    centerY = canvas.height / 2
) {

    newZoom =
        clamp(
            newZoom,
            0.2,
            4
        );


    // Zachovanie bodu pod kurzorom
    const worldX =
        (centerX - offsetX) /
        zoom;

    const worldY =
        (centerY - offsetY) /
        zoom;


    zoom =
        newZoom;


    offsetX =
        centerX -
        worldX * zoom;

    offsetY =
        centerY -
        worldY * zoom;


    updateZoomDisplay();

    draw();
}


function updateZoomDisplay() {

    const element =
        document.getElementById(
            "zoomValue"
        );


    if (element) {

        element.textContent =
            `${Math.round(zoom * 100)}%`;
    }
}


// ======================================================
// ZOOM – MYŠ
// ======================================================

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const factor =
            event.deltaY < 0
                ? 1.1
                : 0.9;


        setZoom(
            zoom * factor,
            mouseX,
            mouseY
        );
    },
    {
        passive: false
    }
);


// ======================================================
// ZOOM – TLAČIDLÁ
// ======================================================

document
    .getElementById("zoomIn")
    ?.addEventListener(
        "click",
        () => {

            setZoom(
                zoom * 1.2
            );
        }
    );


document
    .getElementById("zoomOut")
    ?.addEventListener(
        "click",
        () => {

            setZoom(
                zoom / 1.2
            );
        }
    );


document
    .getElementById("resetZoom")
    ?.addEventListener(
        "click",
        () => {

            zoom = 1;

            offsetX = 20;
            offsetY = 20;

            updateZoomDisplay();

            draw();
        }
    );


// ======================================================
// ULOŽENIE SVETA
// ======================================================

document
    .getElementById("saveWorld")
    ?.addEventListener(
        "click",
        () => {

            const data = {

                mapWidth:
                    MAP_WIDTH,

                mapHeight:
                    MAP_HEIGHT,

                world:
                    world,

                areas:
                    areas,

                countries:
                    countries,

                cities:
                    cities
            };


            const json =
                JSON.stringify(
                    data,
                    null,
                    2
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


            const link =
                document.createElement(
                    "a"
                );


            link.href = url;

            link.download =
                "world.json";


            link.click();


            URL.revokeObjectURL(
                url
            );
        }
    );


// ======================================================
// NAČÍTANIE SVETA
// ======================================================

document
    .getElementById("loadWorld")
    ?.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                e => {

                    try {

                        const data =
                            JSON.parse(
                                e.target.result
                            );


                        if (
                            !data.world ||
                            !Array.isArray(
                                data.world
                            )
                        ) {

                            throw new Error(
                                "Neplatný súbor sveta."
                            );
                        }


                        world =
                            data.world;


                        areas =
                            data.areas || {};


                        countries =
                            data.countries || {};


                        cities =
                            data.cities || {};


                        selectedArea =
                            null;

                        selectedCountry =
                            null;

                        selectedCity =
                            null;


                        updateAreaList();

                        updateCountryList();

                        updateCityList();

                        draw();


                        alert(
                            "Svet bol načítaný."
                        );

                    } catch (error) {

                        console.error(
                            error
                        );


                        alert(
                            "Súbor sveta sa nepodarilo načítať."
                        );
                    }
                };


            reader.readAsText(file);
        }
    );


// ======================================================
// VYMAZANIE SVETA
// ======================================================

document
    .getElementById("clearWorld")
    ?.addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Naozaj chceš vymazať celý svet?"
                );


            if (!confirmed) {
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
                        terrain:
                            "lowland",

                        area:
                            null,

                        country:
                            null
                    };
                }
            }


            areas = {};
            countries = {};
            cities = {};


            selectedArea = null;
            selectedCountry = null;
            selectedCity = null;


            updateAreaList();

            updateCountryList();

            updateCityList();

            draw();
        }
    );


// ======================================================
// KLIKNUTIE NA OBLASŤ V REŽIME KRAJÍN
// ======================================================

canvas.addEventListener(
    "click",
    event => {

        if (
            currentMode !==
            "country"
        ) {
            return;
        }


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const pos =
            screenToWorld(
                mouseX,
                mouseY
            );


        if (
            !isInsideMap(
                pos.x,
                pos.y
            )
        ) {
            return;
        }


        const tile =
            world[pos.y][pos.x];


        if (!tile.area) {
            return;
        }


        assignAreaToCountry(
            tile.area
        );
    }
);


// ======================================================
// INICIALIZÁCIA
// ======================================================

createTerrainList();

updateAreaList();

updateCountryList();

updateCityList();

updateTerrainTools();

updateAreaTools();

updateInfrastructureTools();

updateZoomDisplay();

resizeCanvas();

draw();
