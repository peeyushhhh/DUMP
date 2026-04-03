import { useEffect, useRef } from "react";
import * as THREE from "three";

const WORDS = [
  "overthinking", "stress", "trauma", "loneliness",
  "anxiety", "fear", "doubt", "emptiness",
  "burnout", "grief", "anger", "numbness",
  "what if", "not enough", "3am thoughts", "silence",
];

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t) => t * t * t;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

const makeWordTexture = (text) => {
  const W = 512;
  const H = 100;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const colors = [
    { text: "#ffffff", shadow: "#a855f7" },
    { text: "#e9d5ff", shadow: "#7c3aed" },
    { text: "#f5f3ff", shadow: "#c084fc" },
    { text: "#fdf4ff", shadow: "#9333ea" },
    { text: "#ede9fe", shadow: "#8b5cf6" },
  ];
  const col = colors[Math.floor(Math.random() * colors.length)];
  const fontSize = 28 + Math.floor(Math.random() * 10);

  ctx.font = `400 ${fontSize}px 'Space Grotesk', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = col.shadow;
  ctx.shadowBlur = 20;
  ctx.fillStyle = col.shadow;
  ctx.globalAlpha = 0.5;
  ctx.fillText(text, W / 2, H / 2);

  ctx.shadowBlur = 10;
  ctx.globalAlpha = 0.8;
  ctx.fillText(text, W / 2, H / 2);

  ctx.shadowBlur = 4;
  ctx.globalAlpha = 1;
  ctx.fillStyle = col.text;
  ctx.fillText(text, W / 2, H / 2);

  return new THREE.CanvasTexture(c);
};

const makeGlowTexture = (size = 256) => {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(139, 92, 246, 0.5)");
  g.addColorStop(0.4, "rgba(109, 40, 217, 0.2)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
};

/**
 * Three.js / WebGL splash animation (bin + words). Drives phase transitions via setters.
 */
export default function SplashCanvas({
  cvOpacity,
  setCvOpacity,
  setPhase,
  setMsgOpacity,
  setMsgY,
  onComplete,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05010f, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 10);
    camera.lookAt(0, -0.3, 0);

    scene.fog = new THREE.Fog(0x05010f, 15, 40);

    const starCount = 500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 60;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.03, transparent: true, opacity: 0.4, sizeAttenuation: true,
    })));

    const glowTex = makeGlowTexture(512);
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.8,
      depthWrite: false,
    }));
    glowSprite.scale.set(6, 6, 1);
    glowSprite.position.set(0, -0.6, -0.5);
    scene.add(glowSprite);

    const binGroup = new THREE.Group();
    scene.add(binGroup);

    const BIN_H = 3.0;
    const R_TOP = 1.5;
    const R_BOT = 0.9;
    const RINGS = 12;
    const SEG = 64;

    const makeRing = (y, r, color, opacity, segments = SEG) => {
      const pts = [];
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
      });
      return new THREE.Line(geo, mat);
    };

    const makeLine = (pts, color, opacity) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Line(geo, mat);
    };

    for (let i = 0; i <= RINGS; i++) {
      const t = i / RINGS;
      const y = -BIN_H / 2 + t * BIN_H;
      const r = R_BOT + (R_TOP - R_BOT) * t;
      const op = 0.45 + t * 0.5;
      const lightness = 0.35 + t * 0.25;
      const col = new THREE.Color().setHSL(0.76, 1.0, lightness);
      const ring = makeRing(y, r, col, op);
      binGroup.add(ring);
    }

    const rimLine = makeRing(BIN_H / 2, R_TOP, 0xd8b4fe, 1.0, 128);
    binGroup.add(rimLine);
    const rimLine2 = makeRing(BIN_H / 2, R_TOP * 1.008, 0xa855f7, 0.5, 128);
    binGroup.add(rimLine2);

    const STRUTS = 18;
    for (let i = 0; i < STRUTS; i++) {
      const a = (i / STRUTS) * Math.PI * 2;
      const pts = [];
      for (let j = 0; j <= 30; j++) {
        const t = j / 30;
        const y = -BIN_H / 2 + t * BIN_H;
        const r = R_BOT + (R_TOP - R_BOT) * t;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      }
      binGroup.add(makeLine(pts, 0x8b5cf6, 0.55));
    }

    const DIAG = 16;
    for (let d = 0; d < 2; d++) {
      for (let i = 0; i < DIAG; i++) {
        const pts = [];
        for (let j = 0; j <= 40; j++) {
          const t = j / 40;
          const y = -BIN_H / 2 + t * BIN_H;
          const r = R_BOT + (R_TOP - R_BOT) * t;
          const twist = d === 0 ? t * 2.5 : -t * 2.5;
          const a = (i / DIAG) * Math.PI * 2 + twist;
          pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
        }
        binGroup.add(makeLine(pts, 0x7c3aed, 0.4));
      }
    }

    const innerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(R_TOP * 0.97, R_BOT * 0.97, BIN_H * 0.99, 48, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x08020f,
        side: THREE.BackSide,
        transparent: false,
      })
    );
    binGroup.add(innerMesh);

    const baseMesh = new THREE.Mesh(
      new THREE.CircleGeometry(R_BOT * 0.96, 48),
      new THREE.MeshBasicMaterial({ color: 0x06010d })
    );
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = -BIN_H / 2 + 0.01;
    binGroup.add(baseMesh);

    binGroup.position.set(0, -5, 0);
    binGroup.scale.setScalar(0.01);

    const VC = 70;
    const vPos = new Float32Array(VC * 3);
    const vAngles = new Float32Array(VC);
    const vRadii = new Float32Array(VC);
    const vSpeeds = new Float32Array(VC);
    for (let i = 0; i < VC; i++) {
      vAngles[i] = Math.random() * Math.PI * 2;
      vRadii[i] = R_TOP * (0.4 + Math.random() * 0.9);
      vSpeeds[i] = 0.3 + Math.random() * 0.8;
    }
    const vGeo = new THREE.BufferGeometry();
    vGeo.setAttribute("position", new THREE.BufferAttribute(vPos, 3));
    const vMat = new THREE.PointsMaterial({
      color: 0xc084fc, size: 0.05, transparent: true, opacity: 0.8, sizeAttenuation: true,
    });
    scene.add(new THREE.Points(vGeo, vMat));

    const wordPool = [];
    let wordTimer = 0;
    let wordIndex = 0;
    let absorbed = 0;
    const TARGET = 14;
    let allSpawned = false;

    const spawnWord = () => {
      if (wordIndex >= WORDS.length) { allSpawned = true; return; }
      const text = WORDS[wordIndex++];
      const tex = makeWordTexture(text);
      const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      const scale = 0.75 + Math.random() * 0.35;
      sprite.scale.set((512 / 100) * scale, scale, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 1.8,
        7 + Math.random() * 2,
        (Math.random() - 0.5) * 0.3
      );
      sprite.userData = {
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          -(1.2 + Math.random() * 0.7),
          0
        ),
        driftPhase: Math.random() * Math.PI * 2,
        driftFreq: 0.3 + Math.random() * 0.3,
        driftAmp: 0.03 + Math.random() * 0.04,
        phase: "falling",
        opacity: 0,
        targetOp: 0.85 + Math.random() * 0.15,
        scale,
        sucT: 0,
        sucStart: new THREE.Vector3(),
      };
      scene.add(sprite);
      wordPool.push(sprite);
    };

    let rimFlash = 0;
    let glowFlash = 0;
    let binEntT = 0;
    let camDollyT = 0;
    const clock = new THREE.Clock();
    let finished = false;
    let rafId;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (finished) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      if (camDollyT < 1) {
        camDollyT = Math.min(1, camDollyT + dt * 0.2);
        camera.position.z = lerp(10, 8, easeOutCubic(camDollyT));
      }
      camera.position.y = 0.5 + Math.sin(elapsed * 0.25) * 0.06;

      if (binEntT < 1) {
        binEntT = Math.min(1, binEntT + dt * 0.7);
        const s = easeOutCubic(binEntT);
        binGroup.scale.setScalar(s);
        binGroup.position.y = lerp(-5, -0.6, easeOutCubic(binEntT));
      }

      const floatY = -0.6 + Math.sin(elapsed * 0.55) * 0.12;
      if (binEntT >= 1) binGroup.position.y = floatY;
      binGroup.rotation.y += dt * 0.10;
      const binY = binGroup.position.y;

      glowSprite.position.y = binY;
      glowSprite.material.opacity = 0.6 + Math.sin(elapsed * 1.2) * 0.15 + glowFlash * 0.4;
      glowFlash = Math.max(0, glowFlash - dt * 1.5);

      rimLine.material.opacity = Math.min(1, 0.6 + Math.sin(elapsed * 1.8) * 0.28 + rimFlash);
      rimLine2.material.opacity = Math.min(0.7, 0.28 + rimFlash * 0.5);
      rimFlash = Math.max(0, rimFlash - dt * 2.2);

      const vp = vGeo.attributes.position.array;
      for (let i = 0; i < VC; i++) {
        vAngles[i] += dt * vSpeeds[i] * (1.0 + rimFlash * 3.0);
        vRadii[i] -= dt * 0.018;
        if (vRadii[i] < 0.05) vRadii[i] = R_TOP * (0.5 + Math.random() * 0.8);
        vp[i * 3] = Math.cos(vAngles[i]) * vRadii[i];
        vp[i * 3 + 2] = Math.sin(vAngles[i]) * vRadii[i];
        vp[i * 3 + 1] = binY + BIN_H / 2 - 0.05 + Math.sin(vAngles[i] * 3 + elapsed) * 0.05;
      }
      vGeo.attributes.position.needsUpdate = true;

      wordTimer += dt;
      const spawnInterval = Math.max(0.35, 0.7 - absorbed * 0.025);
      if (!allSpawned && wordTimer >= spawnInterval && binEntT > 0.5 && wordPool.length < 10) {
        spawnWord();
        wordTimer = 0;
      }

      const binCenter = new THREE.Vector3(0, binY, 0);
      const rimY = binY + BIN_H / 2;

      for (let i = wordPool.length - 1; i >= 0; i--) {
        const w = wordPool[i];
        const ud = w.userData;

        if (ud.phase === "falling") {
          ud.opacity = Math.min(ud.targetOp, ud.opacity + dt * 0.9);
          w.material.opacity = ud.opacity;

          ud.driftPhase += dt * ud.driftFreq * Math.PI * 2;
          const sineX = Math.sin(ud.driftPhase) * ud.driftAmp;

          w.position.x += (ud.vel.x + sineX) * dt;
          w.position.y += ud.vel.y * dt;

          const toCenter = new THREE.Vector3().subVectors(binCenter, w.position);
          const dist = toCenter.length();
          const influence = Math.max(0, 1.0 - dist / 7.0);
          const pullMag = easeInCubic(influence) * 3.5;
          toCenter.normalize();

          ud.vel.x += toCenter.x * pullMag * dt;
          ud.vel.y += toCenter.y * pullMag * dt * 0.6;

          ud.vel.x = Math.max(-1.2, Math.min(1.2, ud.vel.x));
          ud.vel.x *= Math.pow(0.94, dt * 60);

          const lateralDist = Math.sqrt(w.position.x ** 2 + w.position.z ** 2);
          if (w.position.y < rimY + 1.8 && lateralDist < R_TOP * 1.8) {
            ud.phase = "sucking";
            ud.sucT = 0;
            ud.sucStart.copy(w.position);
          }

          if (w.position.y < rimY + 0.1) {
            ud.phase = "sucking";
            ud.sucT = 0;
            ud.sucStart.copy(w.position);
          }

          if (w.position.y < binY - BIN_H - 2) {
            scene.remove(w);
            wordPool.splice(i, 1);
            absorbed++;
          }
        } else if (ud.phase === "sucking") {
          ud.sucT = Math.min(1, ud.sucT + dt * 2.2);
          const t = easeInOutCubic(ud.sucT);
          const q = 1 - t;

          const cpX = ud.sucStart.x * 0.2;
          const cpY = rimY + 0.1;
          const cpZ = ud.sucStart.z * 0.2;
          const endX = 0;
          const endY = binY - 0.3;
          const endZ = 0;

          w.position.x = q * q * ud.sucStart.x + 2 * q * t * cpX + t * t * endX;
          w.position.y = q * q * ud.sucStart.y + 2 * q * t * cpY + t * t * endY;
          w.position.z = q * q * ud.sucStart.z + 2 * q * t * cpZ + t * t * endZ;

          w.material.opacity = ud.targetOp * (1 - easeInCubic(ud.sucT));
          const sc = lerp(1, 0, easeInCubic(ud.sucT));
          w.scale.set((512 / 100) * ud.scale * sc, ud.scale * sc, 1);

          if (ud.sucT >= 1) {
            scene.remove(w);
            wordPool.splice(i, 1);
            absorbed++;
            rimFlash = 1.0;
            glowFlash = 1.0;
          }
        }
      }

      if (absorbed >= TARGET && !finished) {
        finished = true;
        let op = 1;
        const fadeOut = setInterval(() => {
          op -= 0.012;
          setCvOpacity(Math.max(0, op));
          if (op <= 0) {
            clearInterval(fadeOut);
            setPhase("message");
            let mOp = 0;
            let mY2 = 40;
            const fadeIn = setInterval(() => {
              mOp = Math.min(1, mOp + 0.018);
              mY2 = Math.max(0, mY2 - 0.9);
              setMsgOpacity(mOp);
              setMsgY(mY2);
              if (mOp >= 1) {
                clearInterval(fadeIn);
                setTimeout(() => {
                  setPhase("done");
                  onComplete?.();
                }, 2800);
              }
            }, 16);
          }
        }, 16);
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W2 = container.clientWidth;
      const H2 = container.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      finished = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        inset: 0,
        opacity: cvOpacity,
        transition: "opacity 0.08s linear",
      }}
    />
  );
}
