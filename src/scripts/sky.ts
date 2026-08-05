/* =========================================================
   Nicolas Robinet - portfolio (Dusk)
   Three.js shader sky: sunset gradient, glowing sun with
   atmospheric scattering, drifting volumetric clouds, and
   twinkling stars. Decorative only.

   Graceful degradation:
   - No WebGL      -> the CSS gradient on .sky stays visible.
   - Reduced motion -> a single static frame, no animation loop.
   - Tab hidden     -> the render loop pauses to save power.
   ========================================================= */
import * as THREE from 'three';

const container = document.querySelector<HTMLElement>('.sky');
const canvasEl = document.getElementById('sky-canvas') as HTMLCanvasElement | null;

if (container && canvasEl) {
  const sky = container;
  const canvas = canvasEl;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer: THREE.WebGLRenderer | null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    renderer = null; /* CSS fallback gradient remains */
  }

  if (renderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uRes;
      uniform vec2 uMouse;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
        return v;
      }

      vec3 skyGradient(float t) {
        vec3 horizon = vec3(1.00, 0.72, 0.42);
        vec3 low     = vec3(0.72, 0.36, 0.30);
        vec3 mid     = vec3(0.30, 0.22, 0.34);
        vec3 high    = vec3(0.10, 0.14, 0.22);
        vec3 zenith  = vec3(0.045, 0.07, 0.13);
        vec3 c = mix(horizon, low, smoothstep(0.0, 0.18, t));
        c = mix(c, mid,   smoothstep(0.12, 0.40, t));
        c = mix(c, high,  smoothstep(0.36, 0.66, t));
        c = mix(c, zenith, smoothstep(0.62, 1.0, t));
        return c;
      }

      void main() {
        vec2 uv = vUv;
        float aspect = uRes.x / uRes.y;

        vec3 col = skyGradient(uv.y);

        /* Sun low on the horizon */
        vec2 sun = vec2(0.58 + uMouse.x * 0.02, 0.12 + uMouse.y * 0.01);
        vec2 p = uv - sun; p.x *= aspect;
        float d = length(p);
        float disc = smoothstep(0.085, 0.05, d);
        float glow = exp(-d * 3.2) * 0.9 + exp(-d * 8.0) * 0.6;
        col += vec3(1.0, 0.86, 0.6) * glow * 0.6;

        /* Horizontal scattering band toward the sun */
        float scat = exp(-abs(uv.y - sun.y) * 6.0) * exp(-abs(uv.x - sun.x) * 1.2);
        col += vec3(1.0, 0.55, 0.28) * scat * 0.25;

        /* Drifting volumetric clouds */
        vec2 cuv = vec2(uv.x * aspect, uv.y);
        float cl = fbm(cuv * 3.0 + vec2(uTime * 0.006, uTime * 0.002) + uMouse * 0.3);
        cl = smoothstep(0.5, 0.9, cl);
        float band = smoothstep(0.12, 0.5, uv.y) * (1.0 - smoothstep(0.8, 1.0, uv.y));
        cl *= band;
        vec3 cloudCol = mix(vec3(0.12, 0.13, 0.18), vec3(0.9, 0.5, 0.35), min(scat * 2.0, 1.0));
        col = mix(col, cloudCol, cl * 0.6);

        /* Sun disc drawn over clouds */
        col = mix(col, vec3(1.0, 0.95, 0.82), disc);

        /* Stars in the dark upper sky, occluded by clouds */
        float starFade = smoothstep(0.5, 0.8, uv.y) * (1.0 - cl);
        vec2 sg = uv * vec2(aspect, 1.0) * 260.0;
        float star = hash(floor(sg));
        float pt = smoothstep(0.985, 1.0, star);
        float tw = 0.5 + 0.5 * sin(uTime * 2.0 + star * 40.0);
        col += vec3(0.9, 0.94, 1.0) * pt * tw * starFade * 0.9;

        /* Dither to remove 8-bit banding */
        col += (hash(uv * uRes) - 0.5) * (1.0 / 255.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    function renderOnce() { renderer!.render(scene, camera); }

    function resize() {
      const w = sky.clientWidth;
      const h = sky.clientHeight;
      renderer!.setSize(w, h, false);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      uniforms.uRes.value.set(canvas.width, canvas.height);
      if (reduce) renderOnce();
    }
    resize();
    window.addEventListener('resize', resize);

    if (reduce) {
      uniforms.uTime.value = 8.0;
      renderOnce();
    } else {
      const timer = new THREE.Timer();
      timer.connect(document);

      function frame() {
        timer.update();
        uniforms.uTime.value = timer.getElapsed();
        renderOnce();
        requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }
  }
}
