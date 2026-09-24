"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
import "./HeroScene.css";

const SPARK_COUNT = 200;
const NAV_TARGET_SCROLLS = [0.0, 0.34, 0.62, 0.94];

interface SparkDatum {
  speedX: number;
  speedY: number;
  speedZ: number;
  swaySpeed: number;
  swayRadius: number;
  phase: number;
}

interface HeroShape {
  group: THREE.Group;
  material: THREE.MeshStandardMaterial;
  center: number;
}

export default function HeroScene() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorInnerRef = useRef<HTMLDivElement>(null);
  const cursorOuterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroEl = sectionRef.current;
    const canvas = canvasRef.current;
    if (!heroEl || !canvas) return;

    // ---------------------------------------------------------------------
    // Mutable scene state (module-scope in the original static build, now
    // scoped to this effect instance so a remount gets a clean slate).
    // ---------------------------------------------------------------------
    let modelPivot: THREE.Group | null = null; // pivot group for perfect center-rotation, shared by all four shapes
    let heroShapes: HeroShape[] = []; // the four equipment shapes, crossfaded by scroll position
    const clock = new THREE.Clock();

    // Matches the shader's own warm (scroll=0) / cool (scroll=1) extremes so
    // every shape's material and the background stay in sync as the user
    // scrolls (see c0_crest / c1_crest in createBackgroundShader).
    const colorWarm = new THREE.Color(0.45, 0.3, 0.18);
    const colorCool = new THREE.Color(0.32, 0.31, 0.3);

    let currentScroll = 0; // smoothed accumulated scroll for lerping
    let mouseX = 0,
      mouseY = 0,
      targetMouseX = 0,
      targetMouseY = 0;
    let cursorX = window.innerWidth / 2,
      cursorY = window.innerHeight / 2;
    let outerCursorX = window.innerWidth / 2,
      outerCursorY = window.innerHeight / 2;

    let bgMaterial: THREE.ShaderMaterial;
    const shaderUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
    };

    let sparkParticles: THREE.Points | null = null;
    const sparkData: SparkDatum[] = [];

    const sizes = { width: window.innerWidth, height: window.innerHeight };

    // -----------------------------------------------------------------
    // Hero-relative scroll progress: the original page WAS the 900vh
    // scroll surface, so scrollTop / (docHeight - viewportHeight) gave
    // 0→1 across the whole document. Here the hero is one 900vh section
    // followed by normal page content, so progress is measured against
    // the hero section's own scrollable range instead of the document's.
    // -----------------------------------------------------------------
    function getHeroScrollProgress() {
      const rect = heroEl!.getBoundingClientRect();
      const heroTop = window.scrollY + rect.top;
      const scrollableDistance = heroEl!.offsetHeight - window.innerHeight;
      if (scrollableDistance <= 0) return 0;
      const progress = (window.scrollY - heroTop) / scrollableDistance;
      return Math.min(1, Math.max(0, progress));
    }

    function createBackgroundShader() {
      const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      const fragmentShader = `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform float uScroll;
        // 3D Noise function for organic warping (high performance hash-based noise)
        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        float noise(in vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f*f*(3.0-2.0*f);
            float n = p.x + p.y*57.0 + 113.0*p.z;
            return mix(mix(mix(hash(n+  0.0), hash(n+  1.0), f.x),
                           mix(hash(n+ 57.0), hash(n+ 58.0), f.x), f.y),
                       mix(mix(hash(n+113.0), hash(n+114.0), f.x),
                           mix(hash(n+170.0), hash(n+171.0), f.x), f.y), f.z);
        }
        void main() {
            // Normalize UV coordinates
            vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
            float aspect = uResolution.x / uResolution.y;

            float time = uTime * 0.08; // Extremely slow, calm breathing speed
            float scroll = uScroll;

            // --- 1. Constant Wave Parameters (Perfect Scroll Stability) ---
            float angle1 = 0.6;
            float angle2 = -0.7;
            float angle3 = 1.2;

            float freq1 = 2.4;
            float freq2 = 3.2;
            float freq3 = 4.0;

            // --- 2. Coordinates Distortion (Smooth Rounded Arcs & Scroll Deformation) ---
            vec2 warpedUv = uv;

            float scrollDeform = scroll * 5.0;

            warpedUv.x += sin(uv.y * 2.5 + time * 0.2 + scrollDeform) * 0.35;
            warpedUv.y += cos(uv.x * 2.5 - time * 0.15 - scrollDeform * 0.8) * 0.35;

            warpedUv.x += sin(uv.y * 1.2 - time * 0.1 - scrollDeform * 1.5) * 0.25;
            warpedUv.y += cos(uv.x * 1.2 + time * 0.18 + scrollDeform * 1.2) * 0.25;

            vec2 scrollDrift = vec2(scroll * 0.04, -scroll * 0.02);
            vec2 mouseShift = vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);
            warpedUv += scrollDrift + mouseShift;

            // --- 3. Layered Wave Computations ---
            vec2 dir1 = vec2(cos(angle1), sin(angle1));
            vec2 dir2 = vec2(cos(angle2), sin(angle2));
            vec2 dir3 = vec2(cos(angle3), sin(angle3));

            float w1 = sin(dot(warpedUv, dir1) * freq1 + time * 1.0);
            float w2 = cos(dot(warpedUv, dir2) * freq2 - time * 1.4 + w1 * 0.4);
            float w3 = sin(dot(warpedUv, dir3) * freq3 + time * 1.8 + w2 * 0.5);

            float waveField = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;

            // --- 4. Crisp Metallic Lustre ---
            float wideSheen = pow(max(0.0, 1.0 - abs(waveField - 0.1)), 2.5);
            float crispSpecular = pow(max(0.0, 1.0 - abs(waveField - 0.15)), 8.0);
            float crest = wideSheen * 0.5 + crispSpecular * 0.9;

            // --- 5. Scroll-Driven Color Palettes: Molten Iron to Steel Blue ---
            // Top Palette (Scroll = 0.0): Rich Molten Iron
            vec3 c0_shadow = vec3(0.0010, 0.0006, 0.0004);
            vec3 c0_wave1  = vec3(0.085, 0.040, 0.015);
            vec3 c0_wave2  = vec3(0.050, 0.022, 0.008);
            vec3 c0_crest  = vec3(0.45, 0.30, 0.18);

            // Bottom Palette (Scroll = 1.0): Deep Steel Blue
            vec3 c1_shadow = vec3(0.004, 0.004, 0.005);
            vec3 c1_wave1  = vec3(0.050, 0.050, 0.052);
            vec3 c1_wave2  = vec3(0.030, 0.030, 0.032);
            vec3 c1_crest  = vec3(0.32, 0.31, 0.30);

            float t = smoothstep(0.0, 1.0, scroll);
            vec3 colShadow = mix(c0_shadow, c1_shadow, t);
            vec3 colWave1  = mix(c0_wave1, c1_wave1, t);
            vec3 colWave2  = mix(c0_wave2, c1_wave2, t);
            vec3 colCrest  = mix(c0_crest, c1_crest, t);

            // --- 6. Final Composition ---
            vec3 color = colShadow;
            color = mix(color, colWave2, smoothstep(-0.6, 0.2, waveField));
            color = mix(color, colWave1, smoothstep(0.0, 0.8, waveField));

            color += colCrest * crest * 1.4;

            float vignette = 1.0 - dot(uv, uv) * 0.12;
            color *= vignette;

            gl_FragColor = vec4(color, 1.0);
        }
      `;
      bgMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: shaderUniforms,
        depthWrite: false,
        depthTest: false,
      });
      const bgGeometry = new THREE.PlaneGeometry(30, 30);
      const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
      bgMesh.position.set(0.0, 0.0, -8.0); // local camera space, far behind
      bgMesh.renderOrder = -10;
      camera.add(bgMesh); // attach to camera so it always fills view
    }

    function createSparkTexture() {
      const c = document.createElement("canvas");
      c.width = 16;
      c.height = 16;
      const ctx = c.getContext("2d")!;
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.85)");
      gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.3)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
      return new THREE.CanvasTexture(c);
    }

    function createSparks() {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(SPARK_COUNT * 3);
      const colors = new Float32Array(SPARK_COUNT * 3);
      for (let i = 0; i < SPARK_COUNT; i++) {
        const x = (Math.random() - 0.5) * 6.5;
        const y = (Math.random() - 0.5) * 5.0 - 0.5;
        const z = (Math.random() - 0.5) * 6.5;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        if (Math.random() < 0.6) {
          // saturated fiery orange
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.4 + Math.random() * 0.15;
          colors[i * 3 + 2] = 0.05 + Math.random() * 0.1;
        } else {
          // cosmic icy light-blue (matches rim light)
          colors[i * 3] = 0.55 + Math.random() * 0.15;
          colors[i * 3 + 1] = 0.82 + Math.random() * 0.12;
          colors[i * 3 + 2] = 1.0;
        }
        sparkData.push({
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: 0.15 + Math.random() * 0.3,
          speedZ: (Math.random() - 0.5) * 0.4,
          swaySpeed: 0.5 + Math.random() * 1.5,
          swayRadius: 0.05 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2,
        });
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: 0.025,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: createSparkTexture(),
      });
      sparkParticles = new THREE.Points(geometry, material);
      scene.add(sparkParticles);
    }

    function buildBarbellMesh(material: THREE.MeshStandardMaterial) {
      const group = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 24), material);
      bar.rotation.z = Math.PI / 2;
      group.add(bar);
      [-1.1, 1.1].forEach((x) => {
        const plateGroup = new THREE.Group();
        [0.75, 0.55, 0.4].forEach((r, i) => {
          const disk = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 32), material);
          disk.rotation.z = Math.PI / 2;
          disk.position.x = i * 0.13 * Math.sign(x);
          plateGroup.add(disk);
        });
        plateGroup.position.x = x;
        group.add(plateGroup);
      });
      return group;
    }

    function buildKettlebellMesh(material: THREE.MeshStandardMaterial) {
      const group = new THREE.Group();

      const bell = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), material);
      bell.scale.set(1, 0.88, 1);
      bell.position.y = -0.15;
      group.add(bell);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.08, 24), material);
      base.position.y = -1.05;
      group.add(base);

      // Handle: a curve whose two ends dip DOWN INTO the bell (past its equator, into the sphere
      // volume) so there's no visible seam, arcing up and over with a wide, unmistakably open gap.
      const handleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.42, 0.15, 0), // plunges into the bell, below its top
        new THREE.Vector3(-0.5, 0.55, 0),
        new THREE.Vector3(-0.38, 0.95, 0),
        new THREE.Vector3(0, 1.08, 0), // apex, well clear of the bell's surface
        new THREE.Vector3(0.38, 0.95, 0),
        new THREE.Vector3(0.5, 0.55, 0),
        new THREE.Vector3(0.42, 0.15, 0), // plunges back into the bell
      ]);
      const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 40, 0.1, 12, false), material);
      group.add(handle);

      return group;
    }

    // "Plate with a hole" geometry — an extruded ring (outer circle minus an
    // inner hole path) instead of a plain solid disk, so the center hole
    // (the single most recognizable weight-plate cue) actually reads.
    function createPlateGeometry(outerRadius: number, thickness: number, holeRadius = outerRadius * 0.22) {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 2,
        curveSegments: 32,
      });
      geometry.rotateX(Math.PI / 2);
      geometry.center();
      return geometry;
    }

    function buildPlateStackMesh(material: THREE.MeshStandardMaterial) {
      const group = new THREE.Group();
      const plateRadius = 0.6;
      const plateThickness = 0.14;
      const gap = 0.08;
      const plateCount = 5;
      let y = -((plateCount - 1) * (plateThickness + gap)) / 2;
      for (let i = 0; i < plateCount; i++) {
        const disk = new THREE.Mesh(createPlateGeometry(plateRadius, plateThickness), material);
        disk.position.y = y;
        group.add(disk);
        y += plateThickness + gap;
      }
      // One small constant tilt on the whole rigid stack, not per plate, so
      // every disc stays level/aligned (uniform gap, no wedge-shaped gaps)
      // while the stack still reads with a bit of visual dynamism.
      group.rotation.z = 0.06;
      return group;
    }

    function buildSinglePlateMesh(material: THREE.MeshStandardMaterial) {
      const group = new THREE.Group();
      const plate = new THREE.Mesh(createPlateGeometry(1.0, 0.18), material);
      plate.rotation.z = 0.3;
      plate.rotation.x = 0.15;
      group.add(plate);
      return group;
    }

    // Scales `object` so its bounding-box DIAGONAL matches a common target,
    // then recenters it on its own bounding-box center.
    //
    // This used to normalize by the single largest axis (`Math.max(x,y,z)`)
    // instead of the full diagonal. That let compact/round shapes (whose
    // size is spread across all three axes) end up with a much bigger
    // overall footprint than elongated ones (whose size is concentrated on
    // one axis) even after both hit the same "3.5" target — confirmed by
    // logging each shape's diagonal right after this step: the barbell
    // (long and thin) came out at 4.37, the plate stack at 5.81, 33%
    // bigger, purely from this miscalibration. Target below is the
    // barbell's own pre-fix diagonal, so its already-tuned size/camera
    // composition doesn't shift — every other shape now normalizes to
    // match it exactly instead of being compensated for after the fact.
    const TARGET_DIAGONAL = 4.37;
    function autoScaleAndRecenter(object: THREE.Object3D) {
      // 1. scale so the bounding-box diagonal matches TARGET_DIAGONAL
      const boxInitial = new THREE.Box3().setFromObject(object);
      const sizeInitial = boxInitial.getSize(new THREE.Vector3());
      const diagonal = sizeInitial.length();
      const targetScale = TARGET_DIAGONAL / (diagonal > 0.0001 ? diagonal : 1);
      object.scale.setScalar(targetScale);
      // 2. update world matrix so the box accounts for scale
      object.updateMatrixWorld(true);
      // 3. exact geometric center of the scaled model
      const boxScaled = new THREE.Box3().setFromObject(object);
      const centerScaled = boxScaled.getCenter(new THREE.Vector3());
      // 4. recenter model so its center sits at the pivot origin
      object.position.sub(centerScaled);
    }

    function setupHeroShapes() {
      modelPivot = new THREE.Group();
      scene.add(modelPivot);
      modelPivot.position.y = -0.4; // grounded stance

      const builders = [buildBarbellMesh, buildKettlebellMesh, buildPlateStackMesh, buildSinglePlateMesh];
      const scaleMultipliers = [0.82, 0.85, 0.6, 1.0];

      const built = builders.map((build, index) => {
        const material = new THREE.MeshStandardMaterial({
          color: colorWarm.clone(),
          roughness: 0.42,
          metalness: 0.92,
          transparent: true,
        });
        const group = build(material);
        autoScaleAndRecenter(group);
        return { group, material, center: NAV_TARGET_SCROLLS[index] };
      });

      heroShapes = built.map(({ group, material, center }, index) => {
        group.scale.multiplyScalar(scaleMultipliers[index]);
        if (index === 2) {
          group.scale.y *= 0.85;
        }
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        modelPivot!.add(group);
        console.log(
          "hero shape final diagonal:",
          new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()).length()
        );
        return { group, material, center };
      });
    }

    function onWindowResize() {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.aspect = sizes.width / sizes.height;
      // On narrow/portrait viewports (phones) the horizontal field of view shrinks
      // faster than the vertical one, cropping the hero shapes that were framed
      // for a wide desktop screen. Widen the (vertical) FOV as the aspect ratio
      // drops below 1 so roughly the same horizontal extent stays visible.
      camera.fov = camera.aspect < 1 ? Math.min(88, 50 / camera.aspect) : 50;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      if (shaderUniforms) shaderUniforms.uResolution.value.set(sizes.width, sizes.height);
    }

    function onMouseMove(event: MouseEvent) {
      cursorX = event.clientX;
      cursorY = event.clientY;
      const cursorInner = cursorInnerRef.current;
      if (cursorInner) {
        cursorInner.style.left = `${cursorX}px`;
        cursorInner.style.top = `${cursorY}px`;
      }
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = (event.clientY / window.innerHeight) * 2 - 1;
    }

    const originalTitleHTML: { el: HTMLElement; html: string }[] = [];
    function splitTitlesIntoChars() {
      const titles = heroEl!.querySelectorAll<HTMLElement>(".slide-title");
      titles.forEach((title) => {
        const text = title.innerHTML;
        originalTitleHTML.push({ el: title, html: text });
        let newHTML = "";
        let delayCounter = 0;
        const parts = text.split(/(<br\s*\/?>)/i);
        parts.forEach((part) => {
          if (part.toLowerCase().startsWith("<br")) {
            newHTML += part;
          } else {
            for (let i = 0; i < part.length; i++) {
              if (part[i] === " ") {
                newHTML += " ";
              } else {
                newHTML += `<span class="char" style="transition-delay: ${delayCounter * 0.035}s">${part[i]}</span>`;
                delayCounter++;
              }
            }
          }
        });
        title.innerHTML = newHTML;
      });
    }

    function updateGridDots(scroll: number) {
      const dots = heroEl!.querySelectorAll<HTMLElement>(".grid-dot");
      dots.forEach((dot, i) => {
        const startY = (i * 17) % 80 + 10;
        let speed = 90 + (i * 55) % 180;
        if (i % 2 === 0) speed = -speed;
        let y = startY + scroll * speed;
        y = ((y % 100) + 100) % 100;
        dot.style.top = `${y}%`;
      });
    }

    function updateSlides(scroll: number) {
      const slide1 = heroEl!.querySelector<HTMLElement>("#slide-1");
      const slide2 = heroEl!.querySelector<HTMLElement>("#slide-2");
      const slide3 = heroEl!.querySelector<HTMLElement>("#slide-3");
      const slide4 = heroEl!.querySelector<HTMLElement>("#slide-4");
      for (let i = 1; i <= 4; i++) {
        const fill = heroEl!.querySelector<HTMLElement>(`#dash-fill-${i}`);
        if (fill) {
          const start = (i - 1) * 0.25;
          const end = i * 0.25;
          let progress = (scroll - start) / (end - start);
          progress = Math.max(0, Math.min(1, progress));
          fill.style.height = `${progress * 100}%`;
        }
      }
      function isActive(val: number, start: number, end: number) {
        return val >= start && val <= end;
      }
      if (slide1) slide1.classList.toggle("active", isActive(scroll, -0.1, 0.12));
      if (slide2) slide2.classList.toggle("active", isActive(scroll, 0.28, 0.4));
      if (slide3) slide3.classList.toggle("active", isActive(scroll, 0.56, 0.68));
      if (slide4) slide4.classList.toggle("active", isActive(scroll, 0.84, 1.05));
    }

    const navCleanups: Array<() => void> = [];
    function setupNavigation() {
      const navLinks = heroEl!.querySelectorAll<HTMLAnchorElement>(".nav-link");
      navLinks.forEach((link, index) => {
        const handler = (e: MouseEvent) => {
          e.preventDefault();
          const rect = heroEl!.getBoundingClientRect();
          const heroTop = window.scrollY + rect.top;
          const scrollableDistance = heroEl!.offsetHeight - window.innerHeight;
          const targetY = heroTop + scrollableDistance * NAV_TARGET_SCROLLS[index];
          window.scrollTo({ top: targetY, behavior: "smooth" });
        };
        link.addEventListener("click", handler);
        navCleanups.push(() => link.removeEventListener("click", handler));
      });
    }

    let rafId = 0;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();

      const targetScroll = getHeroScrollProgress();
      currentScroll += (targetScroll - currentScroll) * 0.025;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      outerCursorX += (cursorX - outerCursorX) * 0.2;
      outerCursorY += (cursorY - outerCursorY) * 0.2;
      const cursorOuter = cursorOuterRef.current;
      if (cursorOuter) {
        cursorOuter.style.left = `${outerCursorX}px`;
        cursorOuter.style.top = `${outerCursorY}px`;
      }

      if (modelPivot) {
        modelPivot.rotation.y = mouseX * 0.25;
        modelPivot.rotation.x = mouseY * 0.15;
      }

      if (sparkParticles) {
        const positions = (sparkParticles.geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array;
        const time = clock.getElapsedTime();
        const scrollVelocity = Math.abs(targetScroll - currentScroll);
        const speedMultiplier = 1.0 + scrollVelocity * 9.0;
        const turbulence = scrollVelocity * 0.8;
        for (let i = 0; i < SPARK_COUNT; i++) {
          const idx = i * 3;
          const data = sparkData[i];
          positions[idx] += data.speedX * deltaTime * speedMultiplier;
          positions[idx + 1] += data.speedY * deltaTime * speedMultiplier;
          positions[idx + 2] += data.speedZ * deltaTime * speedMultiplier;
          const currentSway = data.swayRadius * (1.0 + turbulence * 4.0);
          positions[idx] += Math.sin(time * data.swaySpeed + data.phase) * currentSway * deltaTime;
          positions[idx + 2] += Math.cos(time * data.swaySpeed + data.phase) * currentSway * deltaTime;
          if (positions[idx + 1] > 3.0 || Math.abs(positions[idx]) > 3.5 || Math.abs(positions[idx + 2]) > 3.5) {
            positions[idx + 1] = -2.5;
            positions[idx] = (Math.random() - 0.5) * 3.0;
            positions[idx + 2] = (Math.random() - 0.5) * 3.0;
          }
        }
        (sparkParticles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }

      const phi = currentScroll * Math.PI * 2.0;
      const y = 0.35 + Math.sin(currentScroll * Math.PI) * 0.8;
      const radius = 4.2 - Math.sin(currentScroll * Math.PI) * 0.6;
      const x = radius * Math.sin(phi);
      const z = radius * Math.cos(phi);

      const transitionProgress = Math.min(1.0, currentScroll / 0.28);
      const easeFactor = (Math.cos(transitionProgress * Math.PI) + 1.0) * 0.5;
            // Also pull the composition back toward center on narrow/portrait screens —
            // the widened FOV alone isn't enough to keep the barbell (our widest shape)
            // fully in frame, since this offset was tuned for a wide desktop view.
            const aspectDamp = Math.min(1, camera.aspect);
            const lookAtXOffset = -0.9 * easeFactor * aspectDamp;
      const targetLookAt = new THREE.Vector3(lookAtXOffset, -0.15, 0);
      const targetPos = new THREE.Vector3(x, y, z);
      camera.position.lerp(targetPos, 0.025);
      camera.lookAt(targetLookAt);

      if (shaderUniforms) {
        shaderUniforms.uTime.value = clock.getElapsedTime();
        shaderUniforms.uMouse.value.set(mouseX, -mouseY);
        shaderUniforms.uScroll.value = currentScroll;
      }

      // Crossfade the four shapes by distance from their scroll "center"
      // (matching the nav target scrolls), so only the nearest shape (or
      // two, mid-transition) is visible at any given scroll position.
      const transitionWidth = 0.22;
      heroShapes.forEach(({ group, material, center }) => {
        const distance = Math.abs(currentScroll - center);
        const weight = Math.max(0, 1 - distance / transitionWidth);
        material.opacity = weight;
        material.transparent = true;
        group.visible = weight > 0.01;
      });

      // Keep every shape's color in lockstep with the shader's molten iron
      // -> steel palette shift, using the exact same smoothstep the shader
      // applies to `scroll` (see createBackgroundShader's `t`).
      const shapeColorT = THREE.MathUtils.smoothstep(currentScroll, 0, 1);
      heroShapes.forEach(({ material }) => material.color.lerpColors(colorWarm, colorCool, shapeColorT));

      updateSlides(currentScroll);
      updateGridDots(currentScroll);

      renderer.render(scene, camera);
    }

    // -----------------------------------------------------------------
    // Bootstrap (mirrors the original DOMContentLoaded handler)
    // -----------------------------------------------------------------
    splitTitlesIntoChars();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");
    scene.fog = new THREE.FogExp2("#000000", 0.01);

    const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0.2, 3.0);
    scene.add(camera);

    createBackgroundShader(); // adds the wave plane as a child of the camera

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.2;

    const ambientLight = new THREE.AmbientLight("#ffffff", 0.1);
    scene.add(ambientLight);

    // Key light: super-bright white from upper-right, casts shadows
    const keyLight = new THREE.SpotLight("#ffffff", 18.0);
    keyLight.position.set(4, 6, 3);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.9;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Rim light: cool blue from behind-left, defines the silhouette
    const rimLight = new THREE.DirectionalLight("#e3f2ff", 10.0);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    // Fill light: very faint warm cream from below-front
    const fillLight = new THREE.DirectionalLight("#fff3e6", 0.8);
    fillLight.position.set(-2, -4, 2);
    scene.add(fillLight);

    createSparks();
    setupHeroShapes();

    onWindowResize();
    animate();
    setupNavigation();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onWindowResize);

    // -----------------------------------------------------------------
    // Cleanup: cancel the loop, drop listeners, dispose every GPU resource
    // -----------------------------------------------------------------
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onWindowResize);
      navCleanups.forEach((fn) => fn());
      // Undo the innerHTML mutation from splitTitlesIntoChars so a remount
      // (e.g. React StrictMode's dev-only double-invoke) starts from clean
      // markup instead of re-splitting its own <span> tags as characters.
      originalTitleHTML.forEach(({ el, html }) => {
        el.innerHTML = html;
      });

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((material) => {
            const mat = material as THREE.Material & { map?: THREE.Texture | null };
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        }
      });

      renderer.dispose();
    };
  }, []);

  return (
      <div ref={sectionRef} className="hero-section">
        <div className="hero-sticky">
          <div ref={cursorInnerRef} className="cursor-inner" />
          <div ref={cursorOuterRef} className="cursor-outer" />

          <div className="cinematic-container">
            <div className="main-header">
              <div className="brand-block">
                <div className="brand">Forge</div>
                <div className="brand-tagline">Strength Training Studio</div>
              </div>
              <nav className="header-nav">
                <a href="#slide-1" className="nav-link">
                  Iron
                </a>
                <span className="nav-dot" />
                <a href="#slide-2" className="nav-link">
                  Power
                </a>
                <span className="nav-dot" />
                <a href="#slide-3" className="nav-link">
                  Flow
                </a>
                <span className="nav-dot" />
                <a href="#slide-4" className="nav-link">
                  Evolve
                </a>
              </nav>
              <div className="header-actions">
                <Link href="/kontakt" className="contact-btn">
                  Contact
                </Link>
              </div>
            </div>

            <div className="slide" id="slide-1">
              <h2 className="slide-title">
                Iron <br />
                and Time
              </h2>
              <div className="desc-row">
                <p className="slide-desc col-1">
                  A timeless material holding centuries of human strength. Fluid in hot flames, unbreakable in its
                  form. Each rep captures a tense, disciplined moment.
                </p>
                <p className="slide-desc col-2">
                  Born of molten fire and unshakable will, it stands to bridge our ancestors&apos; endurance and
                  modern ambition. A restless energy forged into still, heavy iron.
                </p>
              </div>
            </div>

            <div className="slide" id="slide-2">
              <h2 className="slide-title">
                Power <br />
                Discipline
              </h2>
              <p className="slide-desc">
                A physique forged at the peak of human effort and quiet discipline. Every athlete bound by the same
                relentless pursuit.
              </p>
            </div>

            <div className="slide" id="slide-3">
              <h2 className="slide-title">Liquid Steel</h2>
              <p className="slide-desc">
                Strength that flows. Mesmerizing currents of liquid steel move through space, reflecting every
                strained muscle and every rep completed.
              </p>
            </div>

            <div className="slide" id="slide-4">
              <h2 className="slide-title">
                Evolve <br />
                Beyond
              </h2>
              <p className="slide-desc">
                Reimagining discipline through the lens of modern training. A classic pursuit of strength, reborn in
                the currents of relentless progress.
              </p>
            </div>
          </div>

          <div className="grid-horizontal-line" />
          <div className="grid-lines">
            <div className="grid-line">
              <div className="grid-dot top" />
              <div className="grid-dot bottom" />
            </div>
            <div className="grid-line">
              <div className="grid-dot top" />
              <div className="grid-dot bottom" />
            </div>
            <div className="grid-line">
              <div className="grid-dot top" />
              <div className="grid-dot bottom" />
            </div>
            <div className="grid-line">
              <div className="grid-dot top" />
              <div className="grid-dot bottom" />
            </div>
            <div className="grid-line story-progress-container">
              <div className="grid-dot top" />
              <div className="grid-dot bottom" />
              <div className="story-dashes">
                <div className="story-dash">
                  <div className="story-dash-fill" id="dash-fill-1" />
                </div>
                <div className="story-dash">
                  <div className="story-dash-fill" id="dash-fill-2" />
                </div>
                <div className="story-dash">
                  <div className="story-dash-fill" id="dash-fill-3" />
                </div>
                <div className="story-dash">
                  <div className="story-dash-fill" id="dash-fill-4" />
                </div>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="webgl-canvas" />
        </div>
      </div>
  );
}
