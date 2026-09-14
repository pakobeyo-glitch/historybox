/* =========================================
   NASTAVENIE
========================================= */

const TILE_SIZE = 32;

const MAP_WIDTH = 80;
const MAP_HEIGHT = 50;


/* =========================================
   CANVAS
========================================= */

const canvas =
    document.getElementById("mapCanvas");

const ctx =
    canvas.getContext("2d");

const canvasContainer =
    document.getElementById("canvasContainer");


/* =========================================
   TERÉNY
========================================= */

const terrainTypes = {

    sea: {
        name: "More",
        color: "#2879b8"
    },

    river: {
        name: "Rieka",
        color: "#42a5f5"
    },

    lowland: {
        name: "Nížina",
        color: "#79b84b"
    },

    forest: {
        name: "Les",
        color: "#276b38"
    },

    desert: {
        name: "Púšť",
        color: "#d8b15a"
    },

    mountains: {
        name: "Hory",
        color: "#777777"
    },

    high_mountains: {
        name: "Vysoké hory",
        color: "#d6d6d6"
    },

    tundra: {
        name: "Tundra",
        color: "#a8c5b5"
    }

};


/* =========================================
   SVET
========================================= */

let world = [];

let areas = {};

let countries = {};


/* =========================================
   VYTVORENIE MAPY
========================================= */

function createWorld() {

    world = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {

        const row = [];

        for (let x = 0; x < MAP_WIDTH; x++) {

            row.push({

                terrain: "lowland",

                area: null,

                country: null

            });

        }

        world.push(row);

    }

}


/* =========================================
   REŽIM
========================================= */

let currentLayer = "terrain";

let selectedTerrain = "lowland";

let selectedArea = null;

let selectedCountry = null;


/* =========================================
   NÁSTROJE
========================================= */

let currentTool = "brush";

let terrainBrushSize = 1;

let areaBrushSize = 1;


/* =========================================
   ZOOM
========================================= */

let zoom = 1;

let offsetX = 50;

let offsetY = 70;

let isPanning = false;

let panStartX = 0;

let panStartY = 0;

const originalOffsetX = 50;

const originalOffsetY = 70;


/* =========================================
   CANVAS
========================================= */

function resizeCanvas() {

    canvas.width =
        canvasContainer.clientWidth;

    canvas.height =
        canvasContainer.clientHeight;

    drawMap();

}

window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================================
   MYŠ → DLAŽDICA
========================================= */

