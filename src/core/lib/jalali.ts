function div(a: number, b: number) { return Math.trunc(a / b); }
function mod(a: number, b: number) { return a - Math.trunc(a / b) * b; }

function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  let jm = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) throw new Error("Jalali year is outside the supported range.");
  for (let index = 1; index < breaks.length; index += 1) {
    jm = breaks[index];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let result = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  result = result - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return result;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number) {
  const calendar = jalCal(jy);
  return g2d(calendar.gy, 3, calendar.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number) {
  const gregorian = d2g(jdn);
  let jy = gregorian.gy - 621;
  const calendar = jalCal(jy);
  const firstFarvardin = g2d(gregorian.gy, 3, calendar.march);
  let k = jdn - firstFarvardin;
  if (k >= 0 && k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
  if (k >= 0) k -= 186;
  else {
    jy -= 1;
    k += 179;
    if (calendar.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number) {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd) || jm < 1 || jm > 12 || jd < 1 || jd > 31 || (jm > 6 && jd > 30)) {
    throw new Error("Invalid Jalali date.");
  }
  const result = d2g(j2d(jy, jm, jd));
  const roundTrip = d2j(g2d(result.gy, result.gm, result.gd));
  if (roundTrip.jy !== jy || roundTrip.jm !== jm || roundTrip.jd !== jd) throw new Error("Invalid Jalali date.");
  return result;
}

export function gregorianToJalali(gy: number, gm: number, gd: number) {
  return d2j(g2d(gy, gm, gd));
}

export function normalizeDateDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function parseJalaliDate(value: string) {
  const match = normalizeDateDigits(value).trim().match(/^(\d{3,4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (!match) return null;
  try {
    return jalaliToGregorian(Number(match[1]), Number(match[2]), Number(match[3]));
  } catch {
    return null;
  }
}
