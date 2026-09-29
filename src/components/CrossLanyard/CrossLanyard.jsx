/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint
} from '@react-three/rapier';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';

import crossUrl from '../../assets/imgs/orthodox cross.stl?url';
import './CrossLanyard.css';

const TARGET_HEIGHT = 2.4;

function useCrossGeometry() {
  const raw = useLoader(STLLoader, crossUrl);
  return useMemo(() => {
    const g = raw.clone();
    g.computeBoundingBox();
    const size = new THREE.Vector3();
    g.boundingBox.getSize(size);

    // El STL suele venir con el eje largo en Z: lo ponemos vertical (Y).
    if (size.z > size.y && size.z >= size.x) {
      g.rotateX(-Math.PI / 2);
    } else if (size.x > size.y && size.x > size.z) {
      g.rotateZ(-Math.PI / 2);
    }
    g.computeBoundingBox();
    g.boundingBox.getSize(size);

    const s = TARGET_HEIGHT / size.y;
    g.scale(s, s, s);
    g.computeBoundingBox();
    const center = new THREE.Vector3();
    g.boundingBox.getCenter(center);
    g.translate(-center.x, -center.y, -center.z);
    g.computeBoundingBox();
    return g;
  }, [raw]);
}

/**
 * Cinta de la banda: tira de triángulos que seguimos la cuerda cada frame.
 * (Sustituye a meshline para no depender de shaders con quirirguería.)
 */
function createStripGeometry(seg) {
  const g = new THREE.BufferGeometry();
  const rows = seg + 1;
  const pos = new Float32Array(rows * 2 * 3);
  const uv = new Float32Array(rows * 2 * 2);
  const index = [];
  for (let r = 0; r < rows; r++) {
    uv[r * 4 + 0] = 0;
    uv[r * 4 + 1] = r / seg;
    uv[r * 4 + 2] = 1;
    uv[r * 4 + 3] = r / seg;
    if (r < seg) {
      const a = r * 2;
      const b = r * 2 + 1;
      const c = (r + 1) * 2;
      const d = (r + 1) * 2 + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(index);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  return g;
}

function CrossLanyard({
  position = [0, 0, 16],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  lanyardWidth = 1
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="cross-lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
        aria-hidden="true"
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band isMobile={isMobile} lanyardWidth={lanyardWidth} cameraZ={position[2]} fov={fov} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
      <span className="sr-only">Cruz ortodoxa en 3D</span>
    </div>
  );
}

function Band({ maxSpeed = 50, minSpeed = 0, isMobile = false, lanyardWidth = 1, cameraZ = 16, fov = 20 }) {
  const band = useRef();
  const strip = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const geometry = useCrossGeometry();

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const perp = new THREE.Vector3();

  const segmentProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  };

  const half = useMemo(() => {
    geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    return {
      x: Math.max(0.05, size.x / 2),
      y: Math.max(0.05, size.y / 2),
      z: Math.max(0.03, size.z / 2)
    };
  }, [geometry]);

  // Ancla por encima del encuadre + cuerda con longitud justa para que la
  // cruz quede centrada verticalmente en reposo.
  const { anchorY, segLen, spacing } = useMemo(() => {
    const viewHalf = Math.tan((fov * Math.PI) / 360) * cameraZ;
    const anchor = viewHalf + 1.6;
    const ropeLen = Math.max(0.55, (anchor - half.y) * 0.284);
    return { anchorY: anchor, segLen: ropeLen, spacing: ropeLen * 0.5 };
  }, [cameraZ, fov, half.y]);

  const seg = isMobile ? 16 : 32;
  const bandWidth = 0.075 * lanyardWidth;

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
      ])
  );
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  const stripGeometry = useMemo(() => createStripGeometry(seg), [seg]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], segLen]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], segLen]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], segLen]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, half.y, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useEffect(() => () => stripGeometry.dispose(), [stripGeometry]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      });
    }

    if (
      !fixed.current ||
      !j1.current ||
      !j2.current ||
      !j3.current ||
      !card.current ||
      !band.current ||
      !strip.current
    ) {
      return;
    }

    [j1, j2].forEach(ref => {
      if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
      const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
      ref.current.lerped.lerp(
        ref.current.translation(),
        delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
      );
    });

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(j2.current.lerped);
    curve.points[2].copy(j1.current.lerped);
    curve.points[3].copy(fixed.current.translation());

    // Cinta que sigue la cuerda (de la cruz hacia el ancla).
    const pts = curve.getPoints(seg);
    const arr = strip.current.geometry.attributes.position.array;
    for (let r = 0; r <= seg; r++) {
      const s = seg - r; // fila 0 = ancla (arriba)
      const p = pts[s];
      const prev = pts[Math.max(0, s - 1)];
      const next = pts[Math.min(seg, s + 1)];
      tan.copy(next).sub(prev);
      if (tan.lengthSq() < 1e-8) tan.set(0, 1, 0);
      perp.set(-tan.y, tan.x, 0);
      if (perp.lengthSq() < 1e-8) perp.set(1, 0, 0);
      perp.normalize().multiplyScalar(bandWidth / 2);

      const i0 = r * 6;
      arr[i0 + 0] = p.x - perp.x;
      arr[i0 + 1] = p.y - perp.y;
      arr[i0 + 2] = p.z - perp.z;
      arr[i0 + 3] = p.x + perp.x;
      arr[i0 + 4] = p.y + perp.y;
      arr[i0 + 5] = p.z + perp.z;
    }
    strip.current.geometry.attributes.position.needsUpdate = true;

    ang.copy(card.current.angvel());
    rot.copy(card.current.rotation());
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
  });

  curve.curveType = 'chordal';

  return (
    <>
      <group position={[0, anchorY, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[spacing, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[spacing * 2, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[spacing * 3, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[spacing * 4, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[half.x, half.y, half.z]} />
          <mesh
            geometry={geometry}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={e => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            <meshPhysicalMaterial color="#ffffff" roughness={0.4} metalness={0.05} clearcoat={0.6} />
          </mesh>
        </RigidBody>
      </group>

      <mesh ref={strip} geometry={stripGeometry} frustumCulled={false} renderOrder={5}>
        <meshBasicMaterial color="#f4f4f5" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      <group ref={band} />
    </>
  );
}

export default CrossLanyard;
