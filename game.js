```javascript
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// ======================================================
// NASTAVENIE MAPY
// ======================================================

const TILE_SIZE = 32;
const MAP_WIDTH = 200;
const MAP_HEIGHT = 200;


// ======================================================
// ZOOM A POSUN
// ======================================================

let zoom = 1;

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 4;

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

function createWorld() {

    world = [];

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
}

createWorld();


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
// AKTUÁLNY REŽIM
// ======================================================

let currentMode = "terrain";


// ======================================================
// NÁSTROJE
// ======================================================

let terrainTool = "brush";
let areaTool = "brush";
let infraTool = "cityPlace";

let terrainBrushSize = 1;
let areaBrushSize = 1;

let selectedTerrain = "lowland";


// ======================================================
// MYŠ
// ======================================================

let mouseDown = false;
let isPanning = false;

let lastMouseX = 0;
let lastMouseY = 0;

let mouseWorldX = -1;
let mouseWorldY = -1;


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


function isInsideMap(x, y) {

    return (
        x >= 0 &&
        y >= 0 &&
        x < MAP_WIDTH &&
        y < MAP_HEIGHT
    );
}


function screenToWorld(mouseX, mouseY) {

    const worldX =
        (mouseX - offsetX) / zoom;

    const worldY =
        (mouseY - offsetY) / zoom;

    return {
        x: Math.floor(worldX / TILE_SIZE),
        y: Math.floor(worldY / TILE_SIZE)
    };
}


function getVisibleBounds() {

    const startX = Math.max(
        0,
        Math.floor(
            (-offsetX) /
            (TILE_SIZE * zoom)
        ) - 1
    );

    const startY = Math.max(
        0,
        Math.floor(
            (-offsetY) /
            (TILE_SIZE * zoom)
        ) - 1
    );

    const endX = Math.min(
        MAP_WIDTH,
        Math.ceil(
            (canvas.width - offsetX) /
            (TILE_SIZE * zoom)
        ) + 1
    );

    const endY = Math.min(
        MAP_HEIGHT,
        Math.ceil(
            (canvas.height - offsetY) /
            (TILE_SIZE * zoom)
        ) + 1
    );

    return {
        startX,
        startY,
        endX,
        endY
    };
}


// ======================================================
// KRESLENIE TERÉNU
// ======================================================

function drawTerrain() {

    const bounds = getVisibleBounds();

    for (
        let y = bounds.startY;
        y < bounds.endY;
        y++
    ) {

        for (
            let x = bounds.startX;
            x < bounds.endX;
            x++
        ) {

            const tile = world[y][x];

            const terrain =
                terrainTypes[tile.terrain];

            if (!terrain) {
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

            ctx.fillStyle = terrain.color;

            ctx.fillRect(
                px,
                py,
                size,
                size
            );
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

    const bounds = getVisibleBounds();

    for (
        let y = bounds.startY;
        y < bounds.endY;
        y++
    ) {

        for (
            let x = bounds.startX;
            x < bounds.endX;
            x++
        ) {

            const tile = world[y][x];

            if (!tile.area) {
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
                getAreaColor();

            ctx.fillRect(
                px,
                py,
                size,
                size
            );
        }
    }


    // Hranice oblastí

    ctx.save();

    ctx.lineWidth =
        Math.max(1, 2 * zoom);

    ctx.strokeStyle =
        "#f39c12";

    for (
        let y = bounds.startY;
        y < bounds.endY;
        y++
    ) {

        for (
            let x = bounds.startX;
            x < bounds.endX;
            x++
        ) {

            const tile = world[y][x];

            if (!tile.area) {
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


            // ľavý okraj

            if (
                x === 0 ||
                world[y][x - 1].area !== tile.area
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    px,
                    py
                );

                ctx.lineTo(
                    px,
                    py + size
                );

                ctx.stroke();
            }


            // pravý okraj

            if (
                x === MAP_WIDTH - 1 ||
                world[y][x + 1].area !== tile.area
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    px + size,
                    py
                );

                ctx.lineTo(
                    px + size,
                    py + size
                );

                ctx.stroke();
            }


            // horný okraj

            if (
                y === 0 ||
                world[y - 1][x].area !== tile.area
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    px,
                    py
                );

                ctx.lineTo(
                    px + size,
                    py
                );

                ctx.stroke();
            }


            // dolný okraj

            if (
                y === MAP_HEIGHT - 1 ||
                world[y + 1][x].area !== tile.area
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    px,
                    py + size
                );

                ctx.lineTo(
                    px + size,
                    py + size
                );

                ctx.stroke();
            }
        }
    }

    ctx.restore();

    drawAreaNames();
}


// ======================================================
// NÁZVY OBLASTÍ
// ======================================================

function drawAreaNames() {

    for (const id in areas) {

        const area = areas[id];

        if (
            !area.tiles ||
            area.tiles.length === 0
        ) {
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
            `bold ${Math.max(
                10,
                14 * zoom
            )}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle =
            "rgba(0,0,0,0.7)";

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

    const bounds = getVisibleBounds();

    for (
        let y = bounds.startY;
        y < bounds.endY;
        y++
    ) {

        for (
            let x = bounds.startX;
            x < bounds.endX;
            x++
        ) {

            const tile = world[y][x];

            if (!tile.country) {
                continue;
            }

            const country =
                countries[tile.country];

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


            ctx.save();

            ctx.globalAlpha = 0.45;

            ctx.fillStyle =
                country.color;

            ctx.fillRect(
                px,
                py,
                size,
                size
            );

            ctx.restore();
        }
    }

    drawCountryNames();
}


