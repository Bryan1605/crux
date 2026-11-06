/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, interactionGroups, useSphericalJoint } from '@react-three/rapier';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';

import crossUrl from '../../assets/imgs/orthodox cross.stl?url';
import './CrossLanyard.css';

const TARGET_HEIGHT = 2.4;
/** Mismo corte que la maquetación del héroe (Home.css). */
const MOBILE_MAX = 900;
/** Velocidad máxima de la cruz al soltarla (unidades/s): un péndulo, no un proyectil. */
const MAX_SPEED = 9;

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
 * Cinta de la banda: tira de triángulos que sigue la cuerda cada frame.
 * (Sustituye a meshline para no depender de shaders con cirugía.)
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

/** La cámara de <Canvas> solo se fija al crearse: esto la acompaña si cambia la distancia. */
function CameraDistance({ z }) {
  const camera = useThree(s => s.camera);
  const invalidate = useThree(s => s.invalidate);
  useEffect(() => {
    camera.position.z = z;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, z]);
  return null;
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cruz ortodoxa colgada de una cinta, con física.
 *
 * El lienzo ocupa todo su contenedor (en la portada, todo el héroe, por detrás
 * del texto). `anchorX` (−1…1, coordenadas de pantalla) dice en qué vertical
 * cuelga y `restY` (−1…1) a qué altura queda el centro de la cruz en reposo.
 *
 * - Arranca ya colgada (sin caída) y se balancea como un péndulo: la cuerda es
 *   de longitud fija (articulaciones esféricas, sin holgura que rebote).
 * - Al arrastrarla no sale del lienzo ni pasa de lo que da la cuerda, y al
 *   soltarla su velocidad está limitada; solo gira en el plano de la pantalla.
 * - Se detiene (física y pintado) fuera de pantalla o con la pestaña oculta, y
 *   con «reducir movimiento» queda quieta.
 */
function CrossLanyard({ anchorX = 0, restY = 0, position = [0, 0, 16], gravity = [0, -30, 0], fov = 20, lanyardWidth = 1 }) {
  const wrapper = useRef(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [reduced] = useState(reducedMotion);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const el = wrapper.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const active = visible && pageVisible && !reduced;

  // Caja de la cruz en pantalla (la actualiza Band): un toque que empieza sobre
  // ella la arrastra sin hacer scroll; en cualquier otro punto, la página se
  // desplaza como siempre (el lienzo no bloquea el gesto).
  const hit = useRef(null);
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return undefined;
    const onTouchStart = e => {
      const box = hit.current;
      const t = e.touches[0];
      if (!box || !t) return;
      const r = el.getBoundingClientRect();
      if (Math.abs(t.clientX - r.left - box.x) <= box.hw && Math.abs(t.clientY - r.top - box.y) <= box.hh) e.preventDefault();
    };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    return () => el.removeEventListener('touchstart', onTouchStart);
  }, []);

  return (
    <div ref={wrapper} className="cross-lanyard-wrapper" data-state={active ? 'activa' : 'pausada'}>
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: true, antialias: !isMobile }}
        frameloop={active ? 'always' : 'demand'}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
        aria-hidden="true"
      >
        <CameraDistance z={position[2]} />
        <ambientLight intensity={Math.PI} />
        {/* Al cruzar el corte móvil/escritorio cambia el reposo: se rehace la cuerda. */}
        <Physics key={isMobile ? 'm' : 'd'} gravity={gravity} timeStep={1 / 60} paused={!active}>
          <Band
            isMobile={isMobile}
            lanyardWidth={lanyardWidth}
            cameraZ={position[2]}
            fov={fov}
            anchorX={anchorX}
            restY={restY}
            wrapper={wrapper}
            hit={hit}
          />
        </Physics>
        <Environment blur={0.75} resolution={isMobile ? 64 : 256}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
      <span className="sr-only">Cruz ortodoxa en 3D</span>
    </div>
  );
}

const LINKS = 3;
/**
 * Los colisionadores solo dan masa: no hay escenario con el que chocar, y si
 * los eslabones chocaran con la cruz (el último está justo en su borde) la
 * empujarían en cada cuadro y nunca quedaría quieta.
 */
const NO_COLLISIONS = interactionGroups(0, []);

