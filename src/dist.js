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