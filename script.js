// ============================================================
// BLOCKWORLD V2
// Minecraft-inspired 3D browser game
// ============================================================

// ============================================================
// 1. GAME SETTINGS
// ============================================================

const CONFIG = {
    worldSize: 40,
    maxBuildDistance: 7,
    playerHeight: 1.8,
    playerRadius: 0.28,

    walkSpeed: 5.5,
    sprintSpeed: 9,
    jumpPower: 8.5,
    gravity: 24,

    worldHeight: 18
};


// ============================================================
// 2. THREE.JS SETUP
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    35,
    100
);


const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.05,
    300
);


const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

document.body.appendChild(
    renderer.domElement
);


// ============================================================
// 3. LIGHTING
// ============================================================

const hemisphereLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x6b8e5a,
        1.5
    );

scene.add(
    hemisphereLight
);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        2.2
    );

sun.position.set(
    35,
    55,
    25
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;

sun.shadow.camera.near = 1;
sun.shadow.camera.far = 150;

scene.add(sun);


// ============================================================
// 4. WORLD GROUP
// ============================================================

const world =
    new THREE.Group();

scene.add(world);


// ============================================================
// 5. BLOCK DATA
// ============================================================

const BLOCKS = {
    grass: {
        color: 0x5baa35
    },

    dirt: {
        color: 0x8b5a2b
    },

    stone: {
        color: 0x858585
    },

    wood: {
        color: 0x9b6a3c
    },

    leaves: {
        color: 0x3d8f35,
        transparent: true
    },

    sand: {
        color: 0xd9c27a
    },

    glass: {
        color: 0x8bd7e8,
        transparent: true
    },

    brick: {
        color: 0x9e4935
    },

    snow: {
        color: 0xf2f2f2
    }
};


const blockGeometry =
    new THREE.BoxGeometry(
        1,
        1,
        1
    );


const materials = {};


for (
    const type in BLOCKS
) {

    const data =
        BLOCKS[type];

    materials[type] =
        new THREE.MeshLambertMaterial({
            color: data.color,
            transparent: !!data.transparent,
            opacity:
                data.transparent
                    ? 0.65
                    : 1
        });
}


// ============================================================
// 6. BLOCK STORAGE
// ============================================================

const blocks = [];


// Fast lookup table

const blockMap =
    new Map();


function blockKey(
    x,
    y,
    z
) {

    return `${x},${y},${z}`;
}


// ============================================================
// 7. CREATE BLOCK
// ============================================================

function createBlock(
    x,
    y,
    z,
    type
) {

    if (
        !BLOCKS[type]
    ) {

        type = "dirt";

    }


    const key =
        blockKey(x, y, z);


    // Don't create duplicate blocks

    if (
        blockMap.has(key)
    ) {

        return null;

    }


    const cube =
        new THREE.Mesh(
            blockGeometry,
            materials[type]
        );


    cube.position.set(
        x,
        y,
        z
    );


    cube.userData.type =
        type;

    cube.userData.grid = {
        x,
        y,
        z
    };


    cube.castShadow = true;
    cube.receiveShadow = true;


    world.add(cube);

    blocks.push(cube);

    blockMap.set(
        key,
        cube
    );


    return cube;
}


// ============================================================
// 8. REMOVE BLOCK
// ============================================================

function removeBlock(
    block
) {

    if (!block) return;


    const {
        x,
        y,
        z
    } = block.userData.grid;


    world.remove(
        block
    );


    blockMap.delete(
        blockKey(
            x,
            y,
            z
        )
    );


    const index =
        blocks.indexOf(
            block
        );


    if (
        index !== -1
    ) {

        blocks.splice(
            index,
            1
        );

    }
}


// ============================================================
// 9. TERRAIN GENERATION
// ============================================================

function terrainHeight(
    x,
    z
) {

    const large =
        Math.sin(x * 0.16) * 2.5;

    const medium =
        Math.cos(z * 0.21) * 2;

    const small =
        Math.sin(
            (x + z) * 0.35
        ) * 0.8;

    const hills =
        Math.sin(
            Math.sqrt(
                x * x +
                z * z
            ) * 0.18
        ) * 1.5;


    return Math.max(
        2,
        Math.floor(
            6 +
            large +
            medium +
            small +
            hills
        )
    );
}


function generateTerrain() {

    const half =
        CONFIG.worldSize / 2;


    for (
        let x = -half;
        x < half;
        x++
    ) {

        for (
            let z = -half;
            z < half;
            z++
        ) {

            const height =
                terrainHeight(
                    x,
                    z
                );


            for (
                let y = 0;
                y <= height;
                y++
            ) {

                let type =
                    "stone";


                if (
                    y === height
                ) {

                    type =
                        height <= 4
                            ? "sand"
                            : "grass";

                } else if (
                    y >= height - 2
                ) {

                    type =
                        height <= 4
                            ? "sand"
                            : "dirt";

                }


                createBlock(
                    x,
                    y,
                    z,
                    type
                );
            }
        }
    }
}


// ============================================================
// 10. TREES
// ============================================================

function createTree(
    x,
    groundY,
    z
) {

    const trunkHeight = 4;


    // Trunk

    for (
        let y = 1;
        y <= trunkHeight;
        y++
    ) {

        createBlock(
            x,
            groundY + y,
            z,
            "wood"
        );
    }


    // Leaves

    const leafBase =
        groundY +
        trunkHeight -
        1;


    for (
        let lx = -2;
        lx <= 2;
        lx++
    ) {

        for (
            let ly = 0;
            ly <= 2;
            ly++
        ) {

            for (
                let lz = -2;
                lz <= 2;
                lz++
            ) {

                const distance =
                    Math.abs(lx) +
                    Math.abs(lz);


                if (
                    distance <= 3
                ) {

                    createBlock(
                        x + lx,
                        leafBase + ly,
                        z + lz,
                        "leaves"
                    );
                }
            }
        }
    }


    // Top

    createBlock(
        x,
        groundY + 7,
        z,
        "leaves"
    );
}


function generateTrees() {

    const half =
        CONFIG.worldSize / 2;


    for (
        let x = -half + 2;
        x < half - 2;
        x++
    ) {

        for (
            let z = -half + 2;
            z < half - 2;
            z++
        ) {

            // Don't put trees everywhere

            if (
                Math.random() > 0.025
            ) {

                continue;

            }


            const y =
                terrainHeight(
                    x,
                    z
                );


            // Trees only on grass

            if (
                y > 5
            ) {

                createTree(
                    x,
                    y,
                    z
                );

            }
        }
    }
}


// ============================================================
// 11. CLOUDS
// ============================================================

const cloudGroup =
    new THREE.Group();

scene.add(
    cloudGroup
);


function createCloud(
    x,
    y,
    z,
    scale
) {

    const cloudMaterial =
        new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });


    const cloud =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5,
                1,
                3
            ),
            cloudMaterial
        );


    cloud.position.set(
        x,
        y,
        z
    );


    cloud.scale.set(
        scale,
        scale,
        scale
    );


    cloudGroup.add(
        cloud
    );
}


