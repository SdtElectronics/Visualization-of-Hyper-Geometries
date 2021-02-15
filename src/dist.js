const renderer = new THREE.WebGLRenderer({antialias:true}), 
      camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 10000), 
      scene = new THREE.Scene(), 
      light = new THREE.DirectionalLight(0xffffff), 
      stats = new Stats(),
      controls = new THREE.OrbitControls( camera, renderer.domElement ); 

const grd = document.getElementById("g"),
     rta = document.getElementById("r"),
     sp = document.getElementById("s");

const gridXY = new THREE.GridHelper(5000, 50, 0xEED5B7, 0xEED5B7);

animate.r = false;

document.getElementById("grid").onclick = e => {
    if(gridXY.visible)
        grd.innerText = "show grid";
    else
        grd.innerText = "hide grid";
    gridXY.visible = !gridXY.visible;
}

document.getElementById("rotate").onclick = e => {
    if(controls.autoRotate)
        rta.innerText = "rotate horizon";
    else
        rta.innerText = "fix horizon";
    controls.autoRotate = !controls.autoRotate;
};

document.getElementById("spin").onclick = e => {
    if(animate.r)
        sp.innerText = "rotate objects";
    else
        sp.innerText = "fix objects";
    animate.r = !animate.r;
};

document.getElementById("cls").onclick = () => geomBase.purge();

document.onload = draw();

Object.defineProperty(window, 'cls', {get: () => geomBase.purge()});

const parseVec = str => str.split(",").map(num => parseInt(num));

const parseMat = str => str.split(";").map(vec => parseVec(vec));

const genVecValidation = dim => `\\s*${Array(dim).fill("\\d+").join("\\s*,\\s*")}\\s*`;

const hyCbDims = document.getElementById("hyCbDims");
const hyCbEdge = document.getElementById("hyCbEdge");
const hyCbBias = document.getElementById("hyCbBias");
const hyCbSpin = document.getElementById("hyCbSpin");
const simpEdge = document.getElementById("simpEdge");
const simpBias = document.getElementById("simpBias");
const simpSpin = document.getElementById("simpSpin");
const tnsrBias = document.getElementById("tnsrBias");
const tnsrSpin = document.getElementById("tnsrSpin");

const addDemoCb = [
    () => new hyperCube(4, Array(4).fill(100), [0,50,50], [], [[0, 3], [1, 3]], 0),
    () => new hyperCube(4, Array(4).fill(80), [-150,80,50], [], [[0, 3], [1, 3]], 1),
    () => new hyperCube(5, Array(5).fill(80), [150,80,50], [], [[0,4], [1, 4]], 1),
    () => new simplex4( Array(4).fill(100), null, [[0,1, Math.PI/4], [0,1, Math.PI/4]], [[2, 3]], 0),
    () => new nDtensor([[0,-70,0],[70,0,0],[0,0,0]]),
    () => ndArr.fromFunc([e => e[1] / 3, e => -e[0] / 3, e => 0, e => -e[3] / 5], -160,[], 5, 80, 4, 0,[], null, 0),
    () => ndArr.fromFunc([e => e[0] / 5, e => e[1] / 5, e => e[2] / 5, e => e[3]/5], -100,[], 5, 50, 4, 0,[[0,3],[2,3]], null, 0),
    () => ndArr.fromFunc([e => e[1] / 5, e => -e[2] / 5, e => e[0] / 5, e => -e[3] / 5], -160,[], 5, 80, 4, 0,[[0,3],[2,3]], null, 0)
];