function getTileFromMouse(event) {

    const rect =
        canvas.getBoundingClientRect();

    const mouseX =
        event.clientX - rect.left;

    const mouseY =
        event.clientY - rect.top;

    const x = Math.floor(
        (mouseX - offsetX) /
        (TILE_SIZE * zoom)
    );

    const y = Math.floor(
        (mouseY - offsetY) /
        (TILE_SIZE * zoom)
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


/* =========================================
   VYKRESLENIE
========================================= */

function drawMap() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#0b1120";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    const tilePixelSize =
        TILE_SIZE * zoom;


    for (let y = 0; y < MAP_HEIGHT; y++) {

        for (let x = 0; x < MAP_WIDTH; x++) {

            const tile =
                world[y][x];

            const px =
                offsetX +
                x * tilePixelSize;

            const py =
                offsetY +
                y * tilePixelSize;


            /* TERÉN */

            ctx.fillStyle =
                terrainTypes[
                    tile.terrain
                ].color;

            ctx.fillRect(
                px,
                py,
                tilePixelSize + 1,
                tilePixelSize + 1
            );


            /* OBLASŤ */

            if (
                currentLayer === "area" ||
                currentLayer === "country"
            ) {

                if (tile.area) {

                    const area =
                        areas[tile.area];

                    if (area) {

                        ctx.fillStyle =
                            hexToRgba(
                                area.color,
                                0.35
                            );

                        ctx.fillRect(
                            px,
                            py,
                            tilePixelSize + 1,
                            tilePixelSize + 1
                        );

                    }

                }

            }


            /* KRAJINA */

            if (currentLayer === "country") {

                if (tile.country) {

                    const country =
                        countries[tile.country];

                    if (country) {

                        ctx.fillStyle =
                            hexToRgba(
                                country.color,
                                0.45
                            );

                        ctx.fillRect(
                            px,
                            py,
                            tilePixelSize + 1,
                            tilePixelSize + 1
                        );

                    }

                }

            }


            /* MRIEŽKA */

            ctx.strokeStyle =
                "rgba(0,0,0,0.15)";

            ctx.lineWidth = 1;

            ctx.strokeRect(
                px,
                py,
                tilePixelSize,
                tilePixelSize
            );

        }

    }


    if (
        currentLayer === "area" ||
        currentLayer === "country"
    ) {

        drawAreaBorders();

    }


    if (currentLayer === "area") {

        drawAreaNames();

    }


    if (currentLayer === "country") {

        drawCountryNames();

    }

}


/* =========================================
   HRANICE OBLASTÍ
========================================= */

function drawAreaBorders() {

    const size =
        TILE_SIZE * zoom;

    ctx.lineWidth =
        Math.max(1, 2 * zoom);

    for (let y = 0; y < MAP_HEIGHT; y++) {

        for (let x = 0; x < MAP_WIDTH; x++) {

            const tile =
                world[y][x];

            if (!tile.area) {
                continue;
            }


            /* PRAVÁ HRANICA */

            if (
                x === MAP_WIDTH - 1 ||
                world[y][x + 1].area !== tile.area
            ) {

                ctx.strokeStyle =
                    "#ff9f43";

                ctx.beginPath();

                ctx.moveTo(
                    offsetX + (x + 1) * size,
                    offsetY + y * size
                );

                ctx.lineTo(
                    offsetX + (x + 1) * size,
                    offsetY + (y + 1) * size
                );

                ctx.stroke();

            }


            /* SPODNÁ HRANICA */

            if (
                y === MAP_HEIGHT - 1 ||
                world[y + 1][x].area !== tile.area
            ) {

                ctx.strokeStyle =
                    "#ff9f43";

                ctx.beginPath();

                ctx.moveTo(
                    offsetX + x * size,
                    offsetY + (y + 1) * size
                );

                ctx.lineTo(
                    offsetX + (x + 1) * size,
                    offsetY + (y + 1) * size
                );

                ctx.stroke();

            }

        }

    }

}


/* =========================================
   NÁZVY OBLASTÍ
========================================= */

function drawAreaNames() {

    const positions = {};

    for (let y = 0; y < MAP_HEIGHT; y++) {

        for (let x = 0; x < MAP_WIDTH; x++) {

            const id =
                world[y][x].area;

            if (!id) {
                continue;
            }

            if (!positions[id]) {

                positions[id] = {
                    x: 0,
                    y: 0,
                    count: 0
                };

            }

            positions[id].x += x;
            positions[id].y += y;
            positions[id].count++;

        }

    }


    Object.keys(positions).forEach(id => {

        const p =
            positions[id];

        const area =
            areas[id];

        if (!area) {
            return;
        }

        const centerX =
            p.x / p.count;

        const centerY =
            p.y / p.count;


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


        drawLabel(
            area.name,
            px,
            py
        );

    });

}


/* =========================================
   NÁZVY KRAJÍN
========================================= */

function drawCountryNames() {

    const positions = {};

    for (let y = 0; y < MAP_HEIGHT; y++) {

        for (let x = 0; x < MAP_WIDTH; x++) {

            const id =
                world[y][x].country;

            if (!id) {
                continue;
            }

            if (!positions[id]) {

                positions[id] = {
                    x: 0,
                    y: 0,
                    count: 0
                };

            }

            positions[id].x += x;
            positions[id].y += y;
            positions[id].count++;

        }

    }


    Object.keys(positions).forEach(id => {

        const p =
            positions[id];

        const country =
            countries[id];

        if (!country) {
            return;
        }

        const centerX =
            p.x / p.count;

        const centerY =
            p.y / p.count;


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


        drawLabel(
            country.name,
            px,
            py
        );

    });

}


/* =========================================
   TEXT NA MAPE
========================================= */

function drawLabel(
    text,
    x,
    y
) {

    const fontSize =
        Math.max(10, 15 * zoom);

    ctx.font =
        `bold ${fontSize}px Arial`;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    const width =
        ctx.measureText(text).width;


    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.fillRect(
        x - width / 2 - 5,
        y - fontSize / 2 - 3,
        width + 10,
        fontSize + 6
    );


    ctx.fillStyle = "white";

    ctx.fillText(
        text,
        x,
        y
    );

}


/* =========================================
   HEX → RGBA
========================================= */

function hexToRgba(
    hex,
    alpha
) {

    const value =
        hex.replace("#", "");

    const r =
        parseInt(
            value.substring(0, 2),
            16
        );

    const g =
        parseInt(
            value.substring(2, 4),
            16
        );

    const b =
        parseInt(
            value.substring(4, 6),
            16
        );

    return `rgba(${r},${g},${b},${alpha})`;

}


/* =========================================
   TERÉN – ŠTETEC
========================================= */

function paintTerrain(
    x,
    y
) {

    const radius =
        Math.floor(
            terrainBrushSize / 2
        );


    for (
        let yy = y - radius;
        yy <= y + radius;
        yy++
    ) {

        for (
            let xx = x - radius;
            xx <= x + radius;
            xx++
        ) {

            if (
                xx < 0 ||
                yy < 0 ||
                xx >= MAP_WIDTH ||
                yy >= MAP_HEIGHT
            ) {
                continue;
            }


            if (
                currentTool === "eraser"
            ) {

                world[yy][xx].terrain =
                    "lowland";

            }

            else {

                world[yy][xx].terrain =
                    selectedTerrain;

            }

        }

    }

}


/* =========================================
   OBLASŤ – ŠTETEC / GUMA
========================================= */

function paintArea(
    x,
    y
) {

    const radius =
        Math.floor(
            areaBrushSize / 2
        );


    for (
        let yy = y - radius;
        yy <= y + radius;
        yy++
    ) {

        for (
            let xx = x - radius;
            xx <= x + radius;
            xx++
        ) {

            if (
                xx < 0 ||
                yy < 0 ||
                xx >= MAP_WIDTH ||
                yy >= MAP_HEIGHT
            ) {
                continue;
            }


            const tile =
                world[yy][xx];


            /* GUMA */

            if (
                currentTool === "eraser"
            ) {

                if (tile.area) {

                    removeTileFromArea(
                        tile.area,
                        xx,
                        yy
                    );

                }

                tile.area = null;

                continue;

            }


            /* ŠTETEC */

            if (!selectedArea) {
                continue;
            }


            /* Ak bola dlaždica
               v inej oblasti,
               odstránime ju odtiaľ */

            if (
                tile.area &&
                tile.area !== selectedArea
            ) {

                removeTileFromArea(
                    tile.area,
                    xx,
                    yy
                );

            }


            tile.area =
                selectedArea;


            const area =
                areas[selectedArea];


            if (
                !area.tiles.some(
                    t =>
                        t.x === xx &&
                        t.y === yy
                )
            ) {

                area.tiles.push({
                    x: xx,
                    y: yy
                });

            }

        }

    }


    drawMap();

}


/* =========================================
   ODSTRÁNENIE DLAŽDICE Z OBLASTI
========================================= */

function removeTileFromArea(
    areaId,
    x,
    y
) {

    if (!areas[areaId]) {
        return;
    }


    areas[areaId].tiles =
        areas[areaId].tiles.filter(
            tile =>
                !(
                    tile.x === x &&
                    tile.y === y
                )
        );

}


/* =========================================
   KRAJINA
========================================= */

function assignCountryToArea(
    x,
    y
) {

    if (!selectedCountry) {

        alert(
            "Najprv si vyber krajinu."
        );

        return;

    }


    const areaId =
        world[y][x].area;


    if (!areaId) {

        alert(
            "Táto dlaždica ešte nepatrí do žiadnej oblasti."
        );

        return;

    }


    for (
        let yy = 0;
        yy < MAP_HEIGHT;
        yy++
    ) {

        for (
            let xx = 0;
            xx < MAP_WIDTH;
            xx++
        ) {

            if (
                world[yy][xx].area === areaId
            ) {

                world[yy][xx].country =
                    selectedCountry;

            }

        }

    }


    drawMap();

}


/* =========================================
   NOVÁ OBLASŤ
========================================= */

function createArea() {

    const name =
        prompt(
            "Zadaj názov oblasti:"
        );

    if (!name) {
        return;
    }


    const id =
        "area_" + Date.now();


    areas[id] = {

        id: id,

        name: name,

        color: randomColor(),

        tiles: []

    };


    selectedArea = id;


    updateAreaList();

    drawMap();

}


/* =========================================
   NOVÁ KRAJINA
========================================= */

function createCountry() {

    const name =
        prompt(
            "Zadaj názov krajiny:"
        );

    if (!name) {
        return;
    }


    const id =
        "country_" + Date.now();


    countries[id] = {

        id: id,

        name: name,

        color: randomColor()

    };


    selectedCountry = id;


    updateCountryList();

    drawMap();

}


/* =========================================
   FARBY
========================================= */

function randomColor() {

    const colors = [

        "#ef4444",
        "#f97316",
        "#eab308",
        "#22c55e",
        "#14b8a6",
        "#06b6d4",
        "#3b82f6",
        "#6366f1",
        "#8b5cf6",
        "#d946ef",
        "#ec4899",
        "#f43f5e"

    ];


    return colors[
        Math.floor(
            Math.random() *
            colors.length
        )
    ];

}


/* =========================================
   ZOZNAM OBLASTÍ
========================================= */

function updateAreaList() {

    const list =
        document.getElementById(
            "areaList"
        );


    list.innerHTML = "";


    const ids =
        Object.keys(areas);


    if (ids.length === 0) {

        list.innerHTML =
            `<p class="empty-message">
                Zatiaľ nemáš žiadne oblasti.
            </p>`;

        return;

    }


    ids.forEach(id => {

        const area =
            areas[id];


        const button =
            document.createElement(
                "button"
            );


        button.className =
            "area-item";


        if (
            id === selectedArea
        ) {

            button.classList.add(
                "selected"
            );

        }


        button.innerHTML = `

            <span
                class="color-preview"
                style="background:${area.color}"
            ></span>

            <span>
                ${escapeHtml(area.name)}
            </span>

        `;


        button.addEventListener(
            "click",
            () => {

                selectedArea = id;

                updateAreaList();

                drawMap();

            }
        );


        list.appendChild(button);

    });

}


/* =========================================
   ZOZNAM KRAJÍN
========================================= */

function updateCountryList() {

    const list =
        document.getElementById(
            "countryList"
        );


    list.innerHTML = "";


    const ids =
        Object.keys(countries);


    if (ids.length === 0) {

        list.innerHTML =
            `<p class="empty-message">
                Zatiaľ nemáš žiadne krajiny.
            </p>`;

        return;

    }


    ids.forEach(id => {

        const country =
            countries[id];


        const button =
            document.createElement(
                "button"
            );


        button.className =
            "country-item";


        if (
            id === selectedCountry
        ) {

            button.classList.add(
                "selected"
            );

        }


        button.innerHTML = `

            <span
                class="color-preview"
                style="background:${country.color}"
            ></span>

            <span>
                ${escapeHtml(country.name)}
            </span>

        `;


        button.addEventListener(
            "click",
            () => {

                selectedCountry = id;

                updateCountryList();

                drawMap();

            }
        );


        list.appendChild(button);

    });

}


/* =========================================
   OCHRANA TEXTU
========================================= */

function escapeHtml(text) {

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================
   PREPÍNANIE REŽIMOV
========================================= */

function setLayer(
    layer
) {

    currentLayer =
        layer;


    document
        .getElementById(
            "terrainLayer"
        )
        .classList.toggle(
            "hidden",
            layer !== "terrain"
        );


    document
        .getElementById(
            "areaLayer"
        )
        .classList.toggle(
            "hidden",
            layer !== "area"
        );


    document
        .getElementById(
            "countryLayer"
        )
        .classList.toggle(
            "hidden",
            layer !== "country"
        );


    document
        .getElementById(
            "terrainModeBtn"
        )
        .classList.toggle(
            "active",
            layer === "terrain"
        );


    document
        .getElementById(
            "areaModeBtn"
        )
        .classList.toggle(
            "active",
            layer === "area"
        );


    document
        .getElementById(
            "countryModeBtn"
        )
        .classList.toggle(
            "active",
            layer === "country"
        );


    const modeText =
        document.getElementById(
            "currentModeText"
        );


    if (layer === "terrain") {

        modeText.textContent =
            "Režim: Upravovať terén";

        canvas.style.cursor =
            "crosshair";

    }

    else if (layer === "area") {

        modeText.textContent =
            "Režim: Maľovať oblasti";

        canvas.style.cursor =
            "crosshair";

    }

    else {

        modeText.textContent =
            "Režim: Maľovať krajiny";

        canvas.style.cursor =
            "pointer";

    }


    drawMap();

}


/* =========================================
   VÝBER TERÉNU
========================================= */

document
    .querySelectorAll(
        ".terrain-item"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".terrain-item"
                    )
                    .forEach(
                        b =>
                            b.classList.remove(
                                "selected"
                            )
                    );


                button.classList.add(
                    "selected"
                );


                selectedTerrain =
                    button.dataset.terrain;

            }
        );

    });


