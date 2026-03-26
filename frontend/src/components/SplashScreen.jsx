import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const WORDS = [
  "overthinking", "stress", "trauma", "loneliness",
  "anxiety", "fear", "doubt", "emptiness",
  "burnout", "grief", "anger", "numbness",
  "what if", "not enough", "3am thoughts", "silence",
];

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic  = (t) => t * t * t;
const easeInOutCubic = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const lerp = (a, b, t) => a + (b - a) * t;

// Word texture — clean, bright, glowing
const makeWordTexture = (text) => {
  const W = 512, H = 100;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
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

  // glow pass 1
  ctx.shadowColor = col.shadow;
  ctx.shadowBlur = 20;
  ctx.fillStyle = col.shadow;
  ctx.globalAlpha = 0.5;
  ctx.fillText(text, W / 2, H / 2);

  // glow pass 2
  ctx.shadowBlur = 10;
  ctx.globalAlpha = 0.8;
  ctx.fillText(text, W / 2, H / 2);

  // crisp text
  ctx.shadowBlur = 4;
  ctx.globalAlpha = 1;
  ctx.fillStyle = col.text;
  ctx.fillText(text, W / 2, H / 2);

  return new THREE.CanvasTexture(c);
};

// Radial glow sprite texture
const makeGlowTexture = (size = 256) => {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   "rgba(139, 92, 246, 0.5)");
  g.addColorStop(0.4, "rgba(109, 40, 217, 0.2)");
  g.addColorStop(1,   "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
};