for (
    let i = 0;
    i < 15;
    i++
) {

    createCloud(
        Math.random() * 100 - 50,
        25 + Math.random() * 5,
        Math.random() * 100 - 50,
        0.8 + Math.random() * 0.8
    );
}


// ============================================================
// 12. PLAYER
// ============================================================

const player = {

    position:
        new THREE.Vector3(
            0,
            terrainHeight(0, 0) + 3,
            0
        ),

    velocity:
        new THREE.Vector3(
            0,
            0,
            0
        ),

    height:
        CONFIG.playerHeight,

    radius:
        CONFIG.playerRadius,

    onGround:
        false,

    health:
        100,

    hunger:
        100
};


camera.position.copy(
    player.position
);


// ============================================================
// 13. CAMERA ROTATION
// ============================================================

let yaw = 0;
let pitch = 0;

let pointerLocked = false;


document.addEventListener(
    "mousemove",
    function(event) {

        if (!pointerLocked)
            return;


        yaw -=
            event.movementX *
            0.0022;


        pitch -=
            event.movementY *
            0.0022;


        const limit =
            Math.PI / 2 -
            0.05;


        pitch =
            Math.max(
                -limit,
                Math.min(
                    limit,
                    pitch
                )
            );
    }
);


// ============================================================
// 14. START GAME
// ============================================================

const startScreen =
    document.getElementById(
        "startScreen"
    );


const startButton =
    document.getElementById(
        "startButton"
    );


const loading =
    document.getElementById(
        "loading"
    );


const loadingProgress =
    document.getElementById(
        "loadingProgress"
    );


startButton.addEventListener(
    "click",
    function() {

        startScreen.style.display =
            "none";


        renderer.domElement.requestPointerLock();

    }
);


document.addEventListener(
    "pointerlockchange",
    function() {

        pointerLocked =
            document.pointerLockElement ===
            renderer.domElement;

    }
);


// ============================================================
// 15. KEYBOARD
// ============================================================

const keys = {};


document.addEventListener(
    "keydown",
    function(event) {

        keys[event.code] =
            true;


        // Prevent page scrolling

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

        }


        // Jump

        if (
            event.code ===
            "Space" &&
            player.onGround &&
            pointerLocked
        ) {

            player.velocity.y =
                CONFIG.jumpPower;

            player.onGround =
                false;
        }


        // Number keys

        if (
            event.code.startsWith(
                "Digit"
            )
        ) {

            const number =
                parseInt(
                    event.code.substring(
                        5
                    )
                );


            if (
                number >= 1 &&
                number <= 9
            ) {

                selectBlock(
                    number - 1
                );
            }
        }
    }
);


document.addEventListener(
    "keyup",
    function(event) {

        keys[event.code] =
            false;

    }
);


// ============================================================
// 16. HOTBAR
// ============================================================

const blockTypes = [
    "grass",
    "dirt",
    "stone",
    "wood",
    "leaves",
    "sand",
    "glass",
    "brick",
    "snow"
];


let selectedBlock =
    "grass";


const slots =
    document.querySelectorAll(
        ".slot"
    );


function selectBlock(
    index
) {

    if (
        index < 0 ||
        index >= blockTypes.length
    ) {

        return;

    }


    selectedBlock =
        blockTypes[index];


    slots.forEach(
        (slot, i) => {

            slot.classList.toggle(
                "selected",
                i === index
            );

        }
    );
}


slots.forEach(
    (slot, index) => {

        slot.addEventListener(
            "click",
            function() {

                selectBlock(
                    index
                );

            }
        );

    }
);


// ============================================================
// 17. COLLISION
// ============================================================

function getBlock(
    x,
    y,
    z
) {

    return blockMap.get(
        blockKey(
            Math.round(x),
            Math.round(y),
            Math.round(z)
        )
    ) || null;
}


function playerCollides(
    position
) {

    const minX =
        position.x -
        player.radius;


    const maxX =
        position.x +
        player.radius;


    const minY =
        position.y -
        player.height;


    const maxY =
        position.y;


    const minZ =
        position.z -
        player.radius;


    const maxZ =
        position.z +
        player.radius;


    const startX =
        Math.floor(
            minX - 0.5
        );


    const endX =
        Math.floor(
            maxX + 0.5
        );


    const startY =
        Math.floor(
            minY - 0.5
        );


    const endY =
        Math.floor(
            maxY + 0.5
        );


    const startZ =
        Math.floor(
            minZ - 0.5
        );


    const endZ =
        Math.floor(
            maxZ + 0.5
        );


    for (
        let x = startX;
        x <= endX;
        x++
    ) {

        for (
            let y = startY;
            y <= endY;
            y++
        ) {

            for (
                let z = startZ;
                z <= endZ;
                z++
            ) {

                const block =
                    getBlock(
                        x,
                        y,
                        z
                    );


                if (!block)
                    continue;


                const bx =
                    x;


                const by =
                    y;


                const bz =
                    z;


                if (
                    maxX >
                        bx - 0.5 &&

                    minX <
                        bx + 0.5 &&

                    maxY >
                        by - 0.5 &&

                    minY <
                        by + 0.5 &&

                    maxZ >
                        bz - 0.5 &&

                    minZ <
                        bz + 0.5
                ) {

                    return true;

                }
            }
        }
    }


    return false;
}


// ============================================================
// 18. RAYCASTING
// ============================================================

const raycaster =
    new THREE.Raycaster();


function getTarget() {

    raycaster.setFromCamera(
        new THREE.Vector2(
            0,
            0
        ),
        camera
    );


    const hits =
        raycaster.intersectObjects(
            blocks,
            false
        );


    if (
        hits.length === 0
    ) {

        return null;

    }


    if (
        hits[0].distance >
        CONFIG.maxBuildDistance
    ) {

        return null;

    }


    return hits[0];
}


// ============================================================
// 19. BLOCK OUTLINE
// ============================================================

const outline =
    new THREE.LineSegments(
        new THREE.EdgesGeometry(
            blockGeometry
        ),
        new THREE.LineBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        })
    );


outline.visible =
    false;


outline.scale.setScalar(
    1.01
);


scene.add(
    outline
);


function updateOutline() {

    const hit =
        getTarget();


    if (!hit) {

        outline.visible =
            false;

        return;

    }


    outline.position.copy(
        hit.object.position
    );


    outline.visible =
        true;
}


