document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const gameArea = document.getElementById("gameArea");
    const coordinates = document.getElementById("coordinates");
    const zoomValue = document.getElementById("zoomValue");

    const WORLD_WIDTH = 200;
    const WORLD_HEIGHT = 200;
    const TILE_SIZE = 32;

    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;

    let isPanning = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    let selectedTerrain = "lowland";
    let currentLayer = "terrain";

    let world = [];


    /* =========================
       SVET
    ========================= */

    function createWorld() {

        world = [];

        for (let y = 0; y < WORLD_HEIGHT; y++) {

            const row = [];

            for (let x = 0; x < WORLD_WIDTH; x++) {

                row.push({
                    terrain: "lowland",
                    area: null,
                    country: null,
                    city: null
                });

            }

            world.push(row);
        }
    }


    /* =========================
       RESIZE
    ========================= */

    function resizeCanvas() {

        const rect = gameArea.getBoundingClientRect();

        canvas.width = Math.max(1, Math.floor(rect.width));
        canvas.height = Math.max(1, Math.floor(rect.height));

        draw();
    }


    window.addEventListener("resize", resizeCanvas);


    /* =========================
       TERÉN FARBY
    ========================= */

    const terrainColors = {

        lowland: "#7fa85b",
        forest: "#397044",

        mountain: "#88806d",
        highMountain: "#d8d8d8",

        desert: "#d9b65d",
        tundra: "#aeb9b4",

        river: "#368ed1",
        sea: "#286aa8"
    };


    /* =========================
       DRAW
    ========================= */

    function draw() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();

        ctx.translate(offsetX, offsetY);
        ctx.scale(zoom, zoom);


        /*
         * MAPA
         */

        const startX = Math.max(
            0,
            Math.floor(-offsetX / zoom / TILE_SIZE) - 1
        );

        const startY = Math.max(
            0,
            Math.floor(-offsetY / zoom / TILE_SIZE) - 1
        );

        const endX = Math.min(
            WORLD_WIDTH,
            Math.ceil(
                (canvas.width - offsetX) /
                zoom /
                TILE_SIZE
            ) + 1
        );

        const endY = Math.min(
            WORLD_HEIGHT,
            Math.ceil(
                (canvas.height - offsetY) /
                zoom /
                TILE_SIZE
            ) + 1
        );


        for (let y = startY; y < endY; y++) {

            for (let x = startX; x < endX; x++) {

                const tile = world[y][x];

                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;


                /* TERÉN */

                ctx.fillStyle =
                    terrainColors[tile.terrain] ||
                    terrainColors.lowland;

                ctx.fillRect(
                    px,
                    py,
                    TILE_SIZE,
                    TILE_SIZE
                );


                /* MREŽKA */

                ctx.strokeStyle = "rgba(0,0,0,0.12)";
                ctx.lineWidth = 1 / zoom;

                ctx.strokeRect(
                    px,
                    py,
                    TILE_SIZE,
                    TILE_SIZE
                );


                /* OBLASŤ */

                if (tile.area !== null) {

                    ctx.strokeStyle = "#f39c12";
                    ctx.lineWidth = 2 / zoom;

                    ctx.strokeRect(
                        px + 1,
                        py + 1,
                        TILE_SIZE - 2,
                        TILE_SIZE - 2
                    );
                }


                /* KRAJINA */

                if (tile.country !== null) {

                    ctx.fillStyle = "rgba(255, 60, 60, 0.15)";

                    ctx.fillRect(
                        px,
                        py,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }


                /* MESTO */

                if (tile.city !== null) {

                    ctx.beginPath();

                    ctx.fillStyle = "#e53935";

                    ctx.arc(
                        px + TILE_SIZE / 2,
                        py + TILE_SIZE / 2,
                        5,
                        0,
                        Math.PI * 2
                    );

                    ctx.fill();


                    ctx.fillStyle = "white";
                    ctx.font = `${12 / zoom}px Arial`;

                    ctx.fillText(
                        tile.city,
                        px + TILE_SIZE + 3,
                        py + TILE_SIZE / 2
                    );
                }

            }
        }


        ctx.restore();


        /*
         * INFORMÁCIE O ZOOM
         */

        zoomValue.textContent =
            Math.round(zoom * 100) + "%";
    }


    /* =========================
       PREVOD MYŠ → TILE
    ========================= */

    function getTileFromMouse(event) {

        const rect = canvas.getBoundingClientRect();

        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const worldX =
            (mouseX - offsetX) / zoom;

        const worldY =
            (mouseY - offsetY) / zoom;

        const x =
            Math.floor(worldX / TILE_SIZE);

        const y =
            Math.floor(worldY / TILE_SIZE);

        return { x, y };
    }


    /* =========================
       ÚPRAVA TERÉNU
    ========================= */

    function paintTile(x, y) {

        if (
            x < 0 ||
            x >= WORLD_WIDTH ||
            y < 0 ||
            y >= WORLD_HEIGHT
        ) {
            return;
        }

        world[y][x].terrain = selectedTerrain;

        /*
         * Rieka a more nemôžu patriť do oblasti.
         */

        if (
            selectedTerrain === "river" ||
            selectedTerrain === "sea"
        ) {
            world[y][x].area = null;
            world[y][x].country = null;
        }

        draw();
    }


    /* =========================
       MOUSE
    ========================= */

    canvas.addEventListener("mousedown", event => {

        if (event.button === 2) {

            isPanning = true;

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;

            canvas.style.cursor = "grabbing";

            return;
        }


        if (event.button === 0) {

            const tile = getTileFromMouse(event);

            if (currentLayer === "terrain") {
                paintTile(tile.x, tile.y);
            }
        }
    });


    canvas.addEventListener("mousemove", event => {

        const tile = getTileFromMouse(event);

        coordinates.textContent =
            `X: ${tile.x} | Y: ${tile.y}`;


        if (isPanning) {

            const dx = event.clientX - lastMouseX;
            const dy = event.clientY - lastMouseY;

            offsetX += dx;
            offsetY += dy;

            lastMouseX = event.clientX;
            lastMouseY = event.clientY;

            draw();
        }
    });


    canvas.addEventListener("mouseup", event => {

        if (event.button === 2) {

            isPanning = false;

            canvas.style.cursor = "crosshair";
        }
    });


    canvas.addEventListener("mouseleave", () => {

        isPanning = false;

        canvas.style.cursor = "crosshair";
    });


    canvas.addEventListener("contextmenu", event => {
        event.preventDefault();
    });


    /* =========================
       TERÉN BUTTONS
    ========================= */

    document.querySelectorAll(".terrain-btn").forEach(button => {

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".terrain-btn")
                .forEach(btn =>
                    btn.classList.remove("active")
                );

            button.classList.add("active");

            selectedTerrain =
                button.dataset.terrain;
        });

    });


    /* =========================
       LAYERS
    ========================= */

    const layers = {

        terrain: {
            button: document.getElementById("terrainLayerBtn"),
            panel: document.getElementById("terrainPanel")
        },

        area: {
            button: document.getElementById("areaLayerBtn"),
            panel: document.getElementById("areaPanel")
        },

        country: {
            button: document.getElementById("countryLayerBtn"),
            panel: document.getElementById("countryPanel")
        },

        infra: {
            button: document.getElementById("infraLayerBtn"),
            panel: document.getElementById("infraPanel")
        }
    };


    function selectLayer(layerName) {

        currentLayer = layerName;


        Object.keys(layers).forEach(name => {

            layers[name].button.classList.toggle(
                "active",
                name === layerName
            );

            layers[name].panel.classList.toggle(
                "hidden",
                name !== layerName
            );
        });


        draw();
    }


    Object.keys(layers).forEach(name => {

        layers[name].button.addEventListener(
            "click",
            () => selectLayer(name)
        );

    });


    /* =========================
       ZOOM
    ========================= */

    document.getElementById("zoomInBtn")
        .addEventListener("click", () => {

            zoom = Math.min(4, zoom * 1.2);

            draw();
        });


    document.getElementById("zoomOutBtn")
        .addEventListener("click", () => {

            zoom = Math.max(0.25, zoom / 1.2);

            draw();
        });


    canvas.addEventListener("wheel", event => {

        event.preventDefault();

        const rect = canvas.getBoundingClientRect();

        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;


        const worldX =
            (mouseX - offsetX) / zoom;

        const worldY =
            (mouseY - offsetY) / zoom;


        const factor =
            event.deltaY < 0 ? 1.1 : 0.9;


        const newZoom =
            Math.max(
                0.25,
                Math.min(4, zoom * factor)
            );


        offsetX =
            mouseX - worldX * newZoom;

        offsetY =
            mouseY - worldY * newZoom;

        zoom = newZoom;

        draw();

    }, { passive: false });


    /* =========================
       ULOŽENIE
    ========================= */

    document.getElementById("saveBtn")
        .addEventListener("click", () => {

            localStorage.setItem(
                "myWorldGame",
                JSON.stringify(world)
            );

            alert("Svet bol uložený.");
        });


    /* =========================
       NAČÍTANIE
    ========================= */

    document.getElementById("loadBtn")
        .addEventListener("click", () => {

            const saved =
                localStorage.getItem("myWorldGame");

            if (!saved) {

                alert("Žiadny uložený svet.");

                return;
            }

            try {

                world = JSON.parse(saved);

                draw();

            } catch {

                alert("Uložený svet sa nepodarilo načítať.");
            }
        });


    /* =========================
       VYMAZANIE
    ========================= */

    document.getElementById("clearBtn")
        .addEventListener("click", () => {

            if (
                confirm(
                    "Naozaj chceš vymazať celý svet?"
                )
            ) {

                createWorld();

                offsetX = 0;
                offsetY = 0;
                zoom = 1;

                draw();
            }
        });


    /* =========================
       START
    ========================= */

    createWorld();

    resizeCanvas();

});