export default function SplashScreen({ onComplete }) {
  const mountRef = useRef(null);
  const [phase, setPhase]           = useState("animating");
  const [msgOpacity, setMsgOpacity] = useState(0);
  const [msgY, setMsgY]             = useState(40);
  const [cvOpacity, setCvOpacity]   = useState(1);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05010f, 1);
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 10);
    camera.lookAt(0, -0.3, 0);

    // subtle fog — NOT too dense so bin stays visible
    scene.fog = new THREE.Fog(0x05010f, 15, 40);

    // ── Background stars ──────────────────────────────────────
    const starCount = 500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 60;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.03, transparent: true, opacity: 0.4, sizeAttenuation: true,
    })));

    // ── Glow halo under bin ───────────────────────────────────
    const glowTex = makeGlowTexture(512);
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, opacity: 0.8,
      depthWrite: false,
    }));
    glowSprite.scale.set(6, 6, 1);
    glowSprite.position.set(0, -0.6, -0.5);
    scene.add(glowSprite);

    // ── MESH BIN ──────────────────────────────────────────────
    // KEY FIX: NO AdditiveBlending on bin lines — use normal blending
    // with bright, fully saturated colors so they're visible on dark bg

    const binGroup = new THREE.Group();
    scene.add(binGroup);

    const BIN_H  = 3.0;
    const R_TOP  = 1.5;
    const R_BOT  = 0.9;
    const RINGS  = 12;
    const SEG    = 64;

    // Helper: ring line with NORMAL blending
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
        // NO AdditiveBlending — this was making everything black
      });
      return new THREE.Line(geo, mat);
    };

    // Helper: strut/diagonal line
    const makeLine = (pts, color, opacity) => {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Line(geo, mat);
    };

    // Horizontal rings — bright purple, graduated top to bottom
    const ringLines = [];
    for (let i = 0; i <= RINGS; i++) {
      const t  = i / RINGS;
      const y  = -BIN_H / 2 + t * BIN_H;
      const r  = R_BOT + (R_TOP - R_BOT) * t;
      // top rings brightest, bottom slightly dimmer
      const op = 0.45 + t * 0.5;
      const lightness = 0.35 + t * 0.25;
      const col = new THREE.Color().setHSL(0.76, 1.0, lightness);
      const ring = makeRing(y, r, col, op);
      binGroup.add(ring);
      ringLines.push({ line: ring, t });
    }

    // Bright rim at top — this is the "opening" of the bin
    const rimLine = makeRing(BIN_H / 2, R_TOP, 0xd8b4fe, 1.0, 128);
    binGroup.add(rimLine);
    // Second rim slightly larger for glow feel
    const rimLine2 = makeRing(BIN_H / 2, R_TOP * 1.008, 0xa855f7, 0.5, 128);
    binGroup.add(rimLine2);

    // Vertical struts — 18 of them, medium brightness
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

    // Diagonal cross-hatch — two directions, creates the mesh weave
    const DIAG = 16;
    for (let d = 0; d < 2; d++) {
      for (let i = 0; i < DIAG; i++) {
        const pts = [];
        for (let j = 0; j <= 40; j++) {
          const t     = j / 40;
          const y     = -BIN_H / 2 + t * BIN_H;
          const r     = R_BOT + (R_TOP - R_BOT) * t;
          const twist = d === 0 ? t * 2.5 : -t * 2.5;
          const a     = (i / DIAG) * Math.PI * 2 + twist;
          pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
        }
        binGroup.add(makeLine(pts, 0x7c3aed, 0.4));
      }
    }

    // Dark inner surface — gives the bin visual depth
    const innerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(R_TOP * 0.97, R_BOT * 0.97, BIN_H * 0.99, 48, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x08020f,
        side: THREE.BackSide,
        transparent: false,
      })
    );
    binGroup.add(innerMesh);

    // Base disc
    const baseMesh = new THREE.Mesh(
      new THREE.CircleGeometry(R_BOT * 0.96, 48),
      new THREE.MeshBasicMaterial({ color: 0x06010d })
    );
    baseMesh.rotation.x = -Math.PI / 2;
    baseMesh.position.y = -BIN_H / 2 + 0.01;
    binGroup.add(baseMesh);

    // Start bin off-screen, scale 0 — entrance animation
    binGroup.position.set(0, -5, 0);
    binGroup.scale.setScalar(0.01);

    // ── Vortex ring particles at rim ──────────────────────────
    const VC = 70;
    const vPos    = new Float32Array(VC * 3);
    const vAngles = new Float32Array(VC);
    const vRadii  = new Float32Array(VC);
    const vSpeeds = new Float32Array(VC);
    for (let i = 0; i < VC; i++) {
      vAngles[i] = Math.random() * Math.PI * 2;
      vRadii[i]  = R_TOP * (0.4 + Math.random() * 0.9);
      vSpeeds[i] = 0.3 + Math.random() * 0.8;
    }
    const vGeo = new THREE.BufferGeometry();
    vGeo.setAttribute("position", new THREE.BufferAttribute(vPos, 3));
    const vMat = new THREE.PointsMaterial({
      color: 0xc084fc, size: 0.05, transparent: true, opacity: 0.8, sizeAttenuation: true,
    });
    scene.add(new THREE.Points(vGeo, vMat));

    // ── Words ─────────────────────────────────────────────────
    const wordPool  = [];
    let wordTimer   = 0;
    let wordIndex   = 0;
    let absorbed    = 0;
    const TARGET    = 14;
    let allSpawned  = false;

    const spawnWord = () => {
      if (wordIndex >= WORDS.length) { allSpawned = true; return; }
      const text    = WORDS[wordIndex++];
      const tex     = makeWordTexture(text);
      const mat     = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false,
      });
      const sprite  = new THREE.Sprite(mat);
      const scale   = 0.75 + Math.random() * 0.35;
      sprite.scale.set((512 / 100) * scale, scale, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 1.8,
        7 + Math.random() * 2,
        (Math.random() - 0.5) * 0.3
      );
      sprite.userData = {
        vel:        new THREE.Vector3(
                      (Math.random() - 0.5) * 0.15,
                      -(1.2 + Math.random() * 0.7),
                      0
                    ),
        driftPhase: Math.random() * Math.PI * 2,
        driftFreq:  0.3 + Math.random() * 0.3,
        driftAmp:   0.03 + Math.random() * 0.04,
        phase:      "falling",
        opacity:    0,
        targetOp:   0.85 + Math.random() * 0.15,
        scale,
        sucT:       0,
        sucStart:   new THREE.Vector3(),
      };
      scene.add(sprite);
      wordPool.push(sprite);
    };

    // ── State vars ────────────────────────────────────────────
    let rimFlash   = 0;
    let glowFlash  = 0;
    let binEntT    = 0;  // bin entrance progress 0→1
    let camDollyT  = 0;  // camera dolly 0→1
    const clock    = new THREE.Clock();
    let finished   = false;
    let rafId;

    // ── Animate ───────────────────────────────────────────────
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (finished) return;

      const dt      = Math.min(clock.getDelta(), 0.05); // cap dt so no jumps
      const elapsed = clock.elapsedTime;

      // Camera dolly in (z: 10 → 8 over ~5s, ease out)
      if (camDollyT < 1) {
        camDollyT = Math.min(1, camDollyT + dt * 0.2);
        camera.position.z = lerp(10, 8, easeOutCubic(camDollyT));
      }
      // Subtle breathe
      camera.position.y = 0.5 + Math.sin(elapsed * 0.25) * 0.06;

      // Bin entrance — rises up + scales in
      if (binEntT < 1) {
        binEntT = Math.min(1, binEntT + dt * 0.7);
        const s = easeOutCubic(binEntT);
        binGroup.scale.setScalar(s);
        binGroup.position.y = lerp(-5, -0.6, easeOutCubic(binEntT));
      }

      // Bin idle: float + slow Y rotation
      const floatY = -0.6 + Math.sin(elapsed * 0.55) * 0.12;
      if (binEntT >= 1) binGroup.position.y = floatY;
      binGroup.rotation.y += dt * 0.10;
      const binY = binGroup.position.y;

      // Glow halo follows bin
      glowSprite.position.y = binY;
      glowSprite.material.opacity = 0.6 + Math.sin(elapsed * 1.2) * 0.15 + glowFlash * 0.4;
      glowFlash = Math.max(0, glowFlash - dt * 1.5);

      // Rim pulse + flash
      rimLine.material.opacity = Math.min(1, 0.6 + Math.sin(elapsed * 1.8) * 0.28 + rimFlash);
      rimLine2.material.opacity = Math.min(0.7, 0.28 + rimFlash * 0.5);
      rimFlash = Math.max(0, rimFlash - dt * 2.2);

      // Vortex ring spin
      const vp = vGeo.attributes.position.array;
      for (let i = 0; i < VC; i++) {
        vAngles[i] += dt * vSpeeds[i] * (1.0 + rimFlash * 3.0);
        vRadii[i]  -= dt * 0.018;
        if (vRadii[i] < 0.05) vRadii[i] = R_TOP * (0.5 + Math.random() * 0.8);
        vp[i * 3]     = Math.cos(vAngles[i]) * vRadii[i];
        vp[i * 3 + 2] = Math.sin(vAngles[i]) * vRadii[i];
        vp[i * 3 + 1] = binY + BIN_H / 2 - 0.05 + Math.sin(vAngles[i] * 3 + elapsed) * 0.05;
      }
      vGeo.attributes.position.needsUpdate = true;

      // ── Spawn words ───────────────────────────────────────────
      wordTimer += dt;
      const spawnInterval = Math.max(0.35, 0.7 - absorbed * 0.025);
      if (!allSpawned && wordTimer >= spawnInterval && binEntT > 0.5 && wordPool.length < 10) {
        spawnWord();
        wordTimer = 0;
      }

      // ── Update words ──────────────────────────────────────────
      const binCenter = new THREE.Vector3(0, binY, 0);
      const rimY      = binY + BIN_H / 2;

      for (let i = wordPool.length - 1; i >= 0; i--) {
        const w  = wordPool[i];
        const ud = w.userData;

        if (ud.phase === "falling") {
          // Smooth fade in
          ud.opacity = Math.min(ud.targetOp, ud.opacity + dt * 0.9);
          w.material.opacity = ud.opacity;

          // Physics: apply velocity * dt for frame-rate independence
          // Horizontal sine drift (smooth oscillation)
          ud.driftPhase += dt * ud.driftFreq * Math.PI * 2;
          const sineX = Math.sin(ud.driftPhase) * ud.driftAmp;

          w.position.x += (ud.vel.x + sineX) * dt;
          w.position.y += ud.vel.y * dt;

          // Gravity vortex pull — proportional to proximity, eased
          const toCenter = new THREE.Vector3().subVectors(binCenter, w.position);
          const dist     = toCenter.length();
          const influence = Math.max(0, 1.0 - dist / 7.0);
          const pullMag   = easeInCubic(influence) * 3.5; // stronger pull — words can't escape
          toCenter.normalize();

          ud.vel.x += toCenter.x * pullMag * dt;
          ud.vel.y += toCenter.y * pullMag * dt * 0.6;

          // Hard clamp horizontal velocity so words never drift too far sideways
          ud.vel.x = Math.max(-1.2, Math.min(1.2, ud.vel.x));
          ud.vel.x *= Math.pow(0.94, dt * 60);

          // Transition to suction — trigger early, wide net
          const lateralDist = Math.sqrt(w.position.x ** 2 + w.position.z ** 2);
          if (w.position.y < rimY + 1.8 && lateralDist < R_TOP * 1.8) {
            ud.phase   = "sucking";
            ud.sucT    = 0;
            ud.sucStart.copy(w.position);
          }

          // Catch-all — if word reaches rim level regardless of x/z, force suction
          if (w.position.y < rimY + 0.1) {
            ud.phase   = "sucking";
            ud.sucT    = 0;
            ud.sucStart.copy(w.position);
          }

          // Safety remove — should never trigger now
          if (w.position.y < binY - BIN_H - 2) {
            scene.remove(w);
            wordPool.splice(i, 1);
            absorbed++;
          }

        } else if (ud.phase === "sucking") {
          // Smooth bezier arc into bin — feels like being inhaled
          ud.sucT = Math.min(1, ud.sucT + dt * 2.2);
          const t = easeInOutCubic(ud.sucT);
          const q = 1 - t;

          // Control point: pulls through the rim opening
          const cpX = ud.sucStart.x * 0.2;
          const cpY = rimY + 0.1;
          const cpZ = ud.sucStart.z * 0.2;
          const endX = 0, endY = binY - 0.3, endZ = 0;

          w.position.x = q*q*ud.sucStart.x + 2*q*t*cpX + t*t*endX;
          w.position.y = q*q*ud.sucStart.y + 2*q*t*cpY + t*t*endY;
          w.position.z = q*q*ud.sucStart.z + 2*q*t*cpZ + t*t*endZ;

          // Fade + scale down as it gets sucked in
          w.material.opacity = ud.targetOp * (1 - easeInCubic(ud.sucT));
          const sc = lerp(1, 0, easeInCubic(ud.sucT));
          w.scale.set((512 / 100) * ud.scale * sc, ud.scale * sc, 1);

          if (ud.sucT >= 1) {
            scene.remove(w);
            wordPool.splice(i, 1);
            absorbed++;
            rimFlash  = 1.0;
            glowFlash = 1.0;
          }
        }
      }

      // ── Transition after TARGET words absorbed ────────────────
      if (absorbed >= TARGET && !finished) {
        finished = true;
        // Slow cinematic fade out
        let op = 1;
        const fadeOut = setInterval(() => {
          op -= 0.012;
          setCvOpacity(Math.max(0, op));
          if (op <= 0) {
            clearInterval(fadeOut);
            setPhase("message");
            // Fade message in
            let mOp = 0, mY2 = 40;
            const fadeIn = setInterval(() => {
              mOp  = Math.min(1, mOp + 0.018);
              mY2  = Math.max(0, mY2 - 0.9);
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

    // Resize handler
    const onResize = () => {
      const W2 = container.clientWidth, H2 = container.clientHeight;
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

  if (phase === "done") return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#05010f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
      overflow: "hidden",
    }}>
      {/* Three.js canvas */}
      <div
        ref={mountRef}
        style={{
          position: "absolute", inset: 0,
          opacity: cvOpacity,
          transition: "opacity 0.08s linear",
        }}
      />

      {/* Vignette — subtle, doesn't darken center */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 45%, rgba(5,1,15,0.65) 100%)",
      }} />

      {/* Bottom label */}
      {phase === "animating" && (
        <div style={{
          position: "absolute", bottom: 36, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 5, display: "flex", alignItems: "center", gap: 10,
          pointerEvents: "none",
        }}>
          {[0, 0.45, 0.9].map((delay, k) => (
            <div key={k} style={{
              width: 4, height: 4, borderRadius: "50%",
              background: "#7c3aed",
              animation: `dumpDot 1.5s ease-in-out ${delay}s infinite`,
            }} />
          ))}
          <span style={{
            color: "#5b21b6", fontSize: 11,
            letterSpacing: "0.35em", textTransform: "uppercase", fontWeight: 500,
          }}>
            collecting your thoughts
          </span>
          {[0.9, 0.45, 0].map((delay, k) => (
            <div key={k} style={{
              width: 4, height: 4, borderRadius: "50%",
              background: "#7c3aed",
              animation: `dumpDot 1.5s ease-in-out ${delay}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Final message */}
      {phase === "message" && (
        <div style={{
          position: "relative", zIndex: 10,
          textAlign: "center",
          transform: `translateY(${msgY}px)`,
          opacity: msgOpacity,
          padding: "0 32px",
          userSelect: "none",
        }}>
          <div style={{
            fontSize: "clamp(10px, 1.6vw, 13px)",
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            color: "#6d28d9",
            marginBottom: 20,
            fontWeight: 600,
          }}>
            welcome to
          </div>

          <div style={{
            fontSize: "clamp(72px, 16vw, 130px)",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.05em",
            lineHeight: 0.88,
            marginBottom: 28,
            textShadow: [
              "0 0 20px rgba(168,85,247,1)",
              "0 0 50px rgba(139,92,246,0.7)",
              "0 0 100px rgba(109,40,217,0.35)",
            ].join(", "),
          }}>
            DUMP
          </div>

          <div style={{
            width: 40, height: 1, margin: "0 auto 28px",
            background: "linear-gradient(90deg, transparent, #7c3aed, transparent)",
          }} />

          <div style={{
            fontSize: "clamp(14px, 2.8vw, 18px)",
            color: "#c4b5fd",
            fontWeight: 300,
            letterSpacing: "0.07em",
            lineHeight: 1.9,
          }}>
            dump your thoughts.<br />
            <span style={{ color: "#5b21b6", fontSize: "0.82em", letterSpacing: "0.18em" }}>
              no judgment. ever.
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dumpDot {
          0%, 100% { opacity: 0.2; transform: scale(1) translateY(0px); }
          50%       { opacity: 1;   transform: scale(1.7) translateY(-2px); }
        }
      `}</style>
    </div>
  );
}