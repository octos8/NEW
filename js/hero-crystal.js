import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const home=document.querySelector('#home[data-crystal-hero]');
const stage=home?.querySelector('.hero-stage');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
try {
const canvas = document.querySelector("#hero-crystal-canvas");


const renderer = new THREE.WebGLRenderer({

  canvas,

  antialias: true,

  alpha: true,

  powerPreference: "high-performance"

});


renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 1.7)
);


renderer.setSize(
  window.innerWidth,
  window.innerHeight
);


renderer.outputColorSpace =
  THREE.SRGBColorSpace;


renderer.toneMapping =
  THREE.ACESFilmicToneMapping;


renderer.toneMappingExposure = 1.0;



/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();


scene.background = null;



/* =========================================================
   CAMERA
========================================================= */

const camera =
  new THREE.PerspectiveCamera(

    38,

    window.innerWidth /
    window.innerHeight,

    0.1,

    100

  );


camera.position.set(
  0,
  0,
  11.5
);



/* =========================================================
   ENVIRONMENT
   유리의 반사 / 굴절 표현에서 가장 중요
========================================================= */

const pmremGenerator =
  new THREE.PMREMGenerator(renderer);


const roomEnvironment =
  new RoomEnvironment();


const environmentTexture =
  pmremGenerator
  .fromScene(roomEnvironment, 0.04)
  .texture;


scene.environment =
  environmentTexture;


roomEnvironment.dispose();

pmremGenerator.dispose();



/* =========================================================
   LIGHT
========================================================= */


/*
화이트 키라이트
*/

const keyLight =
  new THREE.DirectionalLight(
    0xffffff,
    4.5
  );


keyLight.position.set(
  -4,
  7,
  7
);

scene.add(keyLight);



/*
쿨 블루
*/

const coolLight =
  new THREE.PointLight(
    0x91ded5,
    35,
    20
  );


coolLight.position.set(
  -5,
  1,
  5
);

scene.add(coolLight);



/*
핑크 / 마젠타 계열
프리즘 색 분산 보조
*/

const pinkLight =
  new THREE.PointLight(
    0xbfa5ea,
    22,
    18
  );


pinkLight.position.set(
  5,
  3,
  3
);

scene.add(pinkLight);



/*
따뜻한 스펙트럼
*/

const warmLight =
  new THREE.PointLight(
    0xf4d9a7,
    18,
    18
  );


warmLight.position.set(
  1,
  -5,
  4
);

scene.add(warmLight);



/* =========================================================
   GLASS MATERIAL

   네가 준 프롬프트 핵심:

   clear optical prism glass
   thick crystal
   transmission
   refraction
   chromatic dispersion
   glossy reflection
   cool blue tint
   beveled edges
   iridescence
========================================================= */

const glassMaterial =
  new THREE.MeshPhysicalMaterial({

    /*
    거의 투명한 쿨 그레이 블루
    */

    color:
      new THREE.Color(
        0xdce0e6
      ),


    metalness:
      0,


    roughness:
      0.035,


    /*
    핵심
    */

    transmission:
      1,


    opacity:
      1,


    transparent:
      true,


    /*
    유리 내부 두께
    */

    thickness:
      0.8,


    /*
    실제 크리스털 굴절률 느낌
    */

    ior:
      1.52,


    /*
    내부 색감
    */

    attenuationColor:
      new THREE.Color(
        0xb8c1cf
      ),


    attenuationDistance:
      12,


    /*
    반사
    */

    specularIntensity:
      0.45,


    specularColor:
      new THREE.Color(
        0xffffff
      ),


    envMapIntensity: 0.7,


    /*
    표면 코팅
    */

    clearcoat:
      0.2,


    clearcoatRoughness:
      0.18,


    /*
    약한 홀로그램 느낌
    */

    iridescence: 0.08,


    iridescenceIOR:
      1.3,


    iridescenceThicknessRange:
      [
        100,
        450
      ],


    side:
      THREE.DoubleSide

  });



/*
Three.js 최신 버전
Chromatic Dispersion

RGB 빛 분리
*/

if (
  "dispersion"
  in
  glassMaterial
) {

  glassMaterial.dispersion =
    0.22;

}



