// PWAアイコン生成スクリプト(依存ライブラリなし・Node標準のzlibのみ使用)
// 実行: node scripts/generate-icons.mjs
// 青背景に白のブロック文字「E」を描いたPNGを public/icons/ に出力する
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BLUE = [42, 120, 214, 255]; // #2a78d6
const WHITE = [255, 255, 255, 255];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c;
    });
  }
  let crc = -1;
  for (const b of buf) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  // 1ピクセルずつRGBAを組み立てる(各行の先頭にフィルタ種別0を付けるのがPNGの仕様)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const u = size / 12; // 12x12グリッドで図形を描く
  // ブロック文字「E」: 縦棒 + 横棒3本(グリッド座標)
  const bars = [
    { x: 3, y: 3, w: 1.4, h: 6 }, // 縦棒
    { x: 3, y: 3, w: 6, h: 1.4 }, // 上
    { x: 3, y: 5.3, w: 4.5, h: 1.4 }, // 中
    { x: 3, y: 7.6, w: 6, h: 1.4 }, // 下
  ];
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const gx = x / u;
      const gy = y / u;
      const inE = bars.some(
        (b) => gx >= b.x && gx <= b.x + b.w && gy >= b.y && gy <= b.y + b.h
      );
      const [r, g, bl, a] = inE ? WHITE : BLUE;
      const p = row + 1 + x * 4;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = bl;
      raw[p + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNGシグネチャ
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const size of [180, 192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, makePng(size));
  console.log(`generated public/icons/icon-${size}.png`);
}
