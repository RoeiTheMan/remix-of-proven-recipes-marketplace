// Lottie animation: three teal dots pulsing (AI advisor "thinking").
// Hand-authored, brand colors only (Consistency Teal #1F6F6F).
const teal = [0.122, 0.435, 0.435, 1];
// lottie-web needs i/o easing on every non-final keyframe to interpolate.
const ease = { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } };

function dot(ind: number, x: number, delay: number) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: `dot${ind}`,
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { t: 0 + delay, s: [25], ...ease },
          { t: 12 + delay, s: [100], ...ease },
          { t: 24 + delay, s: [25], ...ease },
          { t: 45 + delay, s: [25] },
        ],
      },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [x, 30, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          { t: 0 + delay, s: [70, 70, 100], ...ease },
          { t: 12 + delay, s: [110, 110, 100], ...ease },
          { t: 24 + delay, s: [70, 70, 100], ...ease },
          { t: 45 + delay, s: [70, 70, 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [14, 14] } },
          { ty: "fl", c: { a: 0, k: teal }, o: { a: 0, k: 100 } },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 },
            o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 },
          },
        ],
      },
    ],
    ip: 0,
    op: 60,
    st: 0,
  };
}

const aiThinking = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 54,
  w: 200,
  h: 60,
  nm: "pickture-ai-thinking",
  ddd: 0,
  assets: [],
  layers: [dot(1, 70, 0), dot(2, 100, 6), dot(3, 130, 12)],
};

export default aiThinking;
