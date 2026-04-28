function executeWidgetCode() {

    console.log(" Widget script started");

require(['DS/DataDragAndDrop/DataDragAndDrop', 'config'], function (DataDragAndDrop, config) {
        console.log("DataDragAndDrop loaded");

        var myWidget = {

           // STREAM_KEY: "tlnqapBHDN4zsGNcVkDfe9XesQ4BBrRl8yAd",
            //CLIENT_ID: "08F675C4AACE8C0214362DB5EFD4FACAFA556D463ECA00877CB225157EF58BFA",
           var currentEnv = config.env;

var myWidget = {

    STREAM_KEY: config[currentEnv].STREAM_KEY,
    CLIENT_ID: config[currentEnv].CLIENT_ID,
            selectedItemId: null,

            loadVertexScripts: function () {
                console.log(" loadVertexScripts called");

                return new Promise((resolve) => {

                    if (window.vertexLoaded) {
                        console.log(" Vertex already loaded");
                        resolve();
                        return;
                    }

                    console.log("⬇️ Loading Vertex CSS...");
                    const link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = "https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/viewer/viewer.css";
                    document.head.appendChild(link);

                    console.log("⬇️ Loading Vertex JS module...");
                    const script = document.createElement("script");
                    script.type = "module";
                    script.innerHTML = `
                        import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/esm/loader.js';
                        window.defineVertex = async () => {
                            console.log("Defining custom elements...");
                            await defineCustomElements(window);
                            console.log("Custom elements defined");
                        };
                    `;
                    document.body.appendChild(script);

                    setTimeout(async () => {
                        console.log(" Waiting for defineVertex...");

                        if (window.defineVertex) {
                            await window.defineVertex();
                            window.vertexLoaded = true;
                            console.log("Vertex fully initialized");
                            resolve();
                        } else {
                            console.error(" defineVertex not found");
                        }
                    }, 500);
                });
            },

            // Display dropped data
            displayData: function (obj) {

                console.log("displayData called");
                console.log("Dropped object:", obj);

                var contentDiv = document.getElementById("content-display");
                var dropZoneUI = document.getElementById("drop-zone-ui");

                if (!contentDiv || !dropZoneUI) {
                    console.error(" UI elements missing");
                    return;
                }

                dropZoneUI.style.display = "none";
                contentDiv.style.display = "block";

                // Validation
                if (!obj.data || !obj.data.items || obj.data.items.length === 0) {
                    console.error(" Invalid data structure");
                    return;
                }

                if (obj.data.items[0].objectType !== "VPMReference") {
                    console.warn(" Not a VPMReference");

                    contentDiv.innerHTML = `
                        <div>
                            <h3>Invalid Selection</h3>
                            <button onclick="location.reload()">Back</button>
                        </div>`;
                    return;
                }

                const item = obj.data.items[0];
                // Example: generate or fetch stream key dynamically
myWidget.STREAM_KEY = item.id || config[currentEnv].STREAM_KEY;
                console.log("Valid item:", item.displayName);

                // Inject Viewer
                contentDiv.innerHTML = `
                    <div style="width:100%; height:100%;">
                        <h3>${item.displayName}</h3>
                        <button onclick="location.reload()">Reset</button>

                        <div style="width:100%; height:80vh;">
                            <vertex-viewer 
                                id="vertexViewer"
                                style="width:100%; height:100%;"
                                client-id="${myWidget.CLIENT_ID}">
                            </vertex-viewer>
                        </div>
                    </div>
                `;

                console.log(" Viewer injected into DOM");

                setTimeout(() => {
                    console.log("Calling loadViewer...");
                    myWidget.loadViewer();
                }, 300);
            },

            //  Load Viewer
            loadViewer: async function () {

                console.log("loadViewer called");

                const viewer = document.getElementById("vertexViewer");

                if (!viewer) {
                    console.error(" Viewer element not found");
                    return;
                }

                console.log("Viewer element found");

                try {
                    await myWidget.loadVertexScripts();

                    console.log(" Waiting for custom element definition...");
                    await customElements.whenDefined('vertex-viewer');

                    console.log(" vertex-viewer defined");

                    console.log(" Loading stream:", myWidget.STREAM_KEY);

                    await viewer.load(
                        `urn:vertex:stream-key:${myWidget.STREAM_KEY}`
                    );

                    console.log(" Viewer stream loaded successfully");

                    myWidget.enableSelection(viewer);

                } catch (e) {
                    console.error(" Load error:", e);
                }
            },

            //  Enable selection
            enableSelection: function (viewer) {

                console.log("️ Selection enabled");

                viewer.addEventListener('tap', async (event) => {

                    console.log("Tap detected", event.detail.position);

                    const scene = await viewer.scene();
                    const raycaster = scene.raycaster();

                    const result = await raycaster.hitItems(event.detail.position);
                    console.log(" Hit result:", result);

                    const [hit] = result.hits;

                    if (hit) {

                        const itemId = hit.itemId?.hex;
                        console.log(" Hit item:", itemId);

                        await scene.items(op => [
                            ...(myWidget.selectedItemId
                                ? [op.where(q => q.withItemId(myWidget.selectedItemId)).deselect()]
                                : []),
                            op.where(q => q.withItemId(itemId)).select()
                        ]).execute();

                        myWidget.selectedItemId = itemId;

                    } else if (myWidget.selectedItemId) {

                        console.log(" Deselecting previous item");

                        await scene.items(op => [
                            op.where(q => q.withItemId(myWidget.selectedItemId)).deselect()
                        ]).execute();

                        myWidget.selectedItemId = null;
                    }
                });
            },

            //  Drag & Drop
            dragZone: function () {

                console.log(" Drag zone initialized");

                var dropElement = widget.body;

                DataDragAndDrop.droppable(dropElement, {

                    drop: function (data) {
                        console.log(" Drop event triggered");

                        try {
                            var obj = JSON.parse(data);
                            myWidget.displayData(obj);
                        } catch (e) {
                            console.error("JSON parse error:", e);
                        }

                        widget.body.classList.remove("drag-over");
                    },

                    enter: function () {
                        console.log("Drag enter");
                        widget.body.classList.add("drag-over");
                    },

                    leave: function () {
                        console.log("⬅️ Drag leave");
                        widget.body.classList.remove("drag-over");
                    }
                });
            },

            //Init
            onLoad: function () {
                console.log(" Widget onLoad triggered");
                myWidget.dragZone();
            }
        };

        widget.addEvent('onLoad', myWidget.onLoad);
    });
}
