import WebSocket from "ws";
import crypto from "node:crypto";

const WIN_EPOCH = 11644473600;
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_FULL_VERSION = "143.0.3650.75";
const SEC_MS_GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;

const _SHA256_INITIAL = [
  0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
  0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
];
const _SHA256_STATE = [
  0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A,
  0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2,
];
const _SHA256_SCHEDULE = [
  0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA,
  0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6,
  0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33,
  0xD258B060, 0x72766564,
];
const _SHA256_ROUND_CONSTANTS = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
];
const _SHA256_ADJUSTMENT = 0xC9DC06A7;
const _SHA256_BLOCK_CONSTANTS = [
  ..._SHA256_ROUND_CONSTANTS.slice(0, 14),
  _SHA256_ADJUSTMENT,
  ..._SHA256_ROUND_CONSTANTS.slice(15),
];
const _SHA256_SIGMA0_ADJUSTMENT = 0x059C0B80;
const _SHA256_SIGMA1_ADJUSTMENT = 0x000B92C0;

const _CS64_COEFFICIENTS: [number, number][] = [
  [0xE82E91B1, 0xB32700D0],
  [0x44DE24C6, 0x88DFF51D],
  [0x3BEB65BC, 0x29514038],
  [0xC89C5933, 0xB328CBDF],
  [0x8D1EC211, 0xD405B4D5],
  [0x314EF5D5, 0x26E55F3C],
  [0xE92491B1, 0x607801C6],
  [0xF0A5B9D5, 0x82B2C1FB],
  [0x06064CF3, 0xFA51A3DA],
  [0xDA79FA60, 0x207CC464],
  [0xBED20560, 0x3C3C74F3],
  [0x89F9C9F8, 0xD2D14B61],
  [0x35FA38C6, 0xBB04A2C1],
  [0xCB49E3C6, 0xC5626167],
];
const _CS64_FACTOR = 0x82893933;
const _CS64_ADJUSTMENT0 = 0xF2F90B1A;
const _CS64_ADJUSTMENT1 = 0x0B1A0000;

function _rol16(value: number): number {
  const v = value >>> 0;
  return ((v << 16) | (v >>> 16)) >>> 0;
}

function _words_le4_even(data: Buffer): number[] {
  const padLen = (4 - (data.length % 4)) % 4;
  const padded = padLen > 0 ? Buffer.concat([data, Buffer.alloc(padLen)]) : data;
  if (padded.length === 0) return [];
  const words: number[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    words.push(padded.readUInt32LE(i));
  }
  if (words.length % 2 !== 0) {
    words.push(0);
  }
  return words;
}

function _sigma0(v: number): number {
  const val = v >>> 0;
  const r7 = (val >>> 7) | ((val << 25) >>> 0);
  const r18 = (val >>> 18) | ((val << 14) >>> 0);
  const s3 = val >>> 3;
  return (r7 ^ r18 ^ s3) >>> 0;
}

function _sigma1(v: number): number {
  const val = v >>> 0;
  const r17 = (val >>> 17) | ((val << 15) >>> 0);
  const r19 = (val >>> 19) | ((val << 13) >>> 0);
  const s10 = val >>> 10;
  return (r17 ^ r19 ^ s10) >>> 0;
}