function Band({ isMobile, lanyardWidth, cameraZ, fov, anchorX, restY, wrapper, hit }) {
  const strip = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();
  const geometry = useCrossGeometry();
  const { size } = useThree();

  const tmp = useMemo(
    () => ({
      vec: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      perp: new THREE.Vector3(),
      screen: new THREE.Vector3(),
      frame: 0
    }),
    []
  );

  const half = useMemo(() => {
    geometry.computeBoundingBox();
    const s = new THREE.Vector3();
    geometry.boundingBox.getSize(s);
    return { x: Math.max(0.05, s.x / 2), y: Math.max(0.05, s.y / 2), z: Math.max(0.03, s.z / 2) };
  }, [geometry]);

  // Encuadre en unidades del mundo (plano z = 0): el ancla queda por encima del
  // borde superior y la cuerda mide justo lo necesario para que el centro de la
  // cruz repose en `restY`.
  const layout = useMemo(() => {
    const viewH = Math.tan((fov * Math.PI) / 360) * cameraZ;
    const viewW = viewH * (size.width / Math.max(1, size.height));
    const x = anchorX * viewW;
    const anchorY = viewH + 0.6;
    const restCenter = restY * viewH;
    const total = Math.max(1.2, anchorY - restCenter - half.y);
    // Un poco menos que la cuerda tensa: llevarla justo al límite hace pelear a
    // las articulaciones y la simulación puede dispararse.
    return { viewH, viewW, x, anchorY, segLen: total / LINKS, reach: (total + half.y) * 0.96 };
  }, [fov, cameraZ, size.width, size.height, anchorX, restY, half.y]);

  const seg = isMobile ? 16 : 32;
  const bandWidth = 0.075 * lanyardWidth;
  const stripGeometry = useMemo(() => createStripGeometry(seg), [seg]);
  useEffect(() => () => stripGeometry.dispose(), [stripGeometry]);

  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  curve.curveType = 'chordal';
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  // Cuerda de longitud fija: cada eslabón se ancla a `segLen` por encima del
  // centro del siguiente (sin la holgura de una cuerda, que hacía rebotar).
  const { segLen } = layout;
  useSphericalJoint(fixed, j1, [[0, 0, 0], [0, segLen, 0]]);
  useSphericalJoint(j1, j2, [[0, 0, 0], [0, segLen, 0]]);
  useSphericalJoint(j2, j3, [[0, 0, 0], [0, segLen, 0]]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, half.y, 0]]);

  // Si cambia el encuadre (redimensionar), la cruz vuelve a colgar en reposo
  // bajo su nuevo ancla.
  const resetPose = useRef(() => {});
  resetPose.current = () => {
    const bodies = [fixed, j1, j2, j3];
    if (bodies.some(r => !r.current) || !card.current) return;
    bodies.forEach((r, i) => {
      r.current.setTranslation({ x: layout.x, y: layout.anchorY - segLen * i, z: 0 }, true);
      r.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      r.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    });
    card.current.setTranslation({ x: layout.x, y: layout.anchorY - segLen * LINKS - half.y, z: 0 }, true);
    card.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    card.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    card.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };
  useEffect(() => resetPose.current(), [layout, segLen, half.y]);

  useEffect(() => {
    if (!hovered) return undefined;
    document.body.style.cursor = dragged ? 'grabbing' : 'grab';
    return () => void (document.body.style.cursor = 'auto');
  }, [hovered, dragged]);

  useFrame(state => {
    const { vec, dir, tan, perp, screen } = tmp;
    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current || !strip.current) return;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      let tx = vec.x - dragged.x;
      let ty = vec.y - dragged.y;
      // Dentro de lo que da la cuerda…
      const dx = tx - layout.x;
      const dy = ty - layout.anchorY;
      const d = Math.hypot(dx, dy);
      if (d > layout.reach) {
        tx = layout.x + (dx / d) * layout.reach;
        ty = layout.anchorY + (dy / d) * layout.reach;
      }
      // …y dentro del lienzo.
      tx = THREE.MathUtils.clamp(tx, -layout.viewW + half.x, layout.viewW - half.x);
      ty = THREE.MathUtils.clamp(ty, -layout.viewH + half.y, layout.viewH - half.y);
      [card, j1, j2, j3].forEach(ref => ref.current.wakeUp());
      card.current.setNextKinematicTranslation({ x: tx, y: ty, z: 0 });
    } else {
      // Al soltarla, como mucho MAX_SPEED (la cruz y cada eslabón): se
      // balancea, no sale despedida.
      for (const ref of [card, j1, j2, j3]) {
        const v = ref.current.linvel();
        const speed = Math.hypot(v.x, v.y, v.z);
        if (speed > MAX_SPEED) {
          const k = MAX_SPEED / speed;
          ref.current.setLinvel({ x: v.x * k, y: v.y * k, z: 0 }, true);
        }
      }
    }

    // Red de seguridad: si la simulación diverge, vuelve a colgar en reposo.
    const c = card.current.translation();
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y) || Math.abs(c.x) > layout.viewW * 3 || Math.abs(c.y) > layout.viewH * 3) {
      if (dragged) drag(false);
      resetPose.current();
      return;
    }

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(j2.current.translation());
    curve.points[2].copy(j1.current.translation());
    curve.points[3].copy(fixed.current.translation());

    // Cinta que sigue la cuerda (de la cruz hacia el ancla).
    const pts = curve.getPoints(seg);
    const arr = strip.current.geometry.attributes.position.array;
    for (let r = 0; r <= seg; r++) {
      const s = seg - r; // fila 0 = ancla (arriba)
      const p = pts[s];
      tan.copy(pts[Math.min(seg, s + 1)]).sub(pts[Math.max(0, s - 1)]);
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

    // Caja de la cruz en pantalla (px del lienzo): para el toque en móvil, la
    // QA y la depuración.
    tmp.frame += 1;
    if (wrapper.current && tmp.frame % 6 === 0) {
      const c = card.current.translation();
      screen.set(c.x, c.y, c.z).project(state.camera);
      const x = ((screen.x + 1) / 2) * size.width;
      const y = ((1 - screen.y) / 2) * size.height;
      screen.set(c.x + half.x, c.y + half.y, c.z).project(state.camera);
      const hw = Math.abs(((screen.x + 1) / 2) * size.width - x) + 12;
      const hh = Math.abs(((1 - screen.y) / 2) * size.height - y) + 12;
      hit.current = { x, y, hw, hh };
      wrapper.current.dataset.cross = `${Math.round(x)},${Math.round(y)}`;
    }
  });

  const link = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 6, linearDamping: 3, enabledTranslations: [true, true, false] };

  return (
    <>
      {/* Todo arranca en vertical, ya colgando: sin caída al cargar. */}
      <group>
        <RigidBody ref={fixed} {...link} type="fixed" position={[layout.x, layout.anchorY, 0]} />
        <RigidBody position={[layout.x, layout.anchorY - segLen, 0]} ref={j1} {...link}>
          <BallCollider args={[0.1]} collisionGroups={NO_COLLISIONS} />
        </RigidBody>
        <RigidBody position={[layout.x, layout.anchorY - segLen * 2, 0]} ref={j2} {...link}>
          <BallCollider args={[0.1]} collisionGroups={NO_COLLISIONS} />
        </RigidBody>
        <RigidBody position={[layout.x, layout.anchorY - segLen * 3, 0]} ref={j3} {...link}>
          <BallCollider args={[0.1]} collisionGroups={NO_COLLISIONS} />
        </RigidBody>
        <RigidBody
          position={[layout.x, layout.anchorY - segLen * 3 - half.y, 0]}
          ref={card}
          {...link}
          linearDamping={1.5}
          angularDamping={4}
          enabledRotations={[false, false, true]}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[half.x, half.y, half.z]} collisionGroups={NO_COLLISIONS} />
          <mesh
            geometry={geometry}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={e => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(tmp.vec.copy(card.current.translation())))
            )}
          >
            {isMobile ? (
              <meshStandardMaterial color="#ffffff" roughness={0.45} metalness={0.05} />
            ) : (
              <meshPhysicalMaterial color="#ffffff" roughness={0.4} metalness={0.05} clearcoat={0.6} />
            )}
          </mesh>
        </RigidBody>
      </group>

      <mesh ref={strip} geometry={stripGeometry} frustumCulled={false} renderOrder={5}>
        <meshBasicMaterial color="#f4f4f5" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </>
  );
}

export default CrossLanyard;
