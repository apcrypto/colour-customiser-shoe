const swatchItems = document.querySelector('.swatch-items');
let loaded = false;
let theModel;
let activeOption = 'laces';
const cameraFar = 5;
const modelPath = './assets/shoe.glb';
const backgroundColor = 0xf1f1f1;

const colors = [
  {
    texture: './assets/mat_suede_charcoal.jpg',
    size: [3, 3, 3],
    shininess: 0,
  },
  {
    texture: './assets/mat_suede_dressblue.jpg',
    size: [3, 3, 3],
    shininess: 0,
  },
  {
    texture: './assets/mat_suede_glazedginger.jpg',
    size: [3, 3, 3],
    shininess: 0,
  },
  {
    texture: './assets/mat_suede_racing_red.jpg',
    size: [3, 3, 3],
    shininess: 0,
  },
  { color: '63c7e5' },
  { color: 'df73b2' },
  { color: 'f77036' },
  { color: 'fff200' },
  { color: '86cc8c' },
  { color: 'a26ab2' },
  { color: '3b45a3' },
  { color: 'fee2e0' },
];

// Initialise the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(backgroundColor);

const canvas = document.querySelector('#canvas');

// Initialise the renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Initialise the camera
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, cameraFar);

// Initial material
const initialMaterial = new THREE.MeshPhongMaterial({
  color: 0xf1f1f1,
  shininess: 10,
});

const initialMap = [
  { childID: 'laces', mtl: initialMaterial },
  { childID: 'trim', mtl: initialMaterial },
  { childID: 'side', mtl: initialMaterial },
  { childID: 'Vamp', mtl: initialMaterial },
  { childID: 'stitch', mtl: initialMaterial },
  { childID: 'rear_sole', mtl: initialMaterial },
  { childID: 'Toe', mtl: initialMaterial },
  { childID: 'above_sole', mtl: initialMaterial },
];

// Function to initialise color on model parts
function initColor(parent, type, mtl) {
  parent.traverse((o) => {
    if (o.isMesh && o.name.includes(type)) {
      o.material = mtl;
      o.nameID = type;
    }
  });
}

// Initialise the object loader
const loader = new THREE.GLTFLoader();
loader.load(
  modelPath,
  (gltf) => {
    theModel = gltf.scene;
    theModel.traverse((o) => {
      if (o.isMesh) o.receiveShadow = true;
    });
    theModel.scale.set(1, 1, 1);
    theModel.rotation.set(0.09, 12, 0);
    theModel.position.y = -1;
    initialMap.forEach((object) =>
      initColor(theModel, object.childID, object.mtl)
    );
    scene.add(theModel);
  },
  undefined,
  (error) => console.error(error)
);

// Add lights to the scene
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
dirLight.position.set(-8, 12, 8);
scene.add(dirLight);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshPhongMaterial({ color: 0xeeeeee, shininess: 0 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

// Function for initial rotation of the model
let initRotate = 0;

function initialRotation() {
  if (initRotate <= 60) {
    theModel.rotation.y += Math.PI / 30;
    initRotate++;
  } else {
    loaded = true;
  }
}

// Initialise orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;
controls.enableZoom = false;

// Animate function
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);

  if (resizeRendererToDisplaySize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  if (theModel && !loaded) initialRotation();
}
animate();

// Function to resize renderer to display size
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const needResize =
    canvas.width !== width || canvas.height !== height;

  if (needResize) renderer.setSize(width, height, false);

  return needResize;
}

// Function to build color swatches
function buildColors(colors) {
  colors.forEach((color, i) => {
    const swatch = document.createElement('div');
    swatch.classList.add('swatch');
    swatch.style.background = color.texture
      ? `url(${color.texture})`
      : `#${color.color}`;
    swatch.dataset.key = i;
    swatchItems.append(swatch);
  });
}
buildColors(colors);

// Function to select an option
function selectOption(e) {
  activeOption = e.target.dataset.option;
  document
    .querySelectorAll('.option')
    .forEach((option) => option.classList.remove('--is-active'));
  e.target.classList.add('--is-active');
}

document
  .querySelectorAll('.option')
  .forEach((option) =>
    option.addEventListener('click', selectOption)
  );

// Function to select a swatch
function selectSwatch(e) {
  const color = colors[parseInt(e.target.dataset.key)];
  const newMaterial = color.texture
    ? createTextureMaterial(color)
    : createColorMaterial(color);

  setMaterial(theModel, activeOption, newMaterial);
}

function createTextureMaterial(color) {
  const texture = new THREE.TextureLoader().load(color.texture);
  texture.repeat.set(...color.size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshPhongMaterial({
    map: texture,
    shininess: color.shininess || 10,
  });
}

function createColorMaterial(color) {
  return new THREE.MeshPhongMaterial({
    color: parseInt(`0x${color.color}`),
    shininess: color.shininess || 10,
  });
}

function setMaterial(parent, type, mtl) {
  parent.traverse((o) => {
    if (o.isMesh && o.nameID === type) {
      o.material = mtl;
    }
  });
}

document
  .querySelectorAll('.swatch')
  .forEach((swatch) =>
    swatch.addEventListener('click', selectSwatch)
  );
