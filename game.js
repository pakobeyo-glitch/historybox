/* =========================================
   MY WORLD GAME
   PRVÁ VERZIA
========================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =====================================
       KONFIGURÁCIA
    ===================================== */

    const WORLD_WIDTH = 200;
    const WORLD_HEIGHT = 200;

    const TILE_SIZE = 32;


    /* =====================================
       ELEMENTY
    ===================================== */

    const canvas =
        document.getElementById("gameCanvas");

    const ctx =
        canvas.getContext("2d");

    const gameArea =
        document.getElementById("gameArea");

    const coordinates =
        document.getElementById("coordinates");

    const zoomValue =
        document.getElementById("zoomValue");

    const brushSize =
        document.getElementById("brushSize");

    const brushSizeValue =
        document.getElementById("brushSizeValue");

    const terrainEraserBtn =
        document.getElementById("terrainEraserBtn");


    /* =====================================
       SVET
    ===================================== */

    let world = [];


    function createWorld() {

        world = [];

        for (let y = 0; y < WORLD_HEIGHT; y++) {

            const row = [];

            for (let x = 0; x < WORLD_WIDTH; x++) {

                row.push({
                    terrain: "lowland"
                });

            }

            world.push(row);
        }
    }


    /* =====================================
       TERÉNY
    ===================================== */

    const terrainColors = {

        lowland: "#78a854",

        desert: "#d6b45a",

        tundra: "#aebbb8",

        mountain: "#817b70",

        highMountain: "#d8d8d8",

        river: "#3b8fd1",

        sea: "#286ba5"

    };


    /* =====================================
       VYBRATÝ TERÉN
    ===================================== */

    let selectedTerrain = "lowland";

    let eraserActive = false;


    /* =====================================
       ZOOM A POSUN
    ===================================== */

    let zoom = 1;

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;


    let offsetX = 0;
    let offsetY = 0;


    let isPanning = false;

    let lastMouseX = 0;
    let lastMouseY = 0;


    /* =====================================
       VEĽKOSŤ CANVASU
    ===================================== */

    function resizeCanvas() {

        const rect =
            gameArea.getBoundingClientRect();

        canvas.width =
            Math.max(1, Math.floor(rect.width));

        canvas.height =
            Math.max(1, Math.floor(rect.height));

        draw();
    }


    window.addEventListener(
        "resize",
        resizeCanvas
    );


    /* =====================================
       VYKRESLENIE MAPY
    ===================================== */

    function draw() {

        /*
         * Vymažeme celý canvas.
         */

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        /*
         * Uložíme stav canvasu.
         */

        ctx.save();


        /*
         * Posun + zoom.
         */

        ctx.translate(
            offsetX,
            offsetY
        );

        ctx.scale(
            zoom,
            zoom
        );


        /*
         * Vypočítame iba tiles,
         * ktoré sú práve viditeľné.
         */

        const startX =
            Math.max(
                0,
                Math.floor(
                    -offsetX /
                    zoom /
                    TILE_SIZE
                ) - 1
            );

        const startY =
            Math.max(
                0,
                Math.floor(
                    -offsetY /
                    zoom /
                    TILE_SIZE
                ) - 1
            );


        const endX =
            Math.min(
                WORLD_WIDTH,
                Math.ceil(
                    (
                        canvas.width -
                        offsetX
                    ) /
                    zoom /
                    TILE_SIZE
                ) + 1
            );


        const endY =
            Math.min(
                WORLD_HEIGHT,
                Math.ceil(
                    (
                        canvas.height -
                        offsetY
                    ) /
                    zoom /
                    TILE_SIZE
                ) + 1
            );


        /*
         * Tiles.
         */

        for (
            let y = startY;
            y < endY;
            y++
        ) {

            for (
                let x = startX;
                x < endX;
                x++
            ) {

                const tile =
                    world[y][x];


                const px =
                    x * TILE_SIZE;

                const py =
                    y * TILE_SIZE;


                /*
                 * FARBA TERÉNU
                 */

                ctx.fillStyle =
                    terrainColors[
                        tile.terrain
                    ];


                ctx.fillRect(
                    px,
                    py,
                    TILE_SIZE,
                    TILE_SIZE
                );


                /*
                 * MREŽKA
                 */

                ctx.strokeStyle =
                    "rgba(0, 0, 0, 0.15)";

                ctx.lineWidth =
                    1 / zoom;


                ctx.strokeRect(
                    px,
                    py,
                    TILE_SIZE,
                    TILE_SIZE
                );

            }

        }


        /*
         * Vonkajší okraj celej mapy.
         */

        ctx.strokeStyle = "#222";

        ctx.lineWidth = 3 / zoom;

        ctx.strokeRect(
            0,
            0,
            WORLD_WIDTH * TILE_SIZE,
            WORLD_HEIGHT * TILE_SIZE
        );


        /*
         * Koniec transformácie.
         */

        ctx.restore();


        /*
         * Aktualizujeme zoom.
         */

        zoomValue.textContent =
            Math.round(zoom * 100) + "%";
    }


    /* =====================================
       MYŠ → TILE
    ===================================== */

    function getTileFromMouse(event) {

        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX - rect.left;

        const mouseY =
            event.clientY - rect.top;


        /*
         * Prevod zo screen súradníc
         * na world súradnice.
         */

        const worldX =
            (mouseX - offsetX) / zoom;

        const worldY =
            (mouseY - offsetY) / zoom;


        const tileX =
            Math.floor(
                worldX / TILE_SIZE
            );

        const tileY =
            Math.floor(
                worldY / TILE_SIZE
            );


        return {
            x: tileX,
            y: tileY
        };
    }


    /* =====================================
       MAĽOVANIE
    ===================================== */

    function paintAt(tileX, tileY) {

        const size =
            Number(brushSize.value);


        /*
         * Štetec má stred na kliknutom tile.
         */

        const radius =
            Math.floor(size / 2);


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

                const x =
                    tileX + dx;

                const y =
                    tileY + dy;


                /*
                 * Mimo mapy ignorujeme.
                 */

                if (
                    x < 0 ||
                    x >= WORLD_WIDTH ||
                    y < 0 ||
                    y >= WORLD_HEIGHT
                ) {
                    continue;
                }


                /*
                 * GUMA
                 *
                 * Zatiaľ znamená návrat
                 * na nížinu.
                 */

                if (eraserActive) {

                    world[y][x].terrain =
                        "lowland";

                } else {

                    world[y][x].terrain =
                        selectedTerrain;

                }

            }

        }


        draw();
    }


    /* =====================================
       MOUSE DOWN
    ===================================== */

    canvas.addEventListener(
        "mousedown",
        (event) => {

            /*
             * PRAVÉ TLAČIDLO
             * = posúvanie mapy
             */

            if (event.button === 2) {

                isPanning = true;

                lastMouseX =
                    event.clientX;

                lastMouseY =
                    event.clientY;

                canvas.style.cursor =
                    "grabbing";

                return;
            }


            /*
             * ĽAVÉ TLAČIDLO
             * = maľovanie
             */

            if (event.button === 0) {

                const tile =
                    getTileFromMouse(event);

                paintAt(
                    tile.x,
                    tile.y
                );
            }

        }
    );


    /* =====================================
       MOUSE MOVE
    ===================================== */

    canvas.addEventListener(
        "mousemove",
        (event) => {

            const tile =
                getTileFromMouse(event);


            /*
             * Súradnice.
             */

            coordinates.textContent =
                `X: ${tile.x} | Y: ${tile.y}`;


            /*
             * Ak posúvame mapu.
             */

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
            }

        }
    );


    /* =====================================
       MOUSE UP
    ===================================== */

    window.addEventListener(
        "mouseup",
        (event) => {

            if (event.button === 2) {

                isPanning = false;

                canvas.style.cursor =
                    "crosshair";
            }

        }
    );


    /* =====================================
       MOUSE LEAVE
    ===================================== */

    canvas.addEventListener(
        "mouseleave",
        () => {

            if (!isPanning) {

                canvas.style.cursor =
                    "crosshair";
            }

        }
    );


    /* =====================================
       ZABLOKOVANIE CONTEXT MENU
    ===================================== */

    canvas.addEventListener(
        "contextmenu",
        (event) => {

            event.preventDefault();

        }
    );


    /* =====================================
       TERÉN BUTTONS
    ===================================== */

    const terrainButtons =
        document.querySelectorAll(
            ".terrain-btn"
        );


    terrainButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    /*
                     * Odstránime active
                     * zo všetkých.
                     */

                    terrainButtons.forEach(
                        (btn) => {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    /*
                     * Nastavíme nový.
                     */

                    button.classList.add(
                        "active"
                    );


                    selectedTerrain =
                        button.dataset.terrain;


                    /*
                     * Keď vyberieme terén,
                     * vypneme gumu.
                     */

                    eraserActive = false;

                    terrainEraserBtn.classList.remove(
                        "active"
                    );

                }
            );

        }
    );


    /* =====================================
       GUMA
    ===================================== */

    terrainEraserBtn.addEventListener(
        "click",
        () => {

            eraserActive =
                !eraserActive;


            terrainEraserBtn.classList.toggle(
                "active",
                eraserActive
            );

        }
    );


    /* =====================================
       VEĽKOSŤ ŠTETCA
    ===================================== */

    brushSize.addEventListener(
        "input",
        () => {

            brushSizeValue.textContent =
                brushSize.value;

        }
    );


    /* =====================================
       ZOOM – TLAČIDLÁ
    ===================================== */

    document
        .getElementById("zoomInBtn")
        .addEventListener(
            "click",
            () => {

                zoom =
                    Math.min(
                        MAX_ZOOM,
                        zoom * 1.2
                    );

                draw();

            }
        );


    document
        .getElementById("zoomOutBtn")
        .addEventListener(
            "click",
            () => {

                zoom =
                    Math.max(
                        MIN_ZOOM,
                        zoom / 1.2
                    );

                draw();

            }
        );


    /* =====================================
       ZOOM – KOLESO MYŠI
    ===================================== */

    canvas.addEventListener(
        "wheel",
        (event) => {

            event.preventDefault();


            const rect =
                canvas.getBoundingClientRect();


            const mouseX =
                event.clientX -
                rect.left;

            const mouseY =
                event.clientY -
                rect.top;


            /*
             * Pozícia sveta pod kurzorom
             * pred zoomom.
             */

            const worldX =
                (mouseX - offsetX) /
                zoom;

            const worldY =
                (mouseY - offsetY) /
                zoom;


            let newZoom;


            if (event.deltaY < 0) {

                newZoom =
                    zoom * 1.1;

            } else {

                newZoom =
                    zoom * 0.9;
            }


            newZoom =
                Math.max(
                    MIN_ZOOM,
                    Math.min(
                        MAX_ZOOM,
                        newZoom
                    )
                );


            /*
             * Zachováme miesto pod kurzorom.
             */

            offsetX =
                mouseX -
                worldX * newZoom;

            offsetY =
                mouseY -
                worldY * newZoom;


            zoom = newZoom;


            draw();

        },
        {
            passive: false
        }
    );


    /* =====================================
       VRSTVY
    ===================================== */

    const layerButtons = {

        terrain:
            document.getElementById(
                "terrainLayerBtn"
            ),

        area:
            document.getElementById(
                "areaLayerBtn"
            ),

        country:
            document.getElementById(
                "countryLayerBtn"
            ),

        city:
            document.getElementById(
                "cityLayerBtn"
            )
    };


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

        city:
            document.getElementById(
                "cityPanel"
            )
    };


    function selectLayer(layer) {

        /*
         * Aktívne tlačidlo.
         */

        Object.keys(layerButtons).forEach(
            (name) => {

                layerButtons[name]
                    .classList.toggle(
                        "active",
                        name === layer
                    );

            }
        );


        /*
         * Aktívny panel.
         */

        Object.keys(panels).forEach(
            (name) => {

                panels[name]
                    .classList.toggle(
                        "hidden",
                        name !== layer
                    );

            }
        );

    }


    layerButtons.terrain.addEventListener(
        "click",
        () => selectLayer("terrain")
    );


    layerButtons.area.addEventListener(
        "click",
        () => selectLayer("area")
    );


    layerButtons.country.addEventListener(
        "click",
        () => selectLayer("country")
    );


    layerButtons.city.addEventListener(
        "click",
        () => selectLayer("city")
    );


    /* =====================================
       ULOŽENIE
    ===================================== */

    document
        .getElementById("saveBtn")
        .addEventListener(
            "click",
            () => {

                try {

                    localStorage.setItem(
                        "myWorldGame",
                        JSON.stringify(world)
                    );


                    alert(
                        "Mapa bola uložená."
                    );

                } catch (error) {

                    console.error(error);

                    alert(
                        "Mapu sa nepodarilo uložiť."
                    );
                }

            }
        );


    /* =====================================
       NAČÍTANIE
    ===================================== */

    document
        .getElementById("loadBtn")
        .addEventListener(
            "click",
            () => {

                const saved =
                    localStorage.getItem(
                        "myWorldGame"
                    );


                if (!saved) {

                    alert(
                        "Žiadna uložená mapa."
                    );

                    return;
                }


                try {

                    const loaded =
                        JSON.parse(saved);


                    /*
                     * Jednoduchá kontrola,
                     * či ide o našu mapu.
                     */

                    if (
                        !Array.isArray(loaded) ||
                        loaded.length !== WORLD_HEIGHT
                    ) {

                        throw new Error(
                            "Nesprávny formát mapy."
                        );
                    }


                    world = loaded;

                    draw();


                    alert(
                        "Mapa bola načítaná."
                    );

                } catch (error) {

                    console.error(error);

                    alert(
                        "Mapu sa nepodarilo načítať."
                    );

                }

            }
        );


    /* =====================================
       RESET
    ===================================== */

    document
        .getElementById("resetBtn")
        .addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        "Naozaj chceš vymazať celú mapu?"
                    );


                if (!confirmed) {
                    return;
                }


                createWorld();


                zoom = 1;

                offsetX = 0;
                offsetY = 0;


                draw();

            }
        );


    /* =====================================
       ŠTART HRY
    ===================================== */

    createWorld();

    resizeCanvas();

});