const addGeomCb = [
    e => {    
        if(!hyCbDims.checkValidity()){
            alert("Dimension must be an integer greater than 3");
            return false;
        }
        const dim = parseInt(hyCbDims.value);
        if(!hyCbEdge.checkValidity()){
            alert(`Length of edges must be a vector of dimension ${dim}`);
            return false;
        }
        const edge = parseVec(hyCbEdge.value);
        if(!hyCbBias.checkValidity()){
            alert("Offset must be a vector of dimension 3");
            return false;
        }
        const offset = parseVec(hyCbBias.value);
        if(!hyCbSpin.checkValidity()){
            alert("Invalid Spin Matrix");
            return false;
        }
        const spin = [... new Set(parseMat(hyCbSpin.value))]; //mimic Array.prototype.unique
        const projType = document.querySelector("input[name='hyCbProjType']:checked").value;
        new hyperCube(dim, edge, offset, [], spin, projType == 0);
        return true;
    },
    e => {
        if(!simpEdge.checkValidity()){
            alert(`Length of edges must be a vector of dimension 4`);
            return false;
        }
        const edge = parseVec(simpEdge.value);
        if(!simpBias.checkValidity()){
            alert("Offset must be a vector of dimension 3");
            return false;
        }
        const offset = parseVec(simpBias.value);
        if(!simpSpin.checkValidity()){
            alert("Invalid Spin Matrix");
            return false;
        }
        const spin = [... new Set(parseMat(simpSpin.value))]; //mimic Array.prototype.unique
        const projType = document.querySelector("input[name='simpProjType']:checked").value;
        new simplex4(edge, offset, [], spin, projType==0);
        return true;
    },
    e => {
        if(!tnsrEdge.checkValidity()){
            alert(`Expected a 3x3 matrix`);
            return false;
        }
        const edge = parseMat(tnsrEdge.value);
        if(!tnsrBias.checkValidity()){
            alert("Offset must be a vector of dimension 3");
            return false;
        }
        const offset = parseVec(tnsrBias.value);
        new nDtensor(edge, offset);
        return true;
    },
    e => {
        addDemoCb[parseInt(document.getElementById("demoType").value)]();
        location.href = "#";
    }
];

const routeCb = e => {
    const rt = document.location.href.split("?").pop();
    if(/^Demo\d$/.test(rt)){
        addDemoCb[parseInt(rt.slice(-1))]();
    }
}

window.onload = routeCb;
window.onpopstate = routeCb;

document.getElementById("addGeom").onclick = e => {
    if(addGeomCb[parseInt(document.getElementById("geomType").value)]()){
        location.href = "#";
    }
};

hyCbDims.onchange = e => {
    if(e.target.checkValidity()){
        const dim = parseInt(hyCbDims.value);
        hyCbEdge.pattern = genVecValidation(dim);
        const range = `[0-${dim - 1}]`;
        const combs = dim * (dim - 1) / 2 - 1;
        hyCbSpin.pattern = `(${range}\\s*,\\s*${range}\\s*;\\s*){0,${combs}}(${range}\\s*,\\s*${range}\\s*)`
    }
}

function initRender() { 
    renderer.autoUpdateObjects = true;
    renderer.setSize(window.innerWidth, window.innerHeight); 
    document.body.appendChild(renderer.domElement); 
} 
    
function initCamera() { 

    camera.position.set(0, 0, 400);
    camera.up.x=0;      
    camera.up.y=1;     
    camera.up.z=0; 
    camera.minPolarAngle = -Math.PI;
    geomBase.camera = camera;
} 
    
function initLight() { 
    scene.add(new THREE.AmbientLight(0x404040)); 
    light.position.set(1,1,1); 
    scene.add(light); 
} 
    
function initModel() { 
    gridXY.position.set( 0,0,0 );
    //gridXY.rotation.x = Math.PI/2;
    scene.add(gridXY);
} 
    
function initStats() { 
    document.body.appendChild(stats.dom); 
} 

function initControls() { 

    // 使动画循环使用时阻尼或自转 意思是否有惯性 
    controls.enableDamping = true; 
    //动态阻尼系数 就是鼠标拖拽旋转灵敏度 
    //controls.dampingFactor = 0.25; 
    //是否可以缩放 
    controls.enableZoom = true; 
    //是否自动旋转 
    //controls.autoRotate = false; 
    //设置相机距离原点的最远距离 
    controls.minDistance = 200; 
    //设置相机距离原点的最远距离 
    controls.maxDistance = 2000; 
    //是否开启右键拖拽 
    controls.enablePan = true; 

} 
    

function render() { 

    renderer.render( scene, camera ); 
} 
    

function onWindowResize() { 
    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix(); 
    render(); 
    renderer.setSize( window.innerWidth, window.innerHeight ); 
} 
    

function animate() { 
    if(animate.r)
        geomBase.update();
    controls.update(); 
    render(); 
    stats.update(); 
    requestAnimationFrame(animate); 
} 
    

function draw() { 
    initRender(); 
    initCamera(); 
    initLight(); 
    initModel(); 
    initControls(); 
    initStats(); 
    animate(); 
    window.onresize = onWindowResize; 
} 