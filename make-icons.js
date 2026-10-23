// アイコン生成: node make-icons.js  （家計簿と同じ、濃いスレート地に白い線アイコン）
const fs = require('fs'), zlib = require('zlib');
const BG = [43, 47, 54], FG = [255, 255, 255];
// lucide list-checks (24格子)
const segs = [
  [[3,17],[5,19]],[[5,19],[9,15]],
  [[3,7],[5,9]],[[5,9],[9,5]],
  [[13,6],[21,6]],[[13,12],[21,12]],[[13,18],[21,18]],
];
function dist(px, py, a, b) {
  const dx = b[0]-a[0], dy = b[1]-a[1];
  let t = ((px-a[0])*dx + (py-a[1])*dy) / (dx*dx+dy*dy); t = Math.max(0, Math.min(1, t));
  return Math.hypot(px-(a[0]+t*dx), py-(a[1]+t*dy));
}
function crc(buf) { let c, crcT = crc.t || (crc.t = Array.from({length:256}, (_, n) => { c = n; for (let k=0;k<8;k++) c = c&1 ? 0xedb88320^(c>>>1) : c>>>1; return c>>>0; })); let x = 0xffffffff; for (const b of buf) x = crcT[(x^b)&255]^(x>>>8); return (x^0xffffffff)>>>0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); }
function png(size) {
  const scale = size * 0.5 / 24, off = size * 0.25, half = scale;      // 線幅2 → 半幅 scale
  const SS = 3, raw = Buffer.alloc((size*3+1)*size);
  for (let y = 0; y < size; y++) {
    raw[y*(size*3+1)] = 0;
    for (let x = 0; x < size; x++) {
      let cov = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const gx = (x + (sx+.5)/SS - off) / scale, gy = (y + (sy+.5)/SS - off) / scale;
        if (segs.some(s => dist(gx, gy, s[0], s[1]) <= 1)) cov++;
      }
      const a = cov / (SS*SS), o = y*(size*3+1)+1+x*3;
      for (let i = 0; i < 3; i++) raw[o+i] = Math.round(BG[i]*(1-a) + FG[i]*a);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4); ihdr[8]=8; ihdr[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const s of [180, 192, 512]) fs.writeFileSync(`icon-${s}.png`, png(s));
console.log('done');
