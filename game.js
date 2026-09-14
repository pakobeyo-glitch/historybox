const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 32;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 50;

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

function createEmptyTile() {
    return {
        terrain: "lowland",
        area: null,
        country: null,
        road: false
    };
}

function createWorld() {

    const result = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {

        const row = [];

        for (let x = 0; x < MAP_WIDTH; x++) {
            row.push(createEmptyTile());
        }

        result.push(row);
    }

    return result;
}

let world = createWorld();

let areas = {};
let countries = {};
let cities = {};


// ======================================================
// REŽIM
// ======================================================

let currentLayer = "terrain";


// ======================================================
// VÝBER
// ======================================================

let selectedTerrain = "lowland";
let selectedArea = null;
let selectedCountry = null;
let selectedCity = null;


// ======================================================
// NÁSTROJE
// ======================================================

let terrainTool = "brush";
let areaTool = "brush";

// infraTool môže byť:
// "cityPlace"
// "cityEraser"
// "roadBrush"
// "roadEraser"

let infraTool = "roadBrush";

let terrainBrushSize = 1;
let areaBrushSize = 1;


// ======================================================
// MYŠ
// ======================================================

let mouseDown = false;
let isPanning = false;

let panStartX = 0;
let panStartY = 0;

let panOffsetStartX = 0;
let panOffsetStartY = 0;


// ======================================================
// CANVAS
// ======================================================

function resizeCanvas() {

    canvas.width =
        document.getElementById("gameArea").clientWidth;

    canvas.height =
        document.getElementById("gameArea").clientHeight;

    draw();
}

window.addEventListener("resize", resizeCanvas);