/* =========================================
   REŽIMY
========================================= */

document
    .getElementById(
        "terrainModeBtn"
    )
    .addEventListener(
        "click",
        () => setLayer("terrain")
    );


document
    .getElementById(
        "areaModeBtn"
    )
    .addEventListener(
        "click",
        () => setLayer("area")
    );


document
    .getElementById(
        "countryModeBtn"
    )
    .addEventListener(
        "click",
        () => setLayer("country")
    );


/* =========================================
   NOVÁ OBLASŤ
========================================= */

document
    .getElementById(
        "newAreaBtn"
    )
    .addEventListener(
        "click",
        createArea
    );


/* =========================================
   NOVÁ KRAJINA
========================================= */

document
    .getElementById(
        "newCountryBtn"
    )
    .addEventListener(
        "click",
        createCountry
    );


/* =========================================
   TERÉN – NÁSTROJE
========================================= */

document
    .getElementById(
        "brushBtn"
    )
    .addEventListener(
        "click",
        () => {

            currentTool =
                "brush";

            document
                .getElementById(
                    "brushBtn"
                )
                .classList.add(
                    "active"
                );

            document
                .getElementById(
                    "eraserBtn"
                )
                .classList.remove(
                    "active"
                );

        }
    );


document
    .getElementById(
        "eraserBtn"
    )
    .addEventListener(
        "click",
        () => {

            currentTool =
                "eraser";

            document
                .getElementById(
                    "eraserBtn"
                )
                .classList.add(
                    "active"
                );

            document
                .getElementById(
                    "brushBtn"
                )
                .classList.remove(
                    "active"
                );

        }
    );


