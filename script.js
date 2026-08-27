// ============================================================
// BLOCKWORLD - Minecraft-style browser game
// ============================================================

// ---------- BASIC THREE.JS SETUP ----------

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(0x87ceeb, 35, 100);


const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    300
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);


// ---------- LIGHTING ----------

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x668866,
    1.5
);

scene.add(ambientLight);


const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(30, 50, 20);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

scene.add(sun);


// ---------- BLOCK MATERIALS ----------

const materials = {

    grass: [
        new THREE.MeshLambertMaterial({ color: 0x55aa33 }), // top-ish
        new THREE.MeshLambertMaterial({ color: 0x55aa33 }),
        new THREE.MeshLambertMaterial({ color: 0x55aa33 }),
        new THREE.MeshLambertMaterial({ color: 0x885522 }),
        new THREE.MeshLambertMaterial({ color: 0x55aa33 }),
        new THREE.MeshLambertMaterial({ color: 0x55aa33 })
    ],

    dirt: new THREE.MeshLambertMaterial({
        color: 0x8b5a2b
    }),

    stone: new THREE.MeshLambertMaterial({
        color: 0x888888
    }),

    wood: new THREE.MeshLambertMaterial({
        color: 0x9a6a35
    }),

    leaves: new THREE.MeshLambertMaterial({
        color: 0x3f8f32
    })
};


const blockGeometry = new THREE.BoxGeometry(
    1,
    1,
    1
);


// ---------- WORLD ----------

const world = new THREE.Group();

scene.add(world);

const blocks = [];

const WORLD_SIZE = 40;


function heightAt(x, z) {

    const wave1 =
        Math.sin(x * 0.22) * 2;

    const wave2 =
        Math.cos(z * 0.18) * 2;

    const wave3 =
        Math.sin((x + z) * 0.1) * 2;

    return Math.floor(
        5 + wave1 + wave2 + wave3
    );
}


function createBlock(x, y, z, type) {

    let material;

    if (type === "grass") {

        material = materials.grass;

    } else {

        material = materials[type];
    }


    const cube = new THREE.Mesh(
        blockGeometry,
        material
    );

    cube.position.set(
        x,
        y,
        z
    );

    cube.castShadow = true;
    cube.receiveShadow = true;

    cube.userData.type = type;

    world.add(cube);

    blocks.push(cube);

    return cube;
}


// ---------- TERRAIN ----------