/* =========================================================
   CUBE GROUP
========================================================= */

const group =
  new THREE.Group();


scene.add(group);



/* =========================================================
   SETTINGS
========================================================= */

const PIECES_PER_AXIS = 3;


/*
3 × 3 × 3

= 27개
*/

const PIECE_COUNT =
  PIECES_PER_AXIS ** 3;


const PIECE_SIZE =
  0.82;


const CUBE_GAP =
  0.42;



/* =========================================================
   BEVELED CUBE GEOMETRY

   RoundedBox를 이용해서
   빛이 모서리에 걸리게 함
========================================================= */

const geometry =
  new RoundedBoxGeometry(

    PIECE_SIZE,
    PIECE_SIZE,
    PIECE_SIZE,

    4,

    0.055

  );



/* =========================================================
   RANDOM
========================================================= */

function seededRandom(seed) {

  let value =
    Math.sin(seed * 9999.91)
    * 43758.5453;

  return value -
    Math.floor(value);

}



/* =========================================================
   STATE ARRAYS
========================================================= */

const cubePositions = [];

const scatterPositions1 = [];

const barPositions = [];

const scatterPositions2 = [];

const questionPositions = [];


const cubeRotations = [];

const scatterRotations1 = [];

const barRotations = [];

const scatterRotations2 = [];

const questionRotations = [];



/* =========================================================
   ORIGINAL CUBE POSITION
========================================================= */

for (
  let x = 0;
  x < PIECES_PER_AXIS;
  x++
) {

  for (
    let y = 0;
    y < PIECES_PER_AXIS;
    y++
  ) {

    for (
      let z = 0;
      z < PIECES_PER_AXIS;
      z++
    ) {

      const px =
        (
          x -
          (PIECES_PER_AXIS - 1) / 2
        )
        *
        CUBE_GAP;


      const py =
        (
          y -
          (PIECES_PER_AXIS - 1) / 2
        )
        *
        CUBE_GAP;


      const pz =
        (
          z -
          (PIECES_PER_AXIS - 1) / 2
        )
        *
        CUBE_GAP;


      cubePositions.push(

        new THREE.Vector3(
          px,
          py,
          pz
        )

      );


      cubeRotations.push(

        new THREE.Quaternion()

      );

    }

  }

}



/* =========================================================
   SCATTER 01
========================================================= */

for (
  let i = 0;
  i < PIECE_COUNT;
  i++
) {

  const angle =
    seededRandom(i + 10)
    *
    Math.PI
    *
    2;


  const radius =
    2.3
    +
    seededRandom(i + 20)
    *
    3.5;


  const y =
    (
      seededRandom(i + 30)
      -
      0.5
    )
    *
    7;


  const z =
    (
      seededRandom(i + 40)
      -
      0.5
    )
    *
    5;


  scatterPositions1.push(

    new THREE.Vector3(

      Math.cos(angle)
      *
      radius,

      y,

      Math.sin(angle)
      *
      radius
      *
      0.45
      +
      z
      *
      0.4

    )

  );


  const euler =
    new THREE.Euler(

      seededRandom(i + 50)
      *
      Math.PI
      *
      2,

      seededRandom(i + 60)
      *
      Math.PI
      *
      2,

      seededRandom(i + 70)
      *
      Math.PI
      *
      2

    );


  scatterRotations1.push(

    new THREE.Quaternion()
    .setFromEuler(euler)

  );

}



/* =========================================================
   BAR

   3 × 9 × 1
   = 27
========================================================= */


const pieces = [];


for (
  let i = 0;
  i < PIECE_COUNT;
  i++
) {

  const mesh =
    new THREE.Mesh(
      geometry,
      glassMaterial
    );


  mesh.position.copy(
    cubePositions[i]
  );


  /*
  애니메이션용
  */

  mesh.userData.phase =
    seededRandom(i + 1000)
    *
    Math.PI
    *
    2;


  mesh.userData.speed =
    0.7
    +
    seededRandom(i + 1100)
    *
    1.3;


  mesh.userData.float =
    0.05
    +
    seededRandom(i + 1200)
    *
    0.15;


  group.add(mesh);


  pieces.push(mesh);

}



/* =========================================================
   TEMP OBJECTS
========================================================= */


