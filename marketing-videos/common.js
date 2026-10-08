// Deterministic animation helpers: every frame is a pure function of time t (seconds).
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const eo3 = (x) => 1 - Math.pow(1 - x, 3);
const eo5 = (x) => 1 - Math.pow(1 - x, 5);
const ei3 = (x) => x * x * x;
const eio3 = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eob = (x) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const $ = (id) => document.getElementById(id);

/** Apply opacity / translate / scale / rotate / blur to an element in one call. */
function put(el, { o = 1, x = 0, y = 0, s = 1, r = 0, b = 0 } = {}) {
  el.style.opacity = o;
  el.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
  el.style.filter = b > 0.05 ? `blur(${b}px)` : "none";
  el.style.visibility = o <= 0.001 ? "hidden" : "visible";
}

/** Word-by-word reveal: rise + un-blur + fade, staggered. */
function revealWords(words, t, start, gap = 0.1, dur = 0.55, rise = 70) {
  words.forEach((w, i) => {
    const p = eo5(prog(t, start + i * gap, start + i * gap + dur));
    put(w, { o: p, y: (1 - p) * rise, b: (1 - p) * 14 });
  });
}

/** Keyframed camera: kf = [[t, scale, focusX, focusY], ...] -> transform for a 1080x1350 world. */
function camera(el, kf, t) {
  let a = kf[0], b = kf[kf.length - 1];
  for (let i = 0; i < kf.length - 1; i++) {
    if (t >= kf[i][0] && t <= kf[i + 1][0]) { a = kf[i]; b = kf[i + 1]; break; }
  }
  const p = a === b ? 1 : eio3(prog(t, a[0], b[0]));
  const s = lerp(a[1], b[1], p), fx = lerp(a[2], b[2], p), fy = lerp(a[3], b[3], p);
  el.style.transformOrigin = "0 0";
  el.style.transform = `translate(${540 - fx * s}px, ${675 - fy * s}px) scale(${s})`;
}