// ======================================================
// VYKRESLENIE
// ======================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();

    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);


    // ------------------------------------------
    // TERÉN
    // ------------------------------------------

    for (let y = 0; y < MAP_HEIGHT; y++) {

        for (let x = 0; x < MAP_WIDTH; x++) {

            const tile = world[y][x];

            const terrain =
                terrainTypes[tile.terrain] ||
                terrainTypes.lowland;

            ctx.fillStyle = terrain.color;

            ctx.fillRect(
                x * TILE_SIZE,
                y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }


    // ------------------------------------------
    // OBLASTI
    // ------------------------------------------

    if (currentLayer === "area") {

        for (let y = 0; y < MAP_HEIGHT; y++) {

            for (let x = 0; x < MAP_WIDTH; x++) {

                if (world[y][x].area !== null) {

                    ctx.fillStyle = "#777777";

                    ctx.globalAlpha = 0.82;

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


    // ------------------------------------------
    // KRAJINY
    // ------------------------------------------

    if (currentLayer === "country") {

        for (let y = 0; y < MAP_HEIGHT; y++) {

            for (let x = 0; x < MAP_WIDTH; x++) {

                const countryId =
                    world[y][x].country;

                if (
                    countryId !== null &&
                    countries[countryId]
                ) {

                    ctx.fillStyle =
                        countries[countryId].color;

                    ctx.globalAlpha = 0.55;

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


    // ------------------------------------------
    // HRANICE OBLASTÍ
    // ------------------------------------------

    if (
        currentLayer === "area" ||
        currentLayer === "country" ||
        currentLayer === "infrastructure"
    ) {

        drawAreaBorders();
    }


    // ------------------------------------------
    // MRIEŽKA
    // ------------------------------------------

    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1 / zoom;

    for (let x = 0; x <= MAP_WIDTH; x++) {

        line(
            x * TILE_SIZE,
            0,
            x * TILE_SIZE,
            MAP_HEIGHT * TILE_SIZE
        );
    }

    for (let y = 0; y <= MAP_HEIGHT; y++) {

        line(
            0,
            y * TILE_SIZE,
            MAP_WIDTH * TILE_SIZE,
            y * TILE_SIZE
        );
    }


    // ------------------------------------------
    // NÁZVY
    // ------------------------------------------

    if (currentLayer === "area") {
        drawAreaNames();
    }

    if (currentLayer === "country") {
        drawCountryNames();
    }


    // ------------------------------------------
    // INFRAŠTRUKTÚRA
    // ------------------------------------------

    if (currentLayer === "infrastructure") {

        drawRoads();
        drawCities();
    }


    ctx.restore();
}


// ======================================================
// ČIARA
// ======================================================

function line(x1, y1, x2, y2) {

    ctx.beginPath();

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    ctx.stroke();
}


// ======================================================
// HRANICE OBLASTÍ
// ======================================================

function drawAreaBorders() {

    ctx.strokeStyle = "#e6a23c";
    ctx.lineWidth = 2 / zoom;

    for (let y = 0; y < MAP_HEIGHT; y++) {

        for (let x = 0; x < MAP_WIDTH; x++) {

            const area =
                world[y][x].area;

            if (area === null) continue;

            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;


            if (
                x === 0 ||
                world[y][x - 1].area !== area
            ) {
                line(
                    px,
                    py,
                    px,
                    py + TILE_SIZE
                );
            }


            if (
                x === MAP_WIDTH - 1 ||
                world[y][x + 1].area !== area
            ) {
                line(
                    px + TILE_SIZE,
                    py,
                    px + TILE_SIZE,
                    py + TILE_SIZE
                );
            }


            if (
                y === 0 ||
                world[y - 1][x].area !== area
            ) {
                line(
                    px,
                    py,
                    px + TILE_SIZE,
                    py
                );
            }


            if (
                y === MAP_HEIGHT - 1 ||
                world[y + 1][x].area !== area
            ) {
                line(
                    px,
                    py + TILE_SIZE,
                    px + TILE_SIZE,
                    py + TILE_SIZE
                );
            }
        }
    }
}


// ======================================================
// NÁZVY OBLASTÍ
// ======================================================

function drawAreaNames() {

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

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

        const centerX =
            totalX / area.tiles.length;

        const centerY =
            totalY / area.tiles.length;

        ctx.fillStyle = "white";

        ctx.font =
            `bold ${14 / zoom}px Arial`;

        ctx.fillText(
            area.name,
            centerX * TILE_SIZE + TILE_SIZE / 2,
            centerY * TILE_SIZE + TILE_SIZE / 2
        );
    }
}


// ======================================================
// NÁZVY KRAJÍN
// ======================================================

function drawCountryNames() {

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const id in countries) {

        const country = countries[id];

        let tiles = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {

            for (let x = 0; x < MAP_WIDTH; x++) {

                if (world[y][x].country === id) {

                    tiles.push({
                        x: x,
                        y: y
                    });
                }
            }
        }

        if (tiles.length === 0) continue;

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

        ctx.fillStyle = "white";

        ctx.font =
            `bold ${15 / zoom}px Arial`;

        ctx.fillText(
            country.name,
            centerX * TILE_SIZE + TILE_SIZE / 2,
            centerY * TILE_SIZE + TILE_SIZE / 2
        );
    }
}


// ======================================================
// CESTY
// ======================================================

function drawRoads() {

    for (let y = 0; y < MAP_HEIGHT; y++) {

        for (let x = 0; x < MAP_WIDTH; x++) {

            if (!world[y][x].road) {
                continue;
            }

            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;


            // okraj cesty
            ctx.fillStyle = "#202020";

            ctx.fillRect(
                px + 2,
                py + 2,
                TILE_SIZE - 4,
                TILE_SIZE - 4
            );


            // stred cesty
            ctx.fillStyle = "#c0c0c0";

            ctx.fillRect(
                px + 8,
                py + 8,
                TILE_SIZE - 16,
                TILE_SIZE - 16
            );
        }
    }
}


// ======================================================
// MESTÁ
// ======================================================

function drawCities() {

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    for (const id in cities) {

        const city = cities[id];

        if (
            city.x === null ||
            city.y === null
        ) {
            continue;
        }

        const px =
            city.x * TILE_SIZE;

        const py =
            city.y * TILE_SIZE;


        // políčko mesta
        ctx.fillStyle = "#51345a";

        ctx.fillRect(
            px + 2,
            py + 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4
        );


        // symbol
        ctx.font =
            `${18 / zoom}px Arial`;

        ctx.fillStyle = "white";

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        );


        // názov
        ctx.font =
            `bold ${13 / zoom}px Arial`;

        ctx.fillStyle = "white";

        ctx.fillText(
            city.name,
            px + TILE_SIZE / 2,
            py - 5
        );
    }
}


// ======================================================
// TERÉN – ZOZNAM
// ======================================================

const terrainList =
    document.getElementById("terrainList");

for (const id in terrainTypes) {

    const button =
        document.createElement("button");

    button.className =
        "terrain-btn";

    button.textContent =
        terrainTypes[id].name;

    button.style.borderLeft =
        `8px solid ${terrainTypes[id].color}`;


    button.addEventListener("click", () => {

        selectedTerrain = id;

        document
            .querySelectorAll(".terrain-btn")
            .forEach(btn =>
                btn.classList.remove("active")
            );

        button.classList.add("active");
    });


    terrainList.appendChild(button);
}

document
    .querySelector(".terrain-btn")
    .classList.add("active");


// ======================================================
// TERÉN – NÁSTROJE
// ======================================================

document
    .getElementById("terrainBrush")
    .addEventListener("click", () => {

        terrainTool = "brush";

        updateTerrainTools();
    });


document
    .getElementById("terrainEraser")
    .addEventListener("click", () => {

        terrainTool = "eraser";

        updateTerrainTools();
    });


function updateTerrainTools() {

    document
        .getElementById("terrainBrush")
        .classList.toggle(
            "active",
            terrainTool === "brush"
        );

    document
        .getElementById("terrainEraser")
        .classList.toggle(
            "active",
            terrainTool === "eraser"
        );
}


// ======================================================
// VEĽKOSŤ TERÉNU
// ======================================================

document
    .getElementById("terrainBrushSize")
    .addEventListener("input", event => {

        terrainBrushSize =
            Number(event.target.value);

        document
            .getElementById("terrainBrushSizeValue")
            .textContent =
            terrainBrushSize;
    });


// ======================================================
// OBLASTI – NÁSTROJE
// ======================================================

document
    .getElementById("areaBrush")
    .addEventListener("click", () => {

        areaTool = "brush";

        updateAreaTools();
    });


document
    .getElementById("areaEraser")
    .addEventListener("click", () => {

        areaTool = "eraser";

        updateAreaTools();
    });


function updateAreaTools() {

    document
        .getElementById("areaBrush")
        .classList.toggle(
            "active",
            areaTool === "brush"
        );

    document
        .getElementById("areaEraser")
        .classList.toggle(
            "active",
            areaTool === "eraser"
        );
}


// ======================================================
// VEĽKOSŤ OBLASTÍ
// ======================================================

document
    .getElementById("areaBrushSize")
    .addEventListener("input", event => {

        areaBrushSize =
            Number(event.target.value);

        document
            .getElementById("areaBrushSizeValue")
            .textContent =
            areaBrushSize;
    });


// ======================================================
// VYTVORENIE OBLASTI
// ======================================================

document
    .getElementById("createArea")
    .addEventListener("click", () => {

        const name =
            prompt("Zadaj názov oblasti:");

        if (!name) return;

        const id =
            "area_" + Date.now();


        areas[id] = {
            name: name,
            tiles: []
        };


        selectedArea = id;

        updateAreaList();

        draw();
    });


// ======================================================
// ZOZNAM OBLASTÍ
// ======================================================

function updateAreaList() {

    const list =
        document.getElementById("areaList");

    list.innerHTML = "";


    for (const id in areas) {

        const button =
            document.createElement("button");

        button.className =
            "area-btn";

        button.textContent =
            areas[id].name;


        if (id === selectedArea) {
            button.classList.add("active");
        }


        button.addEventListener("click", () => {

            selectedArea = id;

            updateAreaList();

            draw();
        });


        list.appendChild(button);
    }
}


// ======================================================
// VYTVORENIE KRAJINY
// ======================================================

document
    .getElementById("createCountry")
    .addEventListener("click", () => {

        const name =
            prompt("Zadaj názov krajiny:");

        if (!name) return;


        const id =
            "country_" + Date.now();


        countries[id] = {
            name: name,
            color: randomCountryColor()
        };


        selectedCountry = id;

        updateCountryList();

        draw();
    });


// ======================================================
// ZOZNAM KRAJÍN
// ======================================================

function updateCountryList() {

    const list =
        document.getElementById("countryList");

    list.innerHTML = "";


    for (const id in countries) {

        const button =
            document.createElement("button");

        button.className =
            "country-btn";

        button.textContent =
            countries[id].name;

        button.style.borderLeft =
            `8px solid ${countries[id].color}`;


        if (id === selectedCountry) {
            button.classList.add("active");
        }


        button.addEventListener("click", () => {

            selectedCountry = id;

            updateCountryList();

            draw();
        });


        list.appendChild(button);
    }
}


// ======================================================
// FARBY KRAJÍN
// ======================================================

function randomCountryColor() {

    const colors = [
        "#c94c4c",
        "#4c7ac9",
        "#b78a3d",
        "#8a5ac9",
        "#4ca67a",
        "#c96f3d",
        "#b84c9b",
        "#4c9fc9"
    ];

    return colors[
        Math.floor(
            Math.random() * colors.length
        )
    ];
}


// ======================================================
// VYTVORENIE MESTA
// ======================================================

document
    .getElementById("createCity")
    .addEventListener("click", () => {

        const name =
            prompt("Zadaj názov mesta:");

        if (!name) return;


        const id =
            "city_" + Date.now();


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
    });


// ======================================================
// ZOZNAM MIEST
// ======================================================

function updateCityList() {

    const list =
        document.getElementById("cityList");

    list.innerHTML = "";


    for (const id in cities) {

        const city = cities[id];

        const button =
            document.createElement("button");

        button.className =
            "city-btn";

        button.textContent =
            city.name;


        if (id === selectedCity) {
            button.classList.add("active");
        }


        button.addEventListener("click", () => {

            selectedCity = id;

            infraTool = "cityPlace";

            updateInfrastructureTools();
            updateCityList();

            draw();
        });


        list.appendChild(button);
    }
}


// ======================================================
// INFRAŠTRUKTÚRA – MESTÁ
// ======================================================

document
    .getElementById("cityPlace")
    .addEventListener("click", () => {

        infraTool = "cityPlace";

        updateInfrastructureTools();
    });


document
    .getElementById("cityEraser")
    .addEventListener("click", () => {

        infraTool = "cityEraser";

        updateInfrastructureTools();
    });


// ======================================================
// INFRAŠTRUKTÚRA – CESTY
// ======================================================

document
    .getElementById("roadBrush")
    .addEventListener("click", () => {

        infraTool = "roadBrush";

        updateInfrastructureTools();
    });


document
    .getElementById("roadEraser")
    .addEventListener("click", () => {

        infraTool = "roadEraser";

        updateInfrastructureTools();
    });


// ======================================================
// AKTÍVNY INFRA NÁSTROJ
// ======================================================

function updateInfrastructureTools() {

    document
        .getElementById("cityPlace")
        .classList.toggle(
            "active",
            infraTool === "cityPlace"
        );


    document
        .getElementById("cityEraser")
        .classList.toggle(
            "active",
            infraTool === "cityEraser"
        );


    document
        .getElementById("roadBrush")
        .classList.toggle(
            "active",
            infraTool === "roadBrush"
        );


    document
        .getElementById("roadEraser")
        .classList.toggle(
            "active",
            infraTool === "roadEraser"
        );
}


// ======================================================
// PREPÍNANIE REŽIMOV
// ======================================================

const modes = {

    terrain: {
        button: "terrainMode",
        panel: "terrainLayer"
    },

    area: {
        button: "areaMode",
        panel: "areaLayer"
    },

    country: {
        button: "countryMode",
        panel: "countryLayer"
    },

    infrastructure: {
        button: "infrastructureMode",
        panel: "infrastructureLayer"
    }
};


for (const mode in modes) {

    document
        .getElementById(modes[mode].button)
        .addEventListener("click", () => {

            currentLayer = mode;

            updateModeUI();

            draw();
        });
}


function updateModeUI() {

    for (const mode in modes) {

        document
            .getElementById(modes[mode].button)
            .classList.toggle(
                "active",
                currentLayer === mode
            );


        document
            .getElementById(modes[mode].panel)
            .classList.toggle(
                "hidden",
                currentLayer !== mode
            );
    }
}


// ======================================================
// MYŠ → POLÍČKO
// ======================================================

function getTileFromMouse(event) {

    const rect =
        canvas.getBoundingClientRect();


    const mouseX =
        event.clientX - rect.left;

    const mouseY =
        event.clientY - rect.top;


    const worldX =
        (mouseX - offsetX) / zoom;

    const worldY =
        (mouseY - offsetY) / zoom;


    const x =
        Math.floor(
            worldX / TILE_SIZE
        );

    const y =
        Math.floor(
            worldY / TILE_SIZE
        );


    if (
        x < 0 ||
        y < 0 ||
        x >= MAP_WIDTH ||
        y >= MAP_HEIGHT
    ) {
        return null;
    }


    return {
        x: x,
        y: y
    };
}


// ======================================================
// TERÉN
// ======================================================

function paintTerrain(x, y) {

    const radius =
        Math.floor(
            terrainBrushSize / 2
        );


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


            if (
                tx < 0 ||
                ty < 0 ||
                tx >= MAP_WIDTH ||
                ty >= MAP_HEIGHT
            ) {
                continue;
            }


            if (terrainTool === "brush") {

                world[ty][tx].terrain =
                    selectedTerrain;

            } else {

                world[ty][tx].terrain =
                    "lowland";
            }
        }
    }
}


// ======================================================
// OBLASTI
// ======================================================

function removeTileFromArea(x, y, areaId) {

    if (!areas[areaId]) {
        return;
    }


    areas[areaId].tiles =
        areas[areaId].tiles.filter(
            tile =>
                !(tile.x === x && tile.y === y)
        );
}


function addTileToArea(x, y, areaId) {

    if (!areas[areaId]) {
        return;
    }


    const alreadyThere =
        areas[areaId].tiles.some(
            tile =>
                tile.x === x &&
                tile.y === y
        );


    if (!alreadyThere) {

        areas[areaId].tiles.push({
            x: x,
            y: y
        });
    }
}


function paintArea(x, y) {
    if (world[y][x].terrain === "river" || world[y][x].terrain === "sea") {
    return;
    }

    const radius =
        Math.floor(
            areaBrushSize / 2
        );


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


            if (
                tx < 0 ||
                ty < 0 ||
                tx >= MAP_WIDTH ||
                ty >= MAP_HEIGHT
            ) {
                continue;
            }


            const tile =
                world[ty][tx];


            if (areaTool === "brush") {

                if (!selectedArea) {
                    continue;
                }


                if (
                    tile.area !== null &&
                    tile.area !== selectedArea
                ) {

                    removeTileFromArea(
                        tx,
                        ty,
                        tile.area
                    );
                }


                tile.area =
                    selectedArea;

                addTileToArea(
                    tx,
                    ty,
                    selectedArea
                );

            } else {

                if (tile.area !== null) {

                    removeTileFromArea(
                        tx,
                        ty,
                        tile.area
                    );

                    tile.area = null;
                }
            }
        }
    }
}


// ======================================================
// KRAJINA
// ======================================================

function assignCountryToArea(x, y) {

    const areaId =
        world[y][x].area;


    if (!areaId) {
        return;
    }


    if (!selectedCountry) {
        alert(
            "Najprv vytvor alebo vyber krajinu."
        );

        return;
    }


    for (let yy = 0; yy < MAP_HEIGHT; yy++) {

        for (let xx = 0; xx < MAP_WIDTH; xx++) {

            if (
                world[yy][xx].area === areaId
            ) {

                world[yy][xx].country =
                    selectedCountry;
            }
        }
    }


    draw();
}


// ======================================================
// MESTO – UMIESTNENIE
// ======================================================

function placeCity(x, y) {

    if (!selectedCity) {

        alert(
            "Najprv vytvor alebo vyber mesto."
        );

        return;
    }


    // kontrola, či je políčko obsadené iným mestom
    for (const id in cities) {

        if (id === selectedCity) {
            continue;
        }


        const city =
            cities[id];


        if (
            city.x === x &&
            city.y === y
        ) {

            alert(
                "Na tomto políčku už je iné mesto."
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
// MESTO – GUMA
// ======================================================

function eraseCity(x, y) {

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
// CESTA
// ======================================================

function paintRoad(x, y) {

    if (roadTool === "brush") {

        world[y][x].road = true;

    } else {

        world[y][x].road = false;
    }


    draw();
}


// ======================================================
// INFRAŠTRUKTÚRA – AKCIA NA POLÍČKU
// ======================================================

function useInfrastructureTool(x, y) {

    if (infraTool === "cityPlace") {

        placeCity(x, y);

        return;
    }


    if (infraTool === "cityEraser") {

        eraseCity(x, y);

        return;
    }


    if (infraTool === "roadBrush") {

        roadTool = "brush";

        paintRoad(x, y);

        return;
    }


    if (infraTool === "roadEraser") {

        roadTool = "eraser";

        paintRoad(x, y);

        return;
    }
}


// ======================================================
// MYŠ – DOWN
// ======================================================

canvas.addEventListener(
    "mousedown",
    event => {

        // pravé tlačidlo = posúvanie
        if (event.button === 2) {

            isPanning = true;

            panStartX = event.clientX;
            panStartY = event.clientY;

            panOffsetStartX = offsetX;
            panOffsetStartY = offsetY;

            return;
        }


        if (event.button !== 0) {
            return;
        }


        mouseDown = true;


        const tile =
            getTileFromMouse(event);


        if (!tile) {
            return;
        }


        // ------------------------------------------
        // TERÉN
        // ------------------------------------------

        if (currentLayer === "terrain") {

            paintTerrain(
                tile.x,
                tile.y
            );

            draw();

            return;
        }


        // ------------------------------------------
        // OBLASŤ
        // ------------------------------------------

        if (currentLayer === "area") {

            paintArea(
                tile.x,
                tile.y
            );

            updateAreaList();

            draw();

            return;
        }


        // ------------------------------------------
        // KRAJINA
        // ------------------------------------------

        if (currentLayer === "country") {

            assignCountryToArea(
                tile.x,
                tile.y
            );

            return;
        }


        // ------------------------------------------
        // INFRAŠTRUKTÚRA
        // ------------------------------------------

        if (
            currentLayer === "infrastructure"
        ) {

            useInfrastructureTool(
                tile.x,
                tile.y
            );

            return;
        }
    }
);


// ======================================================
// MYŠ – MOVE
// ======================================================

canvas.addEventListener(
    "mousemove",
    event => {

        // ------------------------------------------
        // POSÚVANIE
        // ------------------------------------------

        if (isPanning) {

            offsetX =
                panOffsetStartX +
                (
                    event.clientX -
                    panStartX
                );

            offsetY =
                panOffsetStartY +
                (
                    event.clientY -
                    panStartY
                );

            draw();

            return;
        }


        // ------------------------------------------
        // SÚRADNICE
        // ------------------------------------------

        const tile =
            getTileFromMouse(event);


        if (tile) {

            document
                .getElementById("coordinates")
                .textContent =
                `X: ${tile.x} | Y: ${tile.y}`;
        }


        if (!mouseDown) {
            return;
        }


        if (!tile) {
            return;
        }


        // ------------------------------------------
        // TERÉN
        // ------------------------------------------

        if (currentLayer === "terrain") {

            paintTerrain(
                tile.x,
                tile.y
            );

            draw();

            return;
        }


        // ------------------------------------------
        // OBLASTI
        // ------------------------------------------

        if (currentLayer === "area") {

            paintArea(
                tile.x,
                tile.y
            );

            updateAreaList();

            draw();

            return;
        }


        // ------------------------------------------
        // INFRAŠTRUKTÚRA
        // ------------------------------------------

        if (
            currentLayer === "infrastructure"
        ) {

            // Cesta sa dá kresliť držaním
            if (
                infraTool === "roadBrush" ||
                infraTool === "roadEraser"
            ) {

                useInfrastructureTool(
                    tile.x,
                    tile.y
                );
            }


            // Mestá sa pri ťahaní nevytvárajú
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
        }
    }
);


canvas.addEventListener(
    "mouseleave",
    () => {

        mouseDown = false;
        isPanning = false;
    }
);


// ======================================================
// PRAVÉ TLAČIDLO
// ======================================================

canvas.addEventListener(
    "contextmenu",
    event => {
        event.preventDefault();
    }
);


// ======================================================
// ZOOM
// ======================================================

document
    .getElementById("zoomIn")
    .addEventListener("click", () => {

        zoom *= 1.2;

        zoom =
            Math.min(zoom, 5);

        updateZoomUI();

        draw();
    });


document
    .getElementById("zoomOut")
    .addEventListener("click", () => {

        zoom /= 1.2;

        zoom =
            Math.max(zoom, 0.25);

        updateZoomUI();

        draw();
    });


document
    .getElementById("resetZoom")
    .addEventListener("click", () => {

        zoom = 1;

        offsetX = 20;
        offsetY = 20;

        updateZoomUI();

        draw();
    });


function updateZoomUI() {

    document
        .getElementById("zoomValue")
        .textContent =
        Math.round(zoom * 100) + "%";
}


// ======================================================
// KOLESO MYŠI – ZOOM
// ======================================================

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX - rect.left;

        const mouseY =
            event.clientY - rect.top;


        const worldBeforeX =
            (mouseX - offsetX) / zoom;

        const worldBeforeY =
            (mouseY - offsetY) / zoom;


        if (event.deltaY < 0) {

            zoom *= 1.1;

        } else {

            zoom /= 1.1;
        }


        zoom =
            Math.max(
                0.25,
                Math.min(zoom, 5)
            );


        offsetX =
            mouseX -
            worldBeforeX * zoom;

        offsetY =
            mouseY -
            worldBeforeY * zoom;


        updateZoomUI();

        draw();

    },
    { passive: false }
);


// ======================================================
// ULOŽENIE
// ======================================================

document
    .getElementById("saveWorld")
    .addEventListener("click", () => {

        const data = {

            mapWidth: MAP_WIDTH,
            mapHeight: MAP_HEIGHT,

            world: world,

            areas: areas,

            countries: countries,

            cities: cities
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
                    type: "application/json"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "moj-svet.json";

        link.click();


        URL.revokeObjectURL(url);
    });


// ======================================================
// NAČÍTANIE
// ======================================================

document
    .getElementById("loadWorld")
    .addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload = e => {

                try {

                    const data =
                        JSON.parse(
                            e.target.result
                        );


                    world =
                        data.world || createWorld();

                    areas =
                        data.areas || {};

                    countries =
                        data.countries || {};

                    cities =
                        data.cities || {};


                    // doplnenie nových údajov
                    for (
                        let y = 0;
                        y < world.length;
                        y++
                    ) {

                        for (
                            let x = 0;
                            x < world[y].length;
                            x++
                        ) {

                            const tile =
                                world[y][x];


                            if (
                                tile.area === undefined
                            ) {
                                tile.area = null;
                            }


                            if (
                                tile.country === undefined
                            ) {
                                tile.country = null;
                            }


                            if (
                                tile.road === undefined
                            ) {
                                tile.road = false;
                            }
                        }
                    }


                    selectedArea = null;
                    selectedCountry = null;
                    selectedCity = null;


                    updateAreaList();
                    updateCountryList();
                    updateCityList();

                    draw();

                } catch (error) {

                    console.error(error);

                    alert(
                        "Svet sa nepodarilo načítať."
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
    .addEventListener("click", () => {

        if (
            !confirm(
                "Naozaj chceš vymazať celý svet?"
            )
        ) {
            return;
        }


        world = createWorld();

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
    });


// ======================================================
// ŠTART
// ======================================================

updateModeUI();

updateInfrastructureTools();

updateAreaList();
updateCountryList();
updateCityList();

resizeCanvas();