const tilt=new THREE.Euler(.52,Math.PI / 4,0);
group.position.set(-.14,.14,0);
const drag={x:0,y:0,id:null,lastX:0,lastY:0};
canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0 || drag.id!==null)return;
  drag.id=event.pointerId;drag.lastX=event.clientX;drag.lastY=event.clientY;
  canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';
});
canvas.addEventListener('pointermove',event=>{
  if(event.pointerId!==drag.id)return;
  drag.y+=(event.clientX-drag.lastX)*.008;drag.x+=(event.clientY-drag.lastY)*.008;
  drag.lastX=event.clientX;drag.lastY=event.clientY;
});
function finish(event){if(event.pointerId!==drag.id)return;drag.id=null;canvas.style.cursor='grab';}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
canvas.addEventListener('lostpointercapture',finish);
canvas.addEventListener('dblclick',()=>{drag.x=0;drag.y=0;});
const originalCubePositions = cubePositions.map(position => position.clone());
const scatterExitPositions = pieces.map(() => new THREE.Vector3());
const inverseTilt = new THREE.Quaternion().setFromEuler(tilt).invert();
function resize(){
  const width=stage.clientWidth,height=stage.clientHeight;
  renderer.setSize(width,height,false);
  camera.aspect=width/Math.max(1,height);
  camera.position.z=width<600 ? 17.5 : 11.8;
  cubePositions.forEach((position, index) => {
    position.copy(originalCubePositions[index]).multiplyScalar(.90 / CUBE_GAP);
  });
  renderer.toneMappingExposure = 1.2;
  glassMaterial.color.setHex(0xe8e8e8);
  glassMaterial.attenuationColor.setHex(0xf2f2f2);
  camera.updateProjectionMatrix();
  const viewHeight=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*(camera.position.z+6);
  const exitRadius=Math.hypot(viewHeight*camera.aspect,viewHeight)/2+3;
  scatterExitPositions.forEach((position,index)=>{
    const angle=index*Math.PI*(3-Math.sqrt(5));
    const radius=exitRadius*(1+seededRandom(index+80)*.25);
    position.set(Math.cos(angle)*radius,Math.sin(angle)*radius,0).applyQuaternion(inverseTilt);
  });
}
home.classList.add('has-crystal-3d');
resize();
new ResizeObserver(resize).observe(stage);
canvas.classList.add('crystal-transition-canvas');
document.body.append(canvas);
let progress=0;
function animate(){
  requestAnimationFrame(animate);
  if(document.hidden)return;
  const height=Math.max(1,stage.clientHeight);
  const scroll=-home.getBoundingClientRect().top;
  const distance=height*2.2;
  const target=motion.matches ? 0 : THREE.MathUtils.clamp(scroll/distance,0,1);
  progress+=(target-progress)*.16;
  if(Math.abs(target-progress)<.0001) progress=target;
  const fade=motion.matches
    ? THREE.MathUtils.clamp(scroll/height,0,1)
    : THREE.MathUtils.smoothstep(progress,.85,1);
  canvas.style.opacity=String(1-fade);
  canvas.style.pointerEvents=scroll<height*.25 && fade<1 ? 'auto' : 'none';
  if(scroll < -height || fade>=1) return;
  const t=progress*progress*(3-2*progress);
  const retreat=THREE.MathUtils.smoothstep(progress,0,.5);
  group.position.z=-6*retreat;
  pieces.forEach((piece,index)=>{
    piece.position.copy(cubePositions[index]).lerp(scatterExitPositions[index],t);
    piece.quaternion.copy(cubeRotations[index]).slerp(scatterRotations1[index],t);
  });
  group.rotation.set(tilt.x+drag.x,tilt.y+drag.y,0);
  stage.style.setProperty('--hero-ui-fade',String(Math.min(1,t*3)));
  renderer.render(scene,camera);
}
animate();
} catch(error){
  home?.classList.remove('has-crystal-3d');
  const failedCanvas=document.querySelector('#hero-crystal-canvas');
  failedCanvas?.classList.remove('crystal-transition-canvas');
  if(failedCanvas && stage) stage.append(failedCanvas);
  console.warn('Crystal renderer unavailable; displaying the reference image.',error);
}