function generateTerrain() {

    for (
        let x = -WORLD_SIZE / 2;
        x < WORLD_SIZE / 2;
        x++
    ) {

        for (
            let z = -WORLD_SIZE / 2;
            z < WORLD_SIZE / 2;
            z++
        ) {

            const h = heightAt(x, z);


            for (
                let y = 0;
                y <= h;
                y++
            ) {

                let type = "stone";

                if (y === h) {

                    type = "grass";

                } else if (y > h - 3) {

                    type = "dirt";

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


generateTerrain();


// ---------- TREES ----------

function createTree(x, y, z) {

    // trunk

    for (let i = 0; i < 4; i++) {

        createBlock(
            x,
            y + i + 1,
            z,
            "wood"
        );
    }


    // leaves

    for (
        let lx = -2;
        lx <= 2;
        lx++
    ) {

        for (
            let lz = -2;
            lz <= 2;
            lz++
        ) {

            for (
                let ly = 3;
                ly <= 5;
                ly++
            ) {

                if (
                    Math.abs(lx) +
                    Math.abs(lz) < 4
                ) {

                    createBlock(
                        x + lx,
                        y + ly,
                        z + lz,
                        "leaves"
                    );
                }
            }
        }
    }
}


for (let i = 0; i < 25; i++) {

    const x =
        Math.floor(
            Math.random() * 30
        ) - 15;

    const z =
        Math.floor(
            Math.random() * 30
        ) - 15;

    const y =
        heightAt(x, z);

    createTree(
        x,
        y,
        z
    );
}


// ---------- PLAYER ----------

const player = {

    position: new THREE.Vector3(
        0,
        12,
        0
    ),

    velocity: new THREE.Vector3(),

    height: 1.8,

    radius: 0.3,

    speed: 6,

    jumpPower: 8,

    onGround: false
};


camera.position.copy(
    player.position
);


// ---------- MOUSE LOOK ----------

let yaw = 0;
let pitch = 0;

let mouseLocked = false;


document.addEventListener(
    "mousemove",
    function (event) {

        if (!mouseLocked) return;

        yaw -= event.movementX * 0.002;

        pitch -= event.movementY * 0.002;

        pitch = Math.max(
            -Math.PI / 2 + 0.01,
            Math.min(
                Math.PI / 2 - 0.01,
                pitch
            )
        );
    }
);


renderer.domElement.addEventListener(
    "click",
    function () {

        renderer.domElement.requestPointerLock();

    }
);


document.addEventListener(
    "pointerlockchange",
    function () {

        mouseLocked =
            document.pointerLockElement ===
            renderer.domElement;

    }
);


// ---------- KEYBOARD ----------

const keys = {};

document.addEventListener(
    "keydown",
    function (event) {

        keys[event.code] = true;


        // Jump

        if (
            event.code === "Space" &&
            player.onGround
        ) {

            player.velocity.y =
                player.jumpPower;

            player.onGround = false;
        }


        // Number keys

        if (
            event.code.startsWith("Digit")
        ) {

            const number =
                Number(
                    event.code.replace(
                        "Digit",
                        ""
                    )
                );

            if (
                number >= 1 &&
                number <= 5
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
    function (event) {

        keys[event.code] = false;

    }
);


// ---------- HOTBAR ----------

const blockTypes = [
    "grass",
    "dirt",
    "stone",
    "wood",
    "leaves"
];

let selectedBlock = "grass";


const slots =
    document.querySelectorAll(
        ".slot"
    );


function selectBlock(index) {

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
            function () {

                selectBlock(index);

            }
        );

    }
);


// ---------- COLLISION ----------

function getBlockAt(
    x,
    y,
    z
) {

    const bx =
        Math.round(x);

    const by =
        Math.round(y);

    const bz =
        Math.round(z);


    for (
        let i = 0;
        i < blocks.length;
        i++
    ) {

        const block =
            blocks[i];

        if (
            Math.round(
                block.position.x
            ) === bx &&

            Math.round(
                block.position.y
            ) === by &&

            Math.round(
                block.position.z
            ) === bz
        ) {

            return block;

        }
    }


    return null;
}


function collides(
    position
) {

    const minX =
        position.x - player.radius;

    const maxX =
        position.x + player.radius;

    const minY =
        position.y - player.height;

    const maxY =
        position.y;


    const minZ =
        position.z - player.radius;

    const maxZ =
        position.z + player.radius;


    for (
        let x = Math.floor(minX);
        x <= Math.ceil(maxX);
        x++
    ) {

        for (
            let y = Math.floor(minY);
            y <= Math.ceil(maxY);
            y++
        ) {

            for (
                let z = Math.floor(minZ);
                z <= Math.ceil(maxZ);
                z++
            ) {

                if (
                    getBlockAt(
                        x,
                        y,
                        z
                    )
                ) {

                    const bx =
                        x;

                    const by =
                        y;

                    const bz =
                        z;


                    if (
                        maxX > bx - 0.5 &&
                        minX < bx + 0.5 &&

                        maxY > by - 0.5 &&
                        minY < by + 0.5 &&

                        maxZ > bz - 0.5 &&
                        minZ < bz + 0.5
                    ) {

                        return true;
                    }
                }
            }
        }
    }

    return false;
}


// ---------- RAYCASTING ----------

const raycaster =
    new THREE.Raycaster();


function getTargetBlock() {

    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );


    const hits =
        raycaster.intersectObjects(
            blocks
        );


    if (
        hits.length === 0
    ) {

        return null;

    }


    if (
        hits[0].distance > 7
    ) {

        return null;

    }


    return hits[0];

}


// ---------- BREAK BLOCK ----------

document.addEventListener(
    "mousedown",
    function (event) {

        if (!mouseLocked) return;


        const hit =
            getTargetBlock();


        if (!hit) return;


        // Left click

        if (
            event.button === 0
        ) {

            const block =
                hit.object;


            // Don't destroy the entire world

            if (
                block.position.y <= 0
            ) {

                return;

            }


            world.remove(block);

            const index =
                blocks.indexOf(block);

            if (index !== -1) {

                blocks.splice(
                    index,
                    1
                );
            }
        }


        // Right click

        if (
            event.button === 2
        ) {

            const normal =
                hit.face.normal;


            const position =
                hit.object.position.clone();


            position.add(
                normal
            );


            const existing =
                getBlockAt(
                    position.x,
                    position.y,
                    position.z
                );


            if (
                existing
            ) {

                return;

            }


            const testPosition =
                new THREE.Vector3(
                    position.x,
                    position.y + 1,
                    position.z
                );


            // Don't place inside player

            if (
                collides(
                    testPosition
                )
            ) {

                return;

            }


            createBlock(
                position.x,
                position.y,
                position.z,
                selectedBlock
            );
        }
    }
);


// Prevent browser context menu

document.addEventListener(
    "contextmenu",
    function (event) {

        event.preventDefault();

    }
);


// ---------- MOVEMENT ----------

function updateMovement(
    delta
) {

    const direction =
        new THREE.Vector3();


    const forward =
        new THREE.Vector3(
            -Math.sin(yaw),
            0,
            -Math.cos(yaw)
        );


    const right =
        new THREE.Vector3(
            Math.cos(yaw),
            0,
            -Math.sin(yaw)
        );


    if (keys["KeyW"]) {

        direction.add(
            forward
        );

    }

    if (keys["KeyS"]) {

        direction.sub(
            forward
        );

    }

    if (keys["KeyD"]) {

        direction.add(
            right
        );

    }

    if (keys["KeyA"]) {

        direction.sub(
            right
        );

    }


    if (
        direction.lengthSq() > 0
    ) {

        direction.normalize();

    }


    const moveSpeed =
        player.speed * delta;


    const nextX =
        player.position.clone();

    nextX.x +=
        direction.x *
        moveSpeed;


    if (
        !collides(nextX)
    ) {

        player.position.x =
            nextX.x;

    }


    const nextZ =
        player.position.clone();

    nextZ.z +=
        direction.z *
        moveSpeed;


    if (
        !collides(nextZ)
    ) {

        player.position.z =
            nextZ.z;

    }


    // Gravity

    player.velocity.y -=
        20 * delta;


    const nextY =
        player.position.clone();

    nextY.y +=
        player.velocity.y *
        delta;


    if (
        !collides(nextY)
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

        player.velocity.y = 0;

    }


    // Respawn if falling

    if (
        player.position.y < -20
    ) {

        player.position.set(
            0,
            15,
            0
        );

        player.velocity.set(
            0,
            0,
            0
        );

    }
}


// ---------- CAMERA ----------

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


// ---------- GAME LOOP ----------

let previousTime =
    performance.now();


function animate() {

    requestAnimationFrame(
        animate
    );


    const now =
        performance.now();


    let delta =
        (now - previousTime) /
        1000;


    previousTime =
        now;


    delta =
        Math.min(
            delta,
            0.05
        );


    updateMovement(
        delta
    );


    updateCamera();


    renderer.render(
        scene,
        camera
    );
}


animate();


// ---------- RESIZE ----------

window.addEventListener(
    "resize",
    function () {

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
