// Pembuat kode QR sederhana (mode byte, koreksi kesalahan M, versi 1 sampai 10).
// Cukup untuk URL verifikasi sertifikat (sampai sekitar 200 karakter).

const EXP: number[] = new Array(512);
const LOG: number[] = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const gmul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function rsDivisor(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gmul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  // poly[0] adalah koefisien suku terendah; buang suku tertinggi (selalu 1) lalu balik urutan
  return poly.slice(0, degree).reverse();
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    for (let i = 0; i < result.length; i++) result[i] ^= gmul(divisor[i], factor);
  }
  return result;
}

// [kata kode EC per blok, [[jumlah blok, kata data per blok], ...]] untuk tingkat M
const EC_M: Record<number, [number, [number, number][]]> = {
  1: [10, [[1, 16]]],
  2: [16, [[1, 28]]],
  3: [26, [[1, 44]]],
  4: [18, [[2, 32]]],
  5: [24, [[2, 43]]],
  6: [16, [[4, 27]]],
  7: [18, [[4, 31]]],
  8: [22, [[2, 38], [2, 39]]],
  9: [22, [[3, 36], [2, 37]]],
  10: [26, [[4, 43], [1, 44]]],
};
const ALIGN: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

const dataCodewords = (v: number) => EC_M[v][1].reduce((a, [n, d]) => a + n * d, 0);

function bchFormat(data5: number): number {
  let rem = data5;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data5 << 10) | rem) ^ 0x5412;
}
function bchVersion(v: number): number {
  let rem = v;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (v << 12) | rem;
}

export function qrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const countBits = v <= 9 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= dataCodewords(v) * 8) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error("Teks terlalu panjang untuk kode QR.");

  // 1. Bit data
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  const capBits = dataCodewords(version) * 8;
  push(0, Math.min(4, capBits - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let pad = 0xec; bits.length < capBits; pad ^= 0xec ^ 0x11) push(pad, 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    data.push(b);
  }

  // 2. Bagi ke blok, hitung EC, lalu selang-seling
  const [ecLen, groups] = EC_M[version];
  const divisor = rsDivisor(ecLen);
  const dBlocks: number[][] = [];
  const eBlocks: number[][] = [];
  let pos = 0;
  for (const [n, d] of groups) {
    for (let i = 0; i < n; i++) {
      const blk = data.slice(pos, pos + d);
      pos += d;
      dBlocks.push(blk);
      eBlocks.push(rsRemainder(blk, divisor));
    }
  }
  const codewords: number[] = [];
  const maxD = Math.max(...dBlocks.map((b) => b.length));
  for (let i = 0; i < maxD; i++) for (const b of dBlocks) if (i < b.length) codewords.push(b[i]);
  for (let i = 0; i < ecLen; i++) for (const b of eBlocks) codewords.push(b[i]);

  // 3. Pola fungsi
  const size = version * 4 + 17;
  const mod: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const setF = (r: number, c: number, dark: boolean) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    mod[r][c] = dark;
    fn[r][c] = true;
  };
  for (let i = 0; i < size; i++) {
    setF(6, i, i % 2 === 0);
    setF(i, 6, i % 2 === 0);
  }
  const finder = (cr: number, cc: number) => {
    for (let dr = -4; dr <= 4; dr++)
      for (let dc = -4; dc <= 4; dc++) {
        const d = Math.max(Math.abs(dr), Math.abs(dc));
        setF(cr + dr, cc + dc, d !== 2 && d !== 4);
      }
  };
  finder(3, 3);
  finder(3, size - 4);
  finder(size - 4, 3);
  const ap = ALIGN[version];
  for (let i = 0; i < ap.length; i++)
    for (let j = 0; j < ap.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) continue;
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++) setF(ap[i] + dr, ap[j] + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }

  const drawFormat = (mask: number) => {
    const f = bchFormat((0b00 << 3) | mask); // tingkat M = 00
    const bit = (i: number) => ((f >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) setF(i, 8, bit(i));
    setF(7, 8, bit(6));
    setF(8, 8, bit(7));
    setF(8, 7, bit(8));
    for (let i = 9; i < 15; i++) setF(8, 14 - i, bit(i));
    for (let i = 0; i < 8; i++) setF(8, size - 1 - i, bit(i));
    for (let i = 8; i < 15; i++) setF(size - 15 + i, 8, bit(i));
    setF(size - 8, 8, true);
  };
  drawFormat(0);
  if (version >= 7) {
    const v = bchVersion(version);
    for (let i = 0; i < 18; i++) {
      const dark = ((v >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setF(b, a, dark);
      setF(a, b, dark);
    }
  }

  // 4. Tempatkan kata kode (zig-zag)
  const allBits: boolean[] = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) allBits.push(((cw >>> i) & 1) !== 0);
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (!fn[r][c] && k < allBits.length) {
          mod[r][c] = allBits[k++];
        }
      }
    }
  }

  // 5. Pilih mask terbaik
  const maskFn = [
    (r: number, c: number) => (r + c) % 2 === 0,
    (r: number) => r % 2 === 0,
    (_r: number, c: number) => c % 3 === 0,
    (r: number, c: number) => (r + c) % 3 === 0,
    (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r: number, c: number) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r: number, c: number) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r: number, c: number) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ];
  const penalty = (m: boolean[][]) => {
    let p = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let a = 0; a < size; a++) {
        let run = 1;
        for (let b = 1; b <= size; b++) {
          const same = b < size && (pass === 0 ? m[a][b] === m[a][b - 1] : m[b][a] === m[b - 1][a]);
          if (same) run++;
          else {
            if (run >= 5) p += 3 + (run - 5);
            run = 1;
          }
        }
      }
    }
    for (let r = 0; r < size - 1; r++)
      for (let c = 0; c < size - 1; c++) {
        const v = m[r][c];
        if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) p += 3;
      }
    let dark = 0;
    for (const row of m) for (const v of row) if (v) dark++;
    p += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return p;
  };

  let best: boolean[][] | null = null;
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let mk = 0; mk < 8; mk++) {
    const m = mod.map((row) => row.slice());
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (!fn[r][c] && maskFn[mk](r, c)) m[r][c] = !m[r][c];
    const p = penalty(m);
    if (p < bestPenalty) {
      bestPenalty = p;
      best = m;
      bestMask = mk;
    }
  }
  // Tulis ulang bit format untuk mask terpilih
  const result = best as boolean[][];
  const f = bchFormat((0b00 << 3) | bestMask);
  const bit = (i: number) => ((f >>> i) & 1) !== 0;
  const put = (r: number, c: number, v: boolean) => {
    result[r][c] = v;
  };
  for (let i = 0; i <= 5; i++) put(i, 8, bit(i));
  put(7, 8, bit(6));
  put(8, 8, bit(7));
  put(8, 7, bit(8));
  for (let i = 9; i < 15; i++) put(8, 14 - i, bit(i));
  for (let i = 0; i < 8; i++) put(8, size - 1 - i, bit(i));
  for (let i = 8; i < 15; i++) put(size - 15 + i, 8, bit(i));
  put(size - 8, 8, true);
  return result;
}