function _sha256_rounds(state: number[], words: number[], first_round = 0): number[] {
  let [a, b, c, d, e, f, g, h] = state;
  const constants = first_round === 14 ? _SHA256_BLOCK_CONSTANTS : _SHA256_ROUND_CONSTANTS;
  const aligned = Math.min(64, Math.floor((first_round + 7) / 8) * 8);

  for (let index = first_round; index < aligned; index++) {
    const rot_e = BigInt(e) * 0x100000001n;
    const rot_a = BigInt(a) * 0x100000001n;
    const e_rotr6 = Number((rot_e >> 6n) & 0xFFFFFFFFn);
    const e_rotr11 = Number((rot_e >> 11n) & 0xFFFFFFFFn);
    const e_rotr25 = Number((rot_e >> 25n) & 0xFFFFFFFFn);
    const a_rotr2 = Number((rot_a >> 2n) & 0xFFFFFFFFn);
    const a_rotr13 = Number((rot_a >> 13n) & 0xFFFFFFFFn);
    const a_rotr22 = Number((rot_a >> 22n) & 0xFFFFFFFFn);

    const ch = (g ^ (e & (f ^ g))) >>> 0;
    const maj = ((a & b) | (c & (a | b))) >>> 0;
    const ep1 = (e_rotr6 ^ e_rotr11 ^ e_rotr25) >>> 0;
    const ep0 = (a_rotr2 ^ a_rotr13 ^ a_rotr22) >>> 0;

    const t1 = (h + ep1 + ch + constants[index] + words[index]) >>> 0;
    const t2 = (ep0 + maj) >>> 0;

    h = g;
    g = f;
    f = e;
    e = (d + t1) >>> 0;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) >>> 0;
  }

  for (let index = aligned; index < 64; index += 8) {
    {
      const rot_e = BigInt(e) * 0x100000001n;
      const rot_a = BigInt(a) * 0x100000001n;
      const ep1 = Number(((rot_e >> 6n) ^ (rot_e >> 11n) ^ (rot_e >> 25n)) & 0xFFFFFFFFn);
      const ch = (g ^ (e & (f ^ g))) >>> 0;
      const t1 = (h + ep1 + ch + constants[index] + words[index]) >>> 0;
      d = (d + t1) >>> 0;
      const ep0 = Number(((rot_a >> 2n) ^ (rot_a >> 13n) ^ (rot_a >> 22n)) & 0xFFFFFFFFn);
      const maj = ((a & b) | (c & (a | b))) >>> 0;
      h = (t1 + ep0 + maj) >>> 0;
    }
    {
      const rot_e = BigInt(d) * 0x100000001n;
      const rot_a = BigInt(h) * 0x100000001n;
      const ep1 = Number(((rot_e >> 6n) ^ (rot_e >> 11n) ^ (rot_e >> 25n)) & 0xFFFFFFFFn);
      const ch = (f ^ (d & (e ^ f))) >>> 0;
      const t1 = (g + ep1 + ch + constants[index + 1] + words[index + 1]) >>> 0;
      c = (c + t1) >>> 0;
      const ep0 = Number(((rot_a >> 2n) ^ (rot_a >> 13n) ^ (rot_a >> 22n)) & 0xFFFFFFFFn);
      const maj = ((h & a) | (b & (h | a))) >>> 0;
      g = (t1 + ep0 + maj) >>> 0;
    }
    {
      const rot_e = BigInt(c) * 0x100000001n;
      const rot_a = BigInt(g) * 0x100000001n;
      const ep1 = Number(((rot_e >> 6n) ^ (rot_e >> 11n) ^ (rot_e >> 25n)) & 0xFFFFFFFFn);
      const ch = (e ^ (c & (d ^ e))) >>> 0;
      const t1 = (f + ep1 + ch + constants[index + 2] + words[index + 2]) >>> 0;
      b = (b + t1) >>> 0;
      const ep0 = Number(((rot_a >> 2n) ^ (rot_a >> 13n) ^ (rot_a >> 22n)) & 0xFFFFFFFFn);
      const maj = ((g & h) | (a & (g | h))) >>> 0;
      f = (t1 + ep0 + maj) >>> 0;
    }
    {
      const rot_e = BigInt(b) * 0x100000001n;
      const rot_a = BigInt(f) * 0x100000001n;
      const ep1 = Number(((rot_e >> 6n) ^ (rot_e >> 11n) ^ (rot_e >> 25n)) & 0xFFFFFFFFn);
      const ch = (d ^ (b & (c ^ d))) >>> 0;
      const t1 = (e + ep1 + ch + constants[index + 3] + words[index + 3]) >>> 0;
      a = (a + t1) >>> 0;
      const ep0 = Number(((rot_a >> 2n) ^ (rot_a >> 13n) ^ (rot_a >> 22n)) & 0xFFFFFFFFn);
      const maj = ((f & g) | (h & (f | g))) >>> 0;
      e = (t1 + ep0 + maj) >>> 0;
    }
    {
      const rot_e = BigInt(a) * 0x100000001n;
      const rot_a = BigInt(e) * 0x100000001n;
      const ep1 = Number(((rot_e >> 6n) ^ (rot_e >> 11n) ^ (rot_e >> 25n)) & 0xFFFFFFFFn);
      const ch = (c ^ (a & (b ^ c))) >>> 0;
      const t1 = (d + ep1 + ch + constants[index + 4] + words[index + 4]) >>> 0;
      h = (h + t1) >>> 0;
      const ep0 = Number(((rot_a >> 2n) ^ (rot_a >> 13n) ^ (rot_a >> 22n)) & 0xFFFFFFFFn);
      const maj = ((e & f) | (g & (e | f))) >>> 0;
      d = (t1 + ep0 + maj) >>> 0;
    }
    {
      const rot_e = BigInt(h) * 0x100000001n;
      const rot_a = BigInt(d) * 0x100000001n;
      const ep1 = Number(((rot_e >> 6n) ^ (rot_e >> 11n) ^ (rot_e >> 25n)) & 0xFFFFFFFFn);
      const ch = (b ^ (h & (a ^ b))) >>> 0;
      const t1 = (c + ep1 + ch + constants[index + 5] + words[index + 5]) >>> 0;
      g = (g + t1) >>> 0;
      const ep0 = Number(((rot_a >> 2n) ^ (rot_a >> 13n) ^ (rot_a >> 22n)) & 0xFFFFFFFFn);
      const maj = ((d & e) | (f & (d | e))) >>> 0;
      c = (t1 + ep0 + maj) >>> 0;
    }
    {
      const rot_e = BigInt(g) * 0x100000001n;
      const rot_a = BigInt(c) * 0x100000001n;
      const ep1 = Number(((rot_e >> 6n) ^ (rot_e >> 11n) ^ (rot_e >> 25n)) & 0xFFFFFFFFn);
      const ch = (a ^ (g & (h ^ a))) >>> 0;
      const t1 = (b + ep1 + ch + constants[index + 6] + words[index + 6]) >>> 0;
      f = (f + t1) >>> 0;
      const ep0 = Number(((rot_a >> 2n) ^ (rot_a >> 13n) ^ (rot_a >> 22n)) & 0xFFFFFFFFn);
      const maj = ((c & d) | (e & (c | d))) >>> 0;
      b = (t1 + ep0 + maj) >>> 0;
    }
    {
      const rot_e = BigInt(f) * 0x100000001n;
      const rot_a = BigInt(b) * 0x100000001n;
      const ep1 = Number(((rot_e >> 6n) ^ (rot_e >> 11n) ^ (rot_e >> 25n)) & 0xFFFFFFFFn);
      const ch = (h ^ (f & (g ^ h))) >>> 0;
      const t1 = (a + ep1 + ch + constants[index + 7] + words[index + 7]) >>> 0;
      e = (e + t1) >>> 0;
      const ep0 = Number(((rot_a >> 2n) ^ (rot_a >> 13n) ^ (rot_a >> 22n)) & 0xFFFFFFFFn);
      const maj = ((b & c) | (d & (b | c))) >>> 0;
      a = (t1 + ep0 + maj) >>> 0;
    }
  }
  return [a, b, c, d, e, f, g, h];
}

