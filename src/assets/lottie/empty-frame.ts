// Lottie animation: floating picture frame with mountain + sun (empty state).
// Mirrors the Pickture logo concept — flat, brand colors only.
const teal = [0.122, 0.435, 0.435, 1];
const ink = [0.07, 0.07, 0.07, 1];
// lottie-web needs i/o easing on every non-final keyframe to interpolate.
const ease = { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } };

const emptyFrame = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 160,
  h: 160,
  nm: "pickture-empty-frame",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "frame-group",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { t: 0, s: [80, 78, 0], to: [0, 1, 0], ti: [0, -1, 0], ...ease },
            { t: 45, s: [80, 86, 0], to: [0, -1, 0], ti: [0, 1, 0], ...ease },
            { t: 90, s: [80, 78, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          nm: "frame",
          it: [
            { ty: "rc", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [104, 88] }, r: { a: 0, k: 0 } },
            { ty: "st", c: { a: 0, k: ink }, o: { a: 0, k: 100 }, w: { a: 0, k: 4 }, lc: 2, lj: 2 },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 },
            },
          ],
        },
        {
          ty: "gr",
          nm: "mountain",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-34, 30], [0, -10], [34, 30]],
                  c: false,
                },
              },
            },
            { ty: "st", c: { a: 0, k: ink }, o: { a: 0, k: 100 }, w: { a: 0, k: 4 }, lc: 2, lj: 2 },
            {
              ty: "tr",
              p: { a: 0, k: [0, 8] }, a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 },
            },
          ],
        },
        {
          ty: "gr",
          nm: "sun",
          it: [
            { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [16, 16] } },
            { ty: "fl", c: { a: 0, k: teal }, o: { a: 0, k: 100 } },
            {
              ty: "tr",
              p: { a: 0, k: [26, -22] }, a: { a: 0, k: [0, 0] },
              s: {
                a: 1,
                k: [
                  { t: 0, s: [100, 100], ...ease },
                  { t: 45, s: [120, 120], ...ease },
                  { t: 90, s: [100, 100] },
                ],
              },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }, sk: { a: 0, k: 0 }, sa: { a: 0, k: 0 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
    },
  ],
};

export default emptyFrame;