/* =========================================
   OBLASTI – NÁSTROJE
========================================= */

document
    .getElementById(
        "areaBrushBtn"
    )
    .addEventListener(
        "click",
        () => {

            currentTool =
                "brush";

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

            currentTool =
                "eraser";

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


/* =========================================
   VEĽKOSŤ TERÉNNEHO ŠTETCA
========================================= */

document
    .getElementById(
        "brushSize"
    )
    .addEventListener(
        "input",
        event => {

            terrainBrushSize =
                Number(
                    event.target.value
                );


            document
                .getElementById(
                    "brushSizeValue"
                )
                .textContent =
                    terrainBrushSize;

        }
    );


/* =========================================
   VEĽKOSŤ OBLASTNÉHO ŠTETCA
========================================= */

document
    .getElementById(
        "areaBrushSize"
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
                    "areaBrushSizeValue"
                )
                .textContent =
                    areaBrushSize;

        }
    );


/* =========================================
   KLIKNUTIE NA MAPU
========================================= */

canvas.addEventListener(
    "mousedown",
    event => {

        /* Pravé tlačidlo = posúvanie */

        if (event.button === 2) {

            isPanning = true;

            panStartX =
                event.clientX - offsetX;

            panStartY =
                event.clientY - offsetY;

            canvas.style.cursor =
                "grabbing";

            return;

        }


        if (event.button !== 0) {
            return;
        }


        const tile =
            getTileFromMouse(event);


        if (!tile) {
            return;
        }


        /* TERÉN */

        if (
            currentLayer === "terrain"
        ) {

            paintTerrain(
                tile.x,
                tile.y
            );

            drawMap();

        }


        /* OBLASŤ */

        else if (
            currentLayer === "area"
        ) {

            paintArea(
                tile.x,
                tile.y
            );

        }


        /* KRAJINA */

        else if (
            currentLayer === "country"
        ) {

            assignCountryToArea(
                tile.x,
                tile.y
            );

        }

    }
);