function _expand_sha256_schedule(words: number[], first_word = 16): void {
  for (let index = first_word; index < 64; index++) {
    const x = words[index - 2];
    const y = words[index - 15];
    const s1 = _sigma1(x);
    const s0 = _sigma0(y);
    words.push((s1 + words[index - 7] + s0 + words[index - 16]) >>> 0);
  }
}

function _sha256_init(data: Buffer): number[] {
  const words = new Array(14).fill(0);
  const d0 = data.readUIntBE(0, 3);
  const d1 = data.readUInt32BE(3);
  words.push(d0);
  words.push(d1);

  for (let index = 16; index < 30; index++) {
    let value = _SHA256_SCHEDULE[index - 16];
    if (index - 2 >= 14) {
      value += index === 16 ? (_sigma1(words[index - 2]) ^ _SHA256_SIGMA1_ADJUSTMENT) >>> 0 : _sigma1(words[index - 2]);
    }
    if (index - 7 >= 14) {
      value += words[index - 7];
    }
    if (index - 15 >= 14) {
      value += index === 29 ? (_sigma0(words[index - 15]) ^ _SHA256_SIGMA0_ADJUSTMENT) >>> 0 : _sigma0(words[index - 15]);
    }
    words.push(value >>> 0);
  }

  words.push(
    (_sigma1(words[28]) + words[23] + _sigma0(words[15]) + words[14] + _SHA256_ADJUSTMENT - _SHA256_ROUND_CONSTANTS[14]) >>> 0
  );
  _expand_sha256_schedule(words, 31);
  const working = _sha256_rounds(_SHA256_STATE, words, 14);
  return _SHA256_INITIAL.map((x, i) => (x + working[i]) >>> 0);
}

