// Lottie animation: teal circle + checkmark drawing in (purchase success).
// Hand-authored, brand colors only.
const teal = [0.122, 0.435, 0.435, 1];
// lottie-web needs i/o easing on every non-final keyframe to interpolate.
const ease = { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } };

const purchaseSuccess = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 45,
  w: 120,
  h: 120,
  nm: "pickture-purchase-success",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: -90 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [88, 88] } },
            {
              ty: "tm",
              s: { a: 0, k: 0 },
              e: { a: 1, k: [{ t: 0, s: [0], ...ease }, { t: 18, s: [100] }] },
              o: { a: 0, k: 0 },
              m: 1,
            },
            {
              ty: "st",
              c: { a: 0, k: teal }, o: { a: 0, k: 100 },
              w: { a: 0, k: 6 }, lc: 2, lj: 2,
            },
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
      op: 45,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 62, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-18, 0], [-6, 12], [20, -14]],
                  c: false,
                },
              },
            },
            {
              ty: "tm",
              s: { a: 0, k: 0 },
              e: { a: 1, k: [{ t: 14, s: [0], ...ease }, { t: 30, s: [100] }] },
              o: { a: 0, k: 0 },
              m: 1,
            },
            {
              ty: "st",
              c: { a: 0, k: teal }, o: { a: 0, k: 100 },
              w: { a: 0, k: 7 }, lc: 2, lj: 2,
            },
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
      op: 45,
      st: 0,
    },
  ],
};

export default purchaseSuccess;