/* =========================================
   ŤAHANIE MYŠOU
========================================= */

canvas.addEventListener(
    "mousemove",
    event => {

        updateCoordinates(event);


        /* POSÚVANIE */

        if (isPanning) {

            offsetX =
                event.clientX -
                panStartX;

            offsetY =
                event.clientY -
                panStartY;

            drawMap();

            return;

        }


        if (event.buttons !== 1) {
            return;
        }


        const tile =
            getTileFromMouse(event);


        if (!tile) {
            return;
        }


        /* TERÉN */

        if (
            currentLayer === "terrain"
        ) {

            paintTerrain(
                tile.x,
                tile.y
            );

            drawMap();

        }


        /* OBLASŤ */

        else if (
            currentLayer === "area"
        ) {

            paintArea(
                tile.x,
                tile.y
            );

        }

    }
);


/* =========================================
   KONIEC POSÚVANIA
========================================= */

window.addEventListener(
    "mouseup",
    () => {

        isPanning = false;

        canvas.style.cursor =
            currentLayer === "country"
                ? "pointer"
                : "crosshair";

    }
);


/* =========================================
   ZÁKAZ PRAVÉHO MENU
========================================= */

canvas.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();

    }
);


/* =========================================
   SÚRADNICE
========================================= */

function updateCoordinates(
    event
) {

    const tile =
        getTileFromMouse(event);


    const text =
        document.getElementById(
            "mapCoordinates"
        );


    if (!tile) {

        text.textContent =
            "X: - | Y: -";

        return;

    }


    text.textContent =
        `X: ${tile.x} | Y: ${tile.y}`;

}