function _sha256_digest(data: Buffer): Buffer {
  if (data.length < 7) throw new Error("Token salt must contain at least seven bytes");
  const length = 57 + data.length;
  const padLen = ((55 - length) % 64 + 64) % 64;
  const body = Buffer.concat([
    data.subarray(7),
    Buffer.from([0x80]),
    Buffer.alloc(padLen),
  ]);
  const lenBuf = Buffer.alloc(8);
  lenBuf.writeBigUInt64BE(BigInt(length * 8));
  const padded = Buffer.concat([body, lenBuf]);

  let state = _sha256_init(data.subarray(0, 7));
  for (let offset = 0; offset < padded.length; offset += 64) {
    const words: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      words.push(padded.readUInt32BE(offset + i));
    }
    _expand_sha256_schedule(words);
    const working = _sha256_rounds(state, words);
    state = state.map((x, i) => (x + working[i]) >>> 0);
  }

  const out = Buffer.alloc(32);
  for (let i = 0; i < 8; i++) {
    out.writeUInt32BE(state[i], i * 4);
  }
  return out;
}

function _cs64_digest(data: Buffer, digest: Buffer): [number, number] {
  const key_a = digest.readUInt32LE(0) | 1;
  const key_b = digest.readUInt32LE(4) | 1;
  const factors = [
    Number((BigInt(key_a >>> 0) * BigInt(_CS64_FACTOR)) & 0xFFFFFFFFn),
    Number((BigInt(key_b >>> 0) * BigInt(_CS64_FACTOR)) & 0xFFFFFFFFn),
  ];
  const terms = _CS64_COEFFICIENTS.map(([coef], idx) =>
    Number((BigInt(coef) * BigInt(factors[idx % 2])) & 0xFFFFFFFFn)
  );
  const offsets = _CS64_COEFFICIENTS.map(([, offset]) => offset);

  const dataWords = _words_le4_even(Buffer.concat([Buffer.from([0]), data]));
  for (let index = 0; index < dataWords.length; index++) {
    const word = dataWords[index];
    let term = Number((BigInt(word) * BigInt(index % 2 === 0 ? key_a : key_b)) & 0xFFFFFFFFn);
    let offset = Number((BigInt(_rol16(word)) * BigInt(index % 2 === 0 ? 0xEF0569FB : 0xC31713DB)) & 0xFFFFFFFFn);
    if (index === 0) {
      term = (term + Number((BigInt(_CS64_ADJUSTMENT0) * BigInt(factors[0])) & 0xFFFFFFFFn)) >>> 0;
      offset = (offset + _CS64_ADJUSTMENT1) >>> 0;
    }
    terms.push(term);
    offsets.push(offset);
  }

  let swap_acc = 0;
  let swap_last = 0;
  let state = 0;
  let acc = 0;

  for (let index = 0; index < terms.length; index += 2) {
    const x = terms[index];
    const y = terms[index + 1];

    const t1 = _rol16((offsets[index] + x) >>> 0);
    const q1 = Number((BigInt(t1) * 0x76F50F34n) & 0xFFFFFFFFn);
    swap_acc = (swap_acc + Number((BigInt(_rol16(q1)) * 0xC3EFEA97n + BigInt(q1)) & 0xFFFFFFFFn)) >>> 0;

    const t2 = _rol16((offsets[index + 1] + y) >>> 0);
    const q2 = Number((BigInt(t2) * 0x1881CE3Cn) & 0xFFFFFFFFn);
    swap_last = Number((BigInt(_rol16(q2)) * 0x35BD1EC9n + BigInt(q2)) & 0xFFFFFFFFn);
    swap_acc = (swap_acc + swap_last) >>> 0;

    state = Number((BigInt(state) * BigInt(key_a) + BigInt(x)) & 0xFFFFFFFFn);
    state = Number((BigInt(_rol16(state)) * 0xCF98B111n) & 0xFFFFFFFFn);
    state = Number((BigInt(_rol16(state)) * 0x87085B9Fn) & 0xFFFFFFFFn);
    state = Number((BigInt(_rol16(state)) * 0x12CEB96Dn) & 0xFFFFFFFFn);
    state = Number((BigInt(_rol16(state)) * 0x257E1D83n) & 0xFFFFFFFFn);
    acc = (acc + state) >>> 0;

    const t3 = Number((BigInt(state) * BigInt(key_b) + BigInt(y)) & 0xFFFFFFFFn);
    const t4 = Number((BigInt(_rol16(t3)) * 0xA27416F5n) & 0xFFFFFFFFn);
    const t5 = Number((BigInt(_rol16(t4)) * 0xD38396FFn) & 0xFFFFFFFFn);
    state = Number((BigInt(_rol16((Number((BigInt(_rol16(t5)) * 0x7C932B89n) & 0xFFFFFFFFn)))) * 0xBFA49F69n) & 0xFFFFFFFFn);
    acc = (acc + state) >>> 0;
  }

  return [
    (swap_last ^ state) >>> 0,
    (swap_acc ^ acc) >>> 0,
  ];
}