// ============================================================
// 20. BREAK / PLACE BLOCKS
// ============================================================

document.addEventListener(
    "mousedown",
    function(event) {

        if (!pointerLocked)
            return;


        const hit =
            getTarget();


        if (!hit)
            return;


        // LEFT CLICK = BREAK

        if (
            event.button === 0
        ) {

            const block =
                hit.object;


            const {
                y
            } =
                block.userData.grid;


            // Bedrock protection

            if (
                y <= 0
            ) {

                return;

            }


            removeBlock(
                block
            );

        }


        // RIGHT CLICK = PLACE

        if (
            event.button === 2
        ) {

            const normal =
                hit.face.normal.clone();


            const position =
                hit.object.position
                    .clone()
                    .add(normal);


            const x =
                Math.round(
                    position.x
                );


            const y =
                Math.round(
                    position.y
                );


            const z =
                Math.round(
                    position.z
                );


            if (
                blockMap.has(
                    blockKey(
                        x,
                        y,
                        z
                    )
                )
            ) {

                return;

            }


            // Don't place inside player

            const testPosition =
                new THREE.Vector3(
                    x,
                    y + 1,
                    z
                );


            if (
                playerCollides(
                    testPosition
                )
            ) {

                return;

            }


            createBlock(
                x,
                y,
                z,
                selectedBlock
            );
        }
    }
);


// Disable right-click menu

document.addEventListener(
    "contextmenu",
    function(event) {

        event.preventDefault();

    }
);


// ============================================================
// 21. PLAYER MOVEMENT
// ============================================================

const forward =
    new THREE.Vector3();


const right =
    new THREE.Vector3();


const movement =
    new THREE.Vector3();


function updateMovement(
    delta
) {

    movement.set(
        0,
        0,
        0
    );


    // Forward direction

    forward.set(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
    );


    // Right direction

    right.set(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    );


    if (
        keys["KeyW"]
    ) {

        movement.add(
            forward
        );

    }


    if (
        keys["KeyS"]
    ) {

        movement.sub(
            forward
        );

    }


    if (
        keys["KeyD"]
    ) {

        movement.add(
            right
        );

    }


    if (
        keys["KeyA"]
    ) {

        movement.sub(
            right
        );

    }


    if (
        movement.lengthSq() >
        0
    ) {

        movement.normalize();

    }


    let speed =
        CONFIG.walkSpeed;


    if (
        keys["ShiftLeft"] ||
        keys["ShiftRight"]
    ) {

        speed =
            CONFIG.sprintSpeed;

    }


    const distance =
        speed *
        delta;


    // X movement

    const nextX =
        player.position.clone();


    nextX.x +=
        movement.x *
        distance;


    if (
        !playerCollides(
            nextX
        )
    ) {

        player.position.x =
            nextX.x;

    }


    // Z movement

    const nextZ =
        player.position.clone();


    nextZ.z +=
        movement.z *
        distance;


    if (
        !playerCollides(
            nextZ
        )
    ) {

        player.position.z =
            nextZ.z;

    }


    // Gravity

    player.velocity.y -=
        CONFIG.gravity *
        delta;


    const nextY =
        player.position.clone();


    nextY.y +=
        player.velocity.y *
        delta;


    if (
        !playerCollides(
            nextY
        )
    ) {

        player.position.y =
            nextY.y;

        player.onGround =
            false;

    } else {

        if (
            player.velocity.y < 0
        ) {

            player.onGround =
                true;

        }


        player.velocity.y =
            0;
    }


    // Respawn

    if (
        player.position.y <
        -20
    ) {

        respawnPlayer();

    }
}


// ============================================================
// 22. PLAYER RESPAWN
// ============================================================

function respawnPlayer() {

    player.position.set(
        0,
        terrainHeight(
            0,
            0
        ) + 3,
        0
    );


    player.velocity.set(
        0,
        0,
        0
    );


    player.health =
        100;


    player.hunger =
        100;
}


// ============================================================
// 23. CAMERA UPDATE
// ============================================================

function updateCamera() {

    camera.position.copy(
        player.position
    );


    camera.rotation.order =
        "YXZ";


    camera.rotation.y =
        yaw;


    camera.rotation.x =
        pitch;
}


// ============================================================
// 24. HUD
// ============================================================

const coordinates =
    document.getElementById(
        "coordinates"
    );


const fpsElement =
    document.getElementById(
        "fps"
    );