/* =========================================
   ZOOM
========================================= */

function setZoom(
    newZoom
) {

    zoom =
        Math.max(
            0.25,
            Math.min(
                4,
                newZoom
            )
        );


    document
        .getElementById(
            "zoomValue"
        )
        .textContent =
            Math.round(
                zoom * 100
            ) + "%";


    drawMap();

}


document
    .getElementById(
        "zoomIn"
    )
    .addEventListener(
        "click",
        () => {

            setZoom(
                zoom * 1.25
            );

        }
    );


document
    .getElementById(
        "zoomOut"
    )
    .addEventListener(
        "click",
        () => {

            setZoom(
                zoom / 1.25
            );

        }
    );


document
    .getElementById(
        "resetView"
    )
    .addEventListener(
        "click",
        () => {

            zoom = 1;

            offsetX =
                originalOffsetX;

            offsetY =
                originalOffsetY;

            document
                .getElementById(
                    "zoomValue"
                )
                .textContent =
                    "100%";

            drawMap();

        }
    );


/* =========================================
   ZOOM KOLESOM
========================================= */

canvas.addEventListener(
    "wheel",
    event => {

        event.preventDefault();


        const oldZoom =
            zoom;


        if (event.deltaY < 0) {

            zoom *= 1.1;

        }

        else {

            zoom /= 1.1;

        }


        zoom =
            Math.max(
                0.25,
                Math.min(
                    4,
                    zoom
                )
            );


        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;

        const mouseY =
            event.clientY -
            rect.top;


        const worldX =
            (mouseX - offsetX) /
            (TILE_SIZE * oldZoom);

        const worldY =
            (mouseY - offsetY) /
            (TILE_SIZE * oldZoom);


        offsetX =
            mouseX -
            worldX *
            TILE_SIZE *
            zoom;

        offsetY =
            mouseY -
            worldY *
            TILE_SIZE *
            zoom;


        document
            .getElementById(
                "zoomValue"
            )
            .textContent =
                Math.round(
                    zoom * 100
                ) + "%";


        drawMap();

    },
    {
        passive: false
    }
);


/* =========================================
   ULOŽENIE
========================================= */

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

        mapWidth: MAP_WIDTH,

        mapHeight: MAP_HEIGHT,

        world: world,

        areas: areas,

        countries: countries

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
        URL.createObjectURL(blob);


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "moj-svet.json";


    link.click();


    URL.revokeObjectURL(url);

}


/* =========================================
   NAČÍTANIE
========================================= */

document
    .getElementById(
        "loadBtn"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "loadFile"
                )
                .click();

        }
    );


document
    .getElementById(
        "loadFile"
    )
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


            reader.onload =
                function(e) {

                    try {

                        const data =
                            JSON.parse(
                                e.target.result
                            );


                        if (
                            !data.world ||
                            !data.areas ||
                            !data.countries
                        ) {

                            throw new Error(
                                "Neplatný súbor."
                            );

                        }


                        world =
                            data.world;

                        areas =
                            data.areas;

                        countries =
                            data.countries;


                        selectedArea =
                            null;

                        selectedCountry =
                            null;


                        updateAreaList();

                        updateCountryList();

                        drawMap();


                        alert(
                            "Svet bol úspešne načítaný."
                        );

                    }

                    catch (error) {

                        alert(
                            "Súbor sa nepodarilo načítať."
                        );

                        console.error(
                            error
                        );

                    }

                };


            reader.readAsText(file);

        }
    );


/* =========================================
   VYMAZANIE
========================================= */

document
    .getElementById(
        "clearBtn"
    )
    .addEventListener(
        "click",
        () => {

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

            selectedArea = null;

            selectedCountry = null;


            updateAreaList();

            updateCountryList();

            drawMap();

        }
    );


/* =========================================
   ŠTART
========================================= */

createWorld();

updateAreaList();

updateCountryList();

resizeCanvas();

drawMap();
