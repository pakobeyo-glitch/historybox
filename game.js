```javascript
document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // CANVAS
    // =========================================================

    const canvas = document.getElementById("gameCanvas");

    if (!canvas) {
        console.error("Chýba #gameCanvas");
        return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        console.error("Canvas nepodporuje 2D.");
        return;
    }


    // =========================================================
    // MAPA
    // =========================================================

    const TILE_SIZE = 32;
    const MAP_WIDTH = 200;
    const MAP_HEIGHT = 200;


    // =========================================================
    // ZOOM / POSUN
    // =========================================================

    let zoom = 1;

    const MIN_ZOOM = 0.15;
    const MAX_ZOOM = 4;

    let offsetX = 20;
    let offsetY = 20;


    // =========================================================
    // TERÉN
    // =========================================================

    const terrainTypes = {

        lowland: {
            name: "Nížina",
            color: "#8dbb65"
        },

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


    // =========================================================
    // SVET
    // =========================================================

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


    // =========================================================
    // OBLASTI / KRAJINY / MESTÁ
    // =========================================================

    let areas = {};
    let countries = {};
    let cities = {};

    let selectedArea = null;
    let selectedCountry = null;
    let selectedCity = null;


    // =========================================================
    // REŽIM
    // =========================================================

    let currentMode = "terrain";


    // =========================================================
    // NÁSTROJE
    // =========================================================

    let areaTool = "brush";
    let infraTool = "cityPlace";

    let terrainBrushSize = 1;
    let areaBrushSize = 1;

    let selectedTerrain = "lowland";


    // =========================================================
    // MYŠ
    // =========================================================

    let mouseDown = false;
    let isPanning = false;

    let lastMouseX = 0;
    let lastMouseY = 0;

    let mouseWorldX = -1;
    let mouseWorldY = -1;


    // =========================================================
    // POMOCNÉ
    // =========================================================

    function get(id) {
        return document.getElementById(id);
    }


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
                -offsetX /
                (TILE_SIZE * zoom)
            ) - 1
        );

        const startY = Math.max(
            0,
            Math.floor(
                -offsetY /
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


    // =========================================================
    // VEĽKOSŤ CANVASU
    // =========================================================

    function resizeCanvas() {

        const parent = canvas.parentElement;

        if (!parent) {
            return;
        }

        const width = parent.clientWidth;
        const height = parent.clientHeight;

        if (width <= 0 || height <= 0) {
            return;
        }

        canvas.width = width;
        canvas.height = height;

        draw();

    }

    window.addEventListener("resize", resizeCanvas);


    // =========================================================
    // KRESLENIE TERÉNU
    // =========================================================

    function drawTerrain() {

        const bounds = getVisibleBounds();

        for (let y = bounds.startY; y < bounds.endY; y++) {

            for (let x = bounds.startX; x < bounds.endX; x++) {

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


    // =========================================================
    // OBLASTI
    // =========================================================

    function drawAreas() {

        const bounds = getVisibleBounds();

        for (let y = bounds.startY; y < bounds.endY; y++) {

            for (let x = bounds.startX; x < bounds.endX; x++) {

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

                ctx.fillStyle = "#999999";

                ctx.fillRect(
                    px,
                    py,
                    size,
                    size
                );

            }

        }


        // Hranice

        ctx.save();

        ctx.strokeStyle = "#f39c12";
        ctx.lineWidth = Math.max(1, 2 * zoom);

        for (let y = bounds.startY; y < bounds.endY; y++) {

            for (let x = bounds.startX; x < bounds.endX; x++) {

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

        ctx.restore();

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

            ctx.fillStyle = "rgba(0,0,0,0.7)";

            ctx.fillText(
                area.name,
                px + 1,
                py + 1
            );

            ctx.fillStyle = "#fff";

            ctx.fillText(
                area.name,
                px,
                py
            );

            ctx.restore();

        }

    }


    // =========================================================
    // KRAJINY
    // =========================================================

    function drawCountries() {

        const bounds = getVisibleBounds();

        for (let y = bounds.startY; y < bounds.endY; y++) {

            for (let x = bounds.startX; x < bounds.endX; x++) {

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
                ctx.fillStyle = country.color;

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


    function drawCountryNames() {

        for (const id in countries) {

            const country = countries[id];

            let totalX = 0;
            let totalY = 0;
            let count = 0;

            for (let y = 0; y < MAP_HEIGHT; y++) {

                for (let x = 0; x < MAP_WIDTH; x++) {

                    if (world[y][x].country === id) {

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

            ctx.fillStyle = "#fff";

            ctx.fillText(
                country.name,
                px,
                py
            );

            ctx.restore();

        }

    }


    // =========================================================
    // MESTÁ
    // =========================================================

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

            // bodka

            ctx.fillStyle = "#e53935";

            ctx.beginPath();

            ctx.arc(
                px,
                py,
                Math.max(3, 5 * zoom),
                0,
                Math.PI * 2
            );

            ctx.fill();


            // obruba

            ctx.strokeStyle =
                "rgba(255,255,255,0.8)";

            ctx.lineWidth =
                Math.max(1, zoom);

            ctx.stroke();


            // názov

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

            ctx.fillStyle = "#fff";

            ctx.fillText(
                city.name,
                px + 9 * zoom,
                py
            );

            ctx.restore();

        }

    }


    // =========================================================
    // MRIEŽKA
    // =========================================================

    function drawGrid() {

        if (zoom < 0.35) {
            return;
        }

        const bounds = getVisibleBounds();

        ctx.save();

        ctx.strokeStyle =
            "rgba(0,0,0,0.14)";

        ctx.lineWidth = 1;

        for (let x = bounds.startX; x <= bounds.endX; x++) {

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


        for (let y = bounds.startY; y <= bounds.endY; y++) {

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


    // =========================================================
    // HLAVNÉ KRESLENIE
    // =========================================================

    function draw() {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        // tmavé pozadie mimo mapy

        ctx.fillStyle = "#101010";

        ctx.fillRect(
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


    // =========================================================
    // OBLASTI
    // =========================================================

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
                        tile.x !== x ||
                        tile.y !== y
                );

        }

        world[y][x].area = null;

    }


    function addTileToArea(areaId, x, y) {

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


    // =========================================================
    // TERÉN
    // =========================================================

    function paintTerrain(x, y) {

        if (!isInsideMap(x, y)) {
            return;
        }

        const radius =
            Math.floor(
                terrainBrushSize / 2
            );

        for (let dy = -radius; dy <= radius; dy++) {

            for (let dx = -radius; dx <= radius; dx++) {

                const tx = x + dx;
                const ty = y + dy;

                if (!isInsideMap(tx, ty)) {
                    continue;
                }

                world[ty][tx].terrain =
                    selectedTerrain;

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


    // =========================================================
    // MAĽOVANIE OBLASTÍ
    // =========================================================

    function paintArea(x, y) {

        if (!isInsideMap(x, y)) {
            return;
        }

        const radius =
            Math.floor(
                areaBrushSize / 2
            );

        for (let dy = -radius; dy <= radius; dy++) {

            for (let dx = -radius; dx <= radius; dx++) {

                const tx = x + dx;
                const ty = y + dy;

                if (!isInsideMap(tx, ty)) {
                    continue;
                }

                const tile =
                    world[ty][tx];

                if (
                    tile.terrain === "river" ||
                    tile.terrain === "sea"
                ) {
                    continue;
                }

                if (areaTool === "eraser") {

                    removeTileFromArea(
                        tx,
                        ty
                    );

                    continue;
                }

                if (!selectedArea) {
                    continue;
                }

                if (
                    tile.area &&
                    tile.area !== selectedArea
                ) {

                    removeTileFromArea(
                        tx,
                        ty
                    );

                }

                tile.area = selectedArea;

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


    // =========================================================
    // VYTVORENIE OBLASTI
    // =========================================================

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
            name: name.trim(),
            tiles: []
        };

        selectedArea = id;

        updateAreaList();
        draw();

    }


    // =========================================================
    // KRAJINY
    // =========================================================

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

            name: name.trim(),

            color:
                randomCountryColor()

        };

        selectedCountry = id;

        updateCountryList();
        draw();

    }


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


    function handleCountryClick(x, y) {

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

    }


    // =========================================================
    // MESTÁ
    // =========================================================

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

            name: name.trim(),

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


    function placeCity(x, y) {

        if (!selectedCity) {
            return;
        }

        if (!isInsideMap(x, y)) {
            return;
        }

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


    // =========================================================
    // ZOZNAM OBLASTÍ
    // =========================================================

    function updateAreaList() {

        const list =
            get("areaList");

        if (!list) {
            return;
        }

        list.innerHTML = "";

        for (const id in areas) {

            const area = areas[id];

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "area-btn";

            if (selectedArea === id) {
                button.classList.add("active");
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


    // =========================================================
    // ZOZNAM KRAJÍN
    // =========================================================

    function updateCountryList() {

        const list =
            get("countryList");

        if (!list) {
            return;
        }

        list.innerHTML = "";

        for (const id in countries) {

            const country =
                countries[id];

            const button =
                document.createElement("button");

            button.type = "button";
            button.className =
                "country-btn";

            if (selectedCountry === id) {
                button.classList.add("active");
            }

            const dot =
                document.createElement("span");

            dot.style.display =
                "inline-block";

            dot.style.width = "12px";
            dot.style.height = "12px";
            dot.style.borderRadius = "50%";
            dot.style.background =
                country.color;

            dot.style.marginRight = "8px";

            button.appendChild(dot);

            button.appendChild(
                document.createTextNode(
                    country.name
                )
            );

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


    // =========================================================
    // ZOZNAM MIEST
    // =========================================================

    function updateCityList() {

        const list =
            get("cityList");

        if (!list) {
            return;
        }

        list.innerHTML = "";

        for (const id in cities) {

            const city = cities[id];

            const button =
                document.createElement("button");

            button.type = "button";
            button.className =
                "city-btn";

            if (selectedCity === id) {
                button.classList.add("active");
            }

            button.textContent =
                "🔴 " + city.name;

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


    // =========================================================
    // REŽIMY
    // =========================================================

    function setMode(mode) {

        currentMode = mode;

        const panels = {

            terrain:
                get("terrainPanel"),

            area:
                get("areaPanel"),

            country:
                get("countryPanel"),

            infra:
                get("infraPanel")

        };


        for (const key in panels) {

            const panel =
                panels[key];

            if (!panel) {
                continue;
            }

            panel.classList.toggle(
                "hidden",
                key !== mode
            );

        }


        // Tvoj HTML používa .layer-btn,
        // nie .mode-tab.

        document
            .querySelectorAll(".layer-btn")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.id ===
                    modeButtonId(mode)
                );

            });


        draw();

    }


    function modeButtonId(mode) {

        if (mode === "terrain") {
            return "terrainLayerBtn";
        }

        if (mode === "area") {
            return "areaLayerBtn";
        }

        if (mode === "country") {
            return "countryLayerBtn";
        }

        if (mode === "infra") {
            return "infraLayerBtn";
        }

        return "";

    }


    // =========================================================
    // MESTÁ — NÁSTROJE
    // =========================================================

    function updateCityTools() {

        const place =
            get("cityPlaceBtn");

        const eraser =
            get("cityEraserBtn");

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


    // =========================================================
    // ZOOM
    // =========================================================

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
            get("zoomValue");

        if (!element) {
            return;
        }

        element.textContent =
            Math.round(zoom * 100) + "%";

    }


    // =========================================================
    // KOLESKO
    // =========================================================

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


    // =========================================================
    // MYŠ — DOWN
    // =========================================================

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


            // pravé tlačidlo = posun

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


            const pos =
                screenToWorld(
                    mouseX,
                    mouseY
                );

            mouseWorldX = pos.x;
            mouseWorldY = pos.y;

            updateCoordinates();


            if (currentMode === "terrain") {

                mouseDown = true;

                paintTerrain(
                    pos.x,
                    pos.y
                );

                return;

            }


            if (currentMode === "area") {

                mouseDown = true;

                paintArea(
                    pos.x,
                    pos.y
                );

                return;

            }


            if (currentMode === "country") {

                handleCountryClick(
                    pos.x,
                    pos.y
                );

                return;

            }


            if (currentMode === "infra") {

                if (
                    infraTool === "cityPlace"
                ) {

                    placeCity(
                        pos.x,
                        pos.y
                    );

                }

                else if (
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


    // =========================================================
    // MYŠ — MOVE
    // =========================================================

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


            if (currentMode === "terrain") {

                paintTerrain(
                    pos.x,
                    pos.y
                );

            }

            else if (currentMode === "area") {

                paintArea(
                    pos.x,
                    pos.y
                );

            }

        }
    );


    // =========================================================
    // MYŠ — UP
    // =========================================================

    window.addEventListener(
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

            // necháme panning bežať,
            // aby pravé tlačidlo fungovalo aj mimo canvasu

        }
    );


    canvas.addEventListener(
        "contextmenu",
        event => {
            event.preventDefault();
        }
    );


    // =========================================================
    // SÚRADNICE
    // =========================================================

    function updateCoordinates() {

        const element =
            get("coordinates");

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

        }
        else {

            element.textContent =
                "X: — | Y: —";

        }

    }


    // =========================================================
    // HORNÉ TLAČIDLÁ
    // =========================================================

    const terrainLayerBtn =
        get("terrainLayerBtn");

    const areaLayerBtn =
        get("areaLayerBtn");

    const countryLayerBtn =
        get("countryLayerBtn");

    const infraLayerBtn =
        get("infraLayerBtn");


    if (terrainLayerBtn) {

        terrainLayerBtn.addEventListener(
            "click",
            () => setMode("terrain")
        );

    }


    if (areaLayerBtn) {

        areaLayerBtn.addEventListener(
            "click",
            () => setMode("area")
        );

    }


    if (countryLayerBtn) {

        countryLayerBtn.addEventListener(
            "click",
            () => setMode("country")
        );

    }


    if (infraLayerBtn) {

        infraLayerBtn.addEventListener(
            "click",
            () => setMode("infra")
        );

    }


    // =========================================================
    // TERÉN
    // =========================================================

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


    // =========================================================
    // OBLASTI
    // =========================================================

    const createAreaBtn =
        get("createAreaBtn");

    if (createAreaBtn) {

        createAreaBtn.addEventListener(
            "click",
            createArea
        );

    }


    const areaBrushBtn =
        get("areaBrushBtn");

    const areaEraserBtn =
        get("areaEraserBtn");


    if (areaBrushBtn) {

        areaBrushBtn.addEventListener(
            "click",
            () => {

                areaTool = "brush";

                areaBrushBtn.classList.add(
                    "active"
                );

                if (areaEraserBtn) {

                    areaEraserBtn.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (areaEraserBtn) {

        areaEraserBtn.addEventListener(
            "click",
            () => {

                areaTool = "eraser";

                areaEraserBtn.classList.add(
                    "active"
                );

                if (areaBrushBtn) {

                    areaBrushBtn.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    const brushSize =
        get("brushSize");

    if (brushSize) {

        brushSize.addEventListener(
            "input",
            event => {

                areaBrushSize =
                    Number(
                        event.target.value
                    );

            }
        );

    }


    // =========================================================
    // KRAJINY
    // =========================================================

    const createCountryBtn =
        get("createCountryBtn");

    if (createCountryBtn) {

        createCountryBtn.addEventListener(
            "click",
            createCountry
        );

    }


    // =========================================================
    // MESTÁ
    // =========================================================

    const createCityBtn =
        get("createCityBtn");

    if (createCityBtn) {

        createCityBtn.addEventListener(
            "click",
            createCity
        );

    }


    const cityPlaceBtn =
        get("cityPlaceBtn");

    const cityEraserBtn =
        get("cityEraserBtn");


    if (cityPlaceBtn) {

        cityPlaceBtn.addEventListener(
            "click",
            () => {

                infraTool =
                    "cityPlace";

                updateCityTools();

            }
        );

    }


    if (cityEraserBtn) {

        cityEraserBtn.addEventListener(
            "click",
            () => {

                infraTool =
                    "cityEraser";

                updateCityTools();

            }
        );

    }


    // =========================================================
    // ZOOM TLAČIDLÁ
    // =========================================================

    const zoomInBtn =
        get("zoomInBtn");

    const zoomOutBtn =
        get("zoomOutBtn");


    if (zoomInBtn) {

        zoomInBtn.addEventListener(
            "click",
            () => {

                setZoom(
                    zoom * 1.2
                );

            }
        );

    }


    if (zoomOutBtn) {

        zoomOutBtn.addEventListener(
            "click",
            () => {

                setZoom(
                    zoom * 0.8
                );

            }
        );

    }


    // =========================================================
    // ULOŽENIE
    // =========================================================

    function saveWorld() {

        const data = {

            version: 1,

            mapWidth: MAP_WIDTH,
            mapHeight: MAP_HEIGHT,

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
            document.createElement("a");

        link.href = url;
        link.download =
            "my-world.json";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    }


    const saveBtn =
        get("saveBtn");

    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            saveWorld
        );

    }


    // =========================================================
    // NAČÍTANIE
    // =========================================================

    function loadWorld() {

        const input =
            document.createElement("input");

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


                reader.onload = () => {

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

                    }
                    catch (error) {

                        console.error(error);

                        alert(
                            "Nepodarilo sa načítať svet."
                        );

                    }

                };


                reader.readAsText(file);

            }
        );


        input.click();

    }


    const loadBtn =
        get("loadBtn");

    if (loadBtn) {

        loadBtn.addEventListener(
            "click",
            loadWorld
        );

    }


    // =========================================================
    // VYMAZANIE SVETA
    // =========================================================

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


    const clearBtn =
        get("clearBtn");

    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            clearWorld
        );

    }


    // =========================================================
    // ŠTART
    // =========================================================

    updateZoomDisplay();

    updateAreaList();
    updateCountryList();
    updateCityList();

    updateCityTools();

    setMode("terrain");

    // Dôležité:
    // canvas dostane skutočnú veľkosť až po načítaní stránky.

    resizeCanvas();

    // ešte jedno vykreslenie pre istotu

    requestAnimationFrame(() => {
        resizeCanvas();
        draw();
    });


    console.log(
        "My World Game: mapa a JavaScript sú načítané."
    );

});
```