export function generateSecMsGecV2(unixTimestamp: number | null = null): string {
  let ticks = unixTimestamp !== null ? unixTimestamp : (Date.now() / 1000);
  ticks += WIN_EPOCH;
  ticks -= ticks % 300;
  const ticksBig = BigInt(Math.floor(ticks)) * 10000000n;
  const strToHash = Buffer.from(`${ticksBig}${TRUSTED_CLIENT_TOKEN}`, "ascii");
  const digest = _sha256_digest(strToHash);
  const [cs0, cs1] = _cs64_digest(strToHash, digest);

  const csBuf = Buffer.alloc(8);
  csBuf.writeUInt32LE(cs0, 0);
  csBuf.writeUInt32LE(cs1, 4);

  const cs64Hex = csBuf.toString("hex").toUpperCase();
  const sha256Hex = digest.toString("hex").toUpperCase();
  return `${cs64Hex}-${sha256Hex}`;
}

export function formatPitch(val?: string | number): string {
  if (!val) return "+0Hz";
  if (typeof val === "string" && (val.endsWith("%") || val.endsWith("Hz"))) {
    return val.startsWith("+") || val.startsWith("-") ? val : `+${val}`;
  }
  const num = Number(val);
  if (!Number.isFinite(num)) return "+0Hz";
  if (num >= 0.4 && num <= 2.5) {
    const percent = Math.round((num - 1) * 100);
    return percent >= 0 ? `+${percent}%` : `${percent}%`;
  }
  return num >= 0 ? `+${num}Hz` : `${num}Hz`;
}

export function formatRate(val?: string | number): string {
  if (!val) return "+0%";
  if (typeof val === "string" && val.endsWith("%")) {
    return val.startsWith("+") || val.startsWith("-") ? val : `+${val}`;
  }
  const num = Number(val);
  if (!Number.isFinite(num)) return "+0%";
  if (num >= 0.4 && num <= 2.5) {
    const percent = Math.round((num - 1) * 100);
    return percent >= 0 ? `+${percent}%` : `${percent}%`;
  }
  return num >= 0 ? `+${num}%` : `${num}%`;
}

export function synthesizeEdgeTTS(params: {
  text: string;
  voice?: string;
  rate?: string | number;
  pitch?: string | number;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { text } = params;
    const voice = params.voice || "es-MX-DaliaNeural";
    const rate = formatRate(params.rate);
    const pitch = formatPitch(params.pitch);

    const secMsGec = generateSecMsGecV2();
    const connectId = crypto.randomUUID().replace(/-/g, "");
    const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectId}`;

    const ws = new WebSocket(url, {
      headers: {
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
        "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "es-ES,es;q=0.9",
        "Cookie": `muid=${crypto.randomBytes(16).toString("hex").toUpperCase()};`,
      },
    });

    const chunks: Buffer[] = [];
    const reqId = crypto.randomBytes(16).toString("hex");
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        try { ws.close(); } catch {}
        reject(new Error("Edge TTS timeout"));
      }
    }, 12000);

    ws.on("open", () => {
      const configMsg = "Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n" +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: { sentenceBoundaryEnabled: "false", wordBoundaryEnabled: "false" },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3",
              },
            },
          },
        });
      ws.send(configMsg);

      const lang = voice.split("-").slice(0, 2).join("-");
      const safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">` +
        `<voice name="${voice}">` +
        `<prosody pitch="${pitch}" rate="${rate}" volume="+0%">` +
        safeText +
        "</prosody></voice></speak>";
      const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMsg);
    });

    ws.on("message", (data: WebSocket.RawData, isBinary: boolean) => {
      if (isBinary) {
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
        if (buf.length > 2) {
          const headerLen = buf.readUInt16BE(0);
          const audio = buf.subarray(2 + headerLen);
          if (audio.length > 0) {
            chunks.push(audio);
          }
        }
      } else {
        const textMsg = data.toString();
        if (textMsg.includes("Path:turn.end")) {
          clearTimeout(timer);
          finished = true;
          try { ws.close(); } catch {}
          resolve(Buffer.concat(chunks));
        }
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timer);
      if (!finished) {
        finished = true;
        reject(err);
      }
    });

    ws.on("close", () => {
      clearTimeout(timer);
      if (!finished) {
        finished = true;
        if (chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error("Connection closed without audio"));
        }
      }
    });
  });
}