const healthBar =
    document.getElementById(
        "healthBar"
    );


const hungerBar =
    document.getElementById(
        "hungerBar"
    );


const targetInfo =
    document.getElementById(
        "targetInfo"
    );


function updateHUD() {

    coordinates.textContent =
        `XYZ: ${Math.floor(player.position.x)} / ` +
        `${Math.floor(player.position.y)} / ` +
        `${Math.floor(player.position.z)}`;


    healthBar.style.width =
        `${player.health}%`;


    hungerBar.style.width =
        `${player.hunger}%`;


    const hit =
        getTarget();


    if (hit) {

        targetInfo.textContent =
            hit.object.userData.type
                .toUpperCase();

    } else {

        targetInfo.textContent =
            "";

    }
}


// ============================================================
// 25. FPS COUNTER
// ============================================================

let fpsTimer = 0;
let fpsFrames = 0;
let currentFPS = 0;


function updateFPS(
    delta
) {

    fpsTimer +=
        delta;


    fpsFrames++;


    if (
        fpsTimer >= 0.5
    ) {

        currentFPS =
            Math.round(
                fpsFrames /
                fpsTimer
            );


        fpsElement.textContent =
            `FPS: ${currentFPS}`;


        fpsTimer = 0;
        fpsFrames = 0;
    }
}


// ============================================================
// 26. DAY / NIGHT CYCLE
// ============================================================

let worldTime = 0;


function updateDayNight(
    delta
) {

    worldTime +=
        delta *
        0.015;


    const angle =
        worldTime %
        (Math.PI * 2);


    const sunX =
        Math.cos(angle) *
        50;


    const sunY =
        Math.sin(angle) *
        50;


    const sunZ =
        25;


    sun.position.set(
        sunX,
        sunY,
        sunZ
    );


    const daylight =
        Math.max(
            0.12,
            Math.sin(angle) *
                0.5 +
                0.5
        );


    sun.intensity =
        0.3 +
        daylight *
        2;


    hemisphereLight.intensity =
        0.35 +
        daylight *
        1.15;


    const skyValue =
        Math.floor(
            70 +
            daylight *
            100
        );


    scene.background =
        new THREE.Color(
            `rgb(${skyValue}, ${skyValue + 80}, 235)`
        );


    scene.fog.color =
        scene.background;
}


// ============================================================
// 27. HUNGER
// ============================================================

let hungerTimer = 0;


function updateHunger(
    delta
) {

    hungerTimer +=
        delta;


    if (
        hungerTimer >
        12
    ) {

        hungerTimer =
            0;


        player.hunger =
            Math.max(
                0,
                player.hunger - 1
            );
    }


    // Hunger reaches zero = slow health loss

    if (
        player.hunger <= 0
    ) {

        player.health =
            Math.max(
                0,
                player.health -
                delta * 2
            );

    }


    if (
        player.health <= 0
    ) {

        respawnPlayer();

    }
}


// ============================================================
// 28. LOADING
// ============================================================

function generateWorld() {

    loading.style.display =
        "flex";


    loadingProgress.style.width =
        "15%";


    setTimeout(
        function() {

            generateTerrain();

            loadingProgress.style.width =
                "65%";


            setTimeout(
                function() {

                    generateTrees();

                    loadingProgress.style.width =
                        "85%";


                    setTimeout(
                        function() {

                            loadingProgress.style.width =
                                "100%";


                            setTimeout(
                                function() {

                                    loading.style.display =
                                        "none";

                                },
                                300
                            );

                        },
                        200
                    );

                },
                100
            );

        },
        100
    );
}


// ============================================================
// 29. ANIMATION LOOP
// ============================================================

let previousTime =
    performance.now();


function animate() {

    requestAnimationFrame(
        animate
    );


    const currentTime =
        performance.now();


    let delta =
        (
            currentTime -
            previousTime
        ) / 1000;


    previousTime =
        currentTime;


    delta =
        Math.min(
            delta,
            0.05
        );


    if (
        pointerLocked
    ) {

        updateMovement(
            delta
        );

    }


    updateCamera();

    updateOutline();

    updateHUD();

    updateFPS(
        delta
    );

    updateDayNight(
        delta
    );

    updateHunger(
        delta
    );


    renderer.render(
        scene,
        camera
    );
}


// ============================================================
// 30. WINDOW RESIZE
// ============================================================

window.addEventListener(
    "resize",
    function() {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);


// ============================================================
// 31. START
// ============================================================

generateWorld();

animate();