// ======================================================
// NÁZVY KRAJÍN
// ======================================================

function drawCountryNames() {

    for (const id in countries) {

        const country =
            countries[id];

        let totalX = 0;
        let totalY = 0;
        let count = 0;


        for (let y = 0; y < MAP_HEIGHT; y++) {

            for (let x = 0; x < MAP_WIDTH; x++) {

                if (
                    world[y][x].country === id
                ) {

                    totalX += x;
                    totalY += y;

                    count++;
                }
            }
        }


        if (count === 0) {
            continue;
        }


        const centerX =
            totalX / count;

        const centerY =
            totalY / count;


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
            `bold ${Math.max(
                11,
                16 * zoom
            )}px Arial`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle =
            "rgba(0,0,0,0.75)";

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


        ctx.save();


        // Červená bodka

        ctx.fillStyle = "#e53935";

        ctx.beginPath();

        ctx.arc(
            px,
            py,
            Math.max(
                3,
                5 * zoom
            ),
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Biela obruba

        ctx.strokeStyle =
            "rgba(255,255,255,0.8)";

        ctx.lineWidth =
            Math.max(1, zoom);

        ctx.stroke();


        // Názov mesta

        ctx.font =
            `bold ${Math.max(
                10,
                13 * zoom
            )}px Arial`;

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";


        ctx.fillStyle =
            "rgba(0,0,0,0.8)";

        ctx.fillText(
            city.name,
            px + 9 * zoom + 1,
            py + 1
        );


        ctx.fillStyle = "white";

        ctx.fillText(
            city.name,
            px + 9 * zoom,
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

    const bounds =
        getVisibleBounds();


    ctx.save();

    ctx.strokeStyle =
        "rgba(0,0,0,0.14)";

    ctx.lineWidth = 1;


    for (
        let x = bounds.startX;
        x <= bounds.endX;
        x++
    ) {

        const px =
            offsetX +
            x * TILE_SIZE * zoom;

        ctx.beginPath();

        ctx.moveTo(
            px,
            offsetY +
            bounds.startY *
            TILE_SIZE *
            zoom
        );

        ctx.lineTo(
            px,
            offsetY +
            bounds.endY *
            TILE_SIZE *
            zoom
        );

        ctx.stroke();
    }


    for (
        let y = bounds.startY;
        y <= bounds.endY;
        y++
    ) {

        const py =
            offsetY +
            y * TILE_SIZE * zoom;

        ctx.beginPath();

        ctx.moveTo(
            offsetX +
            bounds.startX *
            TILE_SIZE *
            zoom,
            py
        );

        ctx.lineTo(
            offsetX +
            bounds.endX *
            TILE_SIZE *
            zoom,
            py
        );

        ctx.stroke();
    }

    ctx.restore();
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
// ODSTRÁNENIE TLAČIDLA OBLASTI
// ======================================================

function removeTileFromArea(x, y) {

    if (!isInsideMap(x, y)) {
        return;
    }

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
// PRIDANIE POLÍČKA DO OBLASTI
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


// ======================================================
// MAĽOVANIE TERÉNU
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


            if (!isInsideMap(tx, ty)) {
                continue;
            }


            if (
                terrainTool === "eraser"
            ) {

                world[ty][tx].terrain =
                    "lowland";

            } else {

                world[ty][tx].terrain =
                    selectedTerrain;
            }


            // Rieka alebo more nemôže
            // patriť do oblasti.

            if (
                world[ty][tx].terrain === "river" ||
                world[ty][tx].terrain === "sea"
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
// MAĽOVANIE OBLASTÍ
// ======================================================

function paintArea(x, y) {

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


            if (!isInsideMap(tx, ty)) {
                continue;
            }


            const tile =
                world[ty][tx];


            // More a rieka sú zakázané.

            if (
                tile.terrain === "river" ||
                tile.terrain === "sea"
            ) {

                continue;
            }


            // Guma

            if (
                areaTool === "eraser"
            ) {

                removeTileFromArea(
                    tx,
                    ty
                );

                continue;
            }


            if (!selectedArea) {
                continue;
            }


            // Ak patrí inej oblasti,
            // odstránime starú oblasť.

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

    if (!name || !name.trim()) {
        return;
    }


    const id =
        "area_" +
        Date.now();


    areas[id] = {

        name:
            name.trim(),

        tiles: []
    };


    selectedArea = id;

    updateAreaList();

    draw();
}


// ======================================================
// VYTVORENIE KRAJINY
// ======================================================

function createCountry() {

    const name =
        prompt("Názov krajiny:");

    if (!name || !name.trim()) {
        return;
    }


    const id =
        "country_" +
        Date.now();


    countries[id] = {

        name:
            name.trim(),

        color:
            randomCountryColor()
    };


    selectedCountry = id;

    updateCountryList();

    draw();
}


// ======================================================
// NÁHODNÁ FARBA KRAJINY
// ======================================================

function randomCountryColor() {

    const colors = [

        "#e74c3c",
        "#3498db",
        "#2ecc71",
        "#f1c40f",
        "#9b59b6",
        "#e67e22",
        "#1abc9c",
        "#e84393",
        "#00cec9",
        "#6c5ce7",
        "#fd79a8",
        "#0984e3"

    ];


    return colors[
        Math.floor(
            Math.random() *
            colors.length
        )
    ];
}


// ======================================================
// VYTVORENIE MESTA
// ======================================================

function createCity() {

    const name =
        prompt("Názov mesta:");

    if (!name || !name.trim()) {
        return;
    }


    const id =
        "city_" +
        Date.now();


    cities[id] = {

        name:
            name.trim(),

        x: null,
        y: null
    };


    selectedCity = id;

    infraTool = "cityPlace";

    updateCityTools();

    updateCityList();

    draw();


    alert(
        "Teraz klikni na políčko mapy, kam chceš mesto umiestniť."
    );
}


// ======================================================
// UMIESTNENIE MESTA
// ======================================================

function placeCity(x, y) {

    if (!selectedCity) {
        return;
    }


    if (!isInsideMap(x, y)) {
        return;
    }


    // Jedno mesto na jedno políčko.

    for (const id in cities) {

        const city = cities[id];

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

function eraseCity(x, y) {

    for (const id in cities) {

        const city = cities[id];

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
// PRIRADENIE OBLASTI KRAJINE
// ======================================================

function assignAreaToCountry(
    areaId,
    countryId
) {

    if (
        !areas[areaId] ||
        !countries[countryId]
    ) {
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
                countryId;
        }
    }


    draw();
}


// ======================================================
// ZOZNAM OBLASTÍ
// ======================================================

function updateAreaList() {

    const list =
        document.getElementById(
            "areaList"
        );

    if (!list) {
        return;
    }


    list.innerHTML = "";


    for (const id in areas) {

        const area =
            areas[id];


        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "area-btn";


        if (
            selectedArea === id
        ) {

            button.classList.add(
                "active"
            );
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
// ZOZNAM KRAJÍN
// ======================================================

function updateCountryList() {

    const list =
        document.getElementById(
            "countryList"
        );

    if (!list) {
        return;
    }


    list.innerHTML = "";


    for (const id in countries) {

        const country =
            countries[id];


        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "country-btn";


        if (
            selectedCountry === id
        ) {

            button.classList.add(
                "active"
            );
        }


        button.innerHTML =
            `<span style="
                display:inline-block;
                width:12px;
                height:12px;
                border-radius:50%;
                background:${country.color};
                margin-right:8px;
            "></span>${escapeHtml(country.name)}`;


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
// ZOZNAM MIEST
// ======================================================

function updateCityList() {

    const list =
        document.getElementById(
            "cityList"
        );

    if (!list) {
        return;
    }


    list.innerHTML = "";


    for (const id in cities) {

        const city =
            cities[id];


        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "city-btn";


        if (
            selectedCity === id
        ) {

            button.classList.add(
                "active"
            );
        }


        button.textContent =
            "🔴 " +
            city.name;


        button.addEventListener(
            "click",
            () => {

                selectedCity = id;

                infraTool = "cityPlace";

                updateCityTools();

                updateCityList();

                draw();
            }
        );


        list.appendChild(button);
    }
}


// ======================================================
// BEZPEČNÉ TEXTY
// ======================================================

function escapeHtml(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================================
// PREPÍNANIE HLAVNÝCH REŽIMOV
// ======================================================

function setMode(mode) {

    currentMode = mode;


    const panels = {

        terrain:
            document.getElementById(
                "terrainPanel"
            ),

        area:
            document.getElementById(
                "areaPanel"
            ),

        country:
            document.getElementById(
                "countryPanel"
            ),

        infra:
            document.getElementById(
                "infraPanel"
            )
    };


    for (const key in panels) {

        if (!panels[key]) {
            continue;
        }

        panels[key].classList.toggle(
            "hidden",
            key !== mode
        );
    }


    document
        .querySelectorAll(".mode-tab")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });


    draw();
}


// ======================================================
// NÁSTROJE MIEST
// ======================================================

function updateCityTools() {

    const place =
        document.getElementById(
            "cityPlaceBtn"
        );

    const eraser =
        document.getElementById(
            "cityEraserBtn"
        );


    place.classList.toggle(
        "active",
        infraTool === "cityPlace"
    );


    eraser.classList.toggle(
        "active",
        infraTool === "cityEraser"
    );
}


// ======================================================
// NASTAVENIE ZOOMU
// ======================================================

function setZoom(
    newZoom,
    centerX = canvas.width / 2,
    centerY = canvas.height / 2
) {

    newZoom =
        clamp(
            newZoom,
            MIN_ZOOM,
            MAX_ZOOM
        );


    // Zachovanie bodu pod kurzorom.

    const worldBeforeX =
        (centerX - offsetX) / zoom;

    const worldBeforeY =
        (centerY - offsetY) / zoom;


    zoom = newZoom;


    offsetX =
        centerX -
        worldBeforeX * zoom;

    offsetY =
        centerY -
        worldBeforeY * zoom;


    updateZoomDisplay();

    draw();
}


function updateZoomDisplay() {

    const element =
        document.getElementById(
            "zoomValue"
        );

    if (!element) {
        return;
    }


    element.textContent =
        Math.round(
            zoom * 100
        ) + "%";
}


// ======================================================
// ZOOM KOLIESKOM
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
                ? 1.12
                : 0.89;


        setZoom(
            zoom * factor,
            mouseX,
            mouseY
        );
    },
    { passive: false }
);


// ======================================================
// MYŠ – ZAČIATOK
// ======================================================

canvas.addEventListener(
    "mousedown",
    event => {

        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        // Pravé tlačidlo = posúvanie.

        if (event.button === 2) {

            isPanning = true;

            lastMouseX =
                event.clientX;

            lastMouseY =
                event.clientY;

            return;
        }


        if (event.button !== 0) {
            return;
        }


        mouseDown = true;


        const pos =
            screenToWorld(
                mouseX,
                mouseY
            );


        mouseWorldX = pos.x;
        mouseWorldY = pos.y;


        // Terén sa maľuje ťahaním.

        if (
            currentMode === "terrain"
        ) {

            paintTerrain(
                pos.x,
                pos.y
            );

            return;
        }


        // Oblasti sa maľujú ťahaním.

        if (
            currentMode === "area"
        ) {

            paintArea(
                pos.x,
                pos.y
            );

            return;
        }


        // Krajina = kliknutie na oblasť.

        if (
            currentMode === "country"
        ) {

            handleCountryClick(
                pos.x,
                pos.y
            );

            return;
        }


        // Mestá = iba kliknutie.

        if (
            currentMode === "infra"
        ) {

            if (
                infraTool === "cityPlace"
            ) {

                placeCity(
                    pos.x,
                    pos.y
                );

            } else if (
                infraTool === "cityEraser"
            ) {

                eraseCity(
                    pos.x,
                    pos.y
                );
            }
        }
    }
);


// ======================================================
// MYŠ – POHYB
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


        mouseWorldX = pos.x;
        mouseWorldY = pos.y;


        updateCoordinates();


        // Posúvanie mapy.

        if (isPanning) {

            offsetX +=
                event.clientX -
                lastMouseX;

            offsetY +=
                event.clientY -
                lastMouseY;


            lastMouseX =
                event.clientX;

            lastMouseY =
                event.clientY;


            draw();

            return;
        }


        if (!mouseDown) {
            return;
        }


        // Terén

        if (
            currentMode === "terrain"
        ) {

            paintTerrain(
                pos.x,
                pos.y
            );

            return;
        }


        // Oblasti

        if (
            currentMode === "area"
        ) {

            paintArea(
                pos.x,
                pos.y
            );
        }
    }
);


// ======================================================
// MYŠ – KONIEC
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
// ZÁKAZ KONTEXTOVÉHO MENU
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

function updateCoordinates() {

    const element =
        document.getElementById(
            "coordinates"
        );

    if (!element) {
        return;
    }


    if (
        isInsideMap(
            mouseWorldX,
            mouseWorldY
        )
    ) {

        element.textContent =
            `X: ${mouseWorldX} | Y: ${mouseWorldY}`;

    } else {

        element.textContent =
            "X: — | Y: —";
    }
}


// ======================================================
// KLIKNUTIE NA KRAJINU
// ======================================================

function handleCountryClick(
    x,
    y
) {

    if (!isInsideMap(x, y)) {
        return;
    }


    if (!selectedCountry) {

        alert(
            "Najprv vyber krajinu."
        );

        return;
    }


    const areaId =
        world[y][x].area;


    if (!areaId) {

        alert(
            "Klikni na políčko, ktoré patrí do oblasti."
        );

        return;
    }


    assignAreaToCountry(
        areaId,
        selectedCountry
    );


    updateCountryList();

    draw();
}


// ======================================================
// TLAČIDLÁ HORNÉHO MENU
// ======================================================

document
    .querySelectorAll(".mode-tab")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                setMode(
                    button.dataset.mode
                );
            }
        );
    });


// ======================================================
// TERÉN – TLAČIDLÁ
// ======================================================

document
    .querySelectorAll(".terrain-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedTerrain =
                    button.dataset.terrain;


                document
                    .querySelectorAll(
                        ".terrain-btn"
                    )
                    .forEach(btn => {

                        btn.classList.toggle(
                            "active",
                            btn === button
                        );
                    });
            }
        );
    });


// ======================================================
// OBLASTI
// ======================================================

document
    .getElementById(
        "createAreaBtn"
    )
    .addEventListener(
        "click",
        createArea
    );


document
    .getElementById(
        "areaBrushBtn"
    )
    .addEventListener(
        "click",
        () => {

            areaTool = "brush";

            document
                .getElementById(
                    "areaBrushBtn"
                )
                .classList.add(
                    "active"
                );

            document
                .getElementById(
                    "areaEraserBtn"
                )
                .classList.remove(
                    "active"
                );
        }
    );


document
    .getElementById(
        "areaEraserBtn"
    )
    .addEventListener(
        "click",
        () => {

            areaTool = "eraser";

            document
                .getElementById(
                    "areaEraserBtn"
                )
                .classList.add(
                    "active"
                );

            document
                .getElementById(
                    "areaBrushBtn"
                )
                .classList.remove(
                    "active"
                );
        }
    );


// ======================================================
// VEĽKOSŤ ŠTETCA
// ======================================================

document
    .getElementById(
        "brushSize"
    )
    .addEventListener(
        "input",
        event => {

            areaBrushSize =
                Number(
                    event.target.value
                );


            document
                .getElementById(
                    "brushSizeValue"
                )
                .textContent =
                areaBrushSize;
        }
    );


// ======================================================
// KRAJINY
// ======================================================

document
    .getElementById(
        "createCountryBtn"
    )
    .addEventListener(
        "click",
        createCountry
    );


// ======================================================
// MESTÁ
// ======================================================

document
    .getElementById(
        "createCityBtn"
    )
    .addEventListener(
        "click",
        createCity
    );


document
    .getElementById(
        "cityPlaceBtn"
    )
    .addEventListener(
        "click",
        () => {

            infraTool =
                "cityPlace";

            updateCityTools();
        }
    );


document
    .getElementById(
        "cityEraserBtn"
    )
    .addEventListener(
        "click",
        () => {

            infraTool =
                "cityEraser";

            updateCityTools();
        }
    );


// ======================================================
// ZOOM TLAČIDLÁ
// ======================================================

document
    .getElementById(
        "zoomInBtn"
    )
    .addEventListener(
        "click",
        () => {

            setZoom(
                zoom * 1.2
            );
        }
    );


document
    .getElementById(
        "zoomOutBtn"
    )
    .addEventListener(
        "click",
        () => {

            setZoom(
                zoom * 0.8
            );
        }
    );


// ======================================================
// ULOŽENIE SVETA
// ======================================================

document
    .getElementById(
        "saveBtn"
    )
    .addEventListener(
        "click",
        saveWorld
    );


function saveWorld() {

    const data = {

        version: 1,

        mapWidth:
            MAP_WIDTH,

        mapHeight:
            MAP_HEIGHT,

        world,

        areas,

        countries,

        cities
    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "my-world.json";


    document
        .body
        .appendChild(link);


    link.click();

    link.remove();


    URL.revokeObjectURL(url);
}


// ======================================================
// NAČÍTANIE SVETA
// ======================================================

document
    .getElementById(
        "loadBtn"
    )
    .addEventListener(
        "click",
        loadWorld
    );


function loadWorld() {

    const input =
        document.createElement(
            "input"
        );


    input.type = "file";

    input.accept =
        "application/json,.json";


    input.addEventListener(
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
                () => {

                    try {

                        const data =
                            JSON.parse(
                                reader.result
                            );


                        if (
                            !data.world ||
                            !data.areas ||
                            !data.countries ||
                            !data.cities
                        ) {

                            throw new Error(
                                "Neplatný súbor."
                            );
                        }


                        if (
                            data.world.length !==
                            MAP_HEIGHT
                        ) {

                            throw new Error(
                                "Nesprávna výška mapy."
                            );
                        }


                        world =
                            data.world;

                        areas =
                            data.areas;

                        countries =
                            data.countries;

                        cities =
                            data.cities;


                        selectedArea = null;
                        selectedCountry = null;
                        selectedCity = null;


                        updateAreaList();

                        updateCountryList();

                        updateCityList();

                        draw();


                        alert(
                            "Svet bol úspešne načítaný."
                        );

                    } catch (error) {

                        alert(
                            "Nepodarilo sa načítať svet."
                        );

                        console.error(
                            error
                        );
                    }
                };


            reader.readAsText(file);
        }
    );


    input.click();
}


// ======================================================
// VYMAZANIE SVETA
// ======================================================

document
    .getElementById(
        "clearBtn"
    )
    .addEventListener(
        "click",
        clearWorld
    );


function clearWorld() {

    const confirmed =
        confirm(
            "Naozaj chceš vymazať celý svet?"
        );


    if (!confirmed) {
        return;
    }


    createWorld();

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


// ======================================================
// ZAČIATOČNÉ NASTAVENIE
// ======================================================

resizeCanvas();

updateZoomDisplay();

updateAreaList();

updateCountryList();

updateCityList();

updateCityTools();

setMode("terrain");
```
