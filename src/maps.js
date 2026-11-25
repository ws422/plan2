// ======================================================================
// maps.js · 지도 그리기
// 새 여행 2단계 지도(drawRegion), 계획의 지도 탭(drawDay), 걷기 추천 지도(drawWalk)
// 바다·강·지하철 모양 데이터는 data.js 의 GEO 에 있어요.
// 고치는 법: docs/수정가이드.md
// ======================================================================
const C0 = { lat: 33.592, lng: 130.403 };
const REGION_BASE = { x: -400, y: -262, w: 720, h: 468 };
// 시내는 크게·외곽은 작게 보이는 지도 좌표 변환
function fish(lat, lng) {
  const x = (lng - C0.lng) * KX,
    y = (C0.lat - lat) * KY,
    r = Math.hypot(x, y);
  if (r < 1e-6) return [0, 0];
  const f = (Math.log(1 + r / 0.8) / r) * 100;
  return [x * f, y * f];
}
const f1 = v => Math.round(v * 10) / 10;
// 부드러운 곡선 만들기
function smoothSeg(ps, closed) {
  const n = ps.length,
    get = i => (closed ? ps[(i + n) % n] : ps[Math.max(0, Math.min(n - 1, i))]);
  let d = '';
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1),
      p1 = get(i),
      p2 = get(i + 1),
      p3 = get(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d;
}
// 좌표 목록 → 곡선
function pathOf(ps, closed) {
  return `M${f1(ps[0][0])},${f1(ps[0][1])}` + smoothSeg(ps, closed) + (closed ? 'Z' : '');
}
// 바다·섬·공원·강·철도·지하철 그리기
function geoSVG(P, k, o = {}) {
  const pr = arr => arr.map(([la, ln]) => P(la, ln));
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  let h =
    '<defs><radialGradient id="hillg"><stop offset="0" class="hill-a"/><stop offset="1" class="hill-b"/></radialGradient></defs>';
  GEO.hills.forEach(([la, ln, r]) => {
    const c = P(la, ln),
      rr = d2(c, P(la + r, ln));
    h += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(rr)}" fill="url(#hillg)"/>`;
  });
  const sea = GEO.sea,
    corners = [sea[0], ...sea.slice(-2)],
    coast = pr(sea.slice(1, -2));
  const c0 = P(...corners[0]),
    cA = P(...corners[1]),
    cB = P(...corners[2]);
  const mid = (a, b) => P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  h += `<path class="sea" d="M${f1(c0[0])},${f1(c0[1])}L${f1(coast[0][0])},${f1(coast[0][1])}${smoothSeg(coast, false)}L${f1(cA[0])},${f1(cA[1])}L${mid(corners[1], corners[2]).map(f1).join(',')}L${f1(cB[0])},${f1(cB[1])}L${mid(corners[2], corners[0]).map(f1).join(',')}Z"/>`;
  h += `<path class="coast" d="M${f1(coast[0][0])},${f1(coast[0][1])}${smoothSeg(coast, false)}"/>`;
  GEO.islands.forEach(isl => {
    h += `<path class="land isl" d="${pathOf(pr(isl), true)}"/>`;
  });
  GEO.parks.forEach(([la, ln, rla, rln]) => {
    const c = P(la, ln);
    h += `<ellipse class="park" cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(d2(c, P(la, ln + rln)))}" ry="${f1(d2(c, P(la + rla, ln)))}"/>`;
  });
  GEO.ponds.forEach(([la, ln, rla, rln]) => {
    const c = P(la, ln);
    h += `<ellipse class="sea" cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(d2(c, P(la, ln + rln)))}" ry="${f1(d2(c, P(la + rla, ln)))}"/>`;
  });
  GEO.rivers.forEach(rv => {
    h += `<path class="river" style="stroke-width:${f1(o.riverW || 2.5 * k)}" d="${pathOf(pr(rv), false)}"/>`;
  });
  GEO.rails.forEach(r => {
    h += `<path class="rail" style="stroke-width:${f1(1.6 * k)};stroke-dasharray:${f1(5 * k)} ${f1(4 * k)}" d="M${pr(
      r.pts
    )
      .map(p => p.map(f1).join(','))
      .join('L')}"/>`;
  });
  Object.values(LINES).forEach(L => {
    h += `<path class="sline" style="stroke:${L.color};stroke-width:${f1((o.lineW || 2.4) * k)}" d="M${L.st.map(s => P(STATIONS[s].lat, STATIONS[s].lng).map(f1).join(',')).join('L')}"/>`;
  });
  if (o.stations) {
    Object.values(STATIONS).forEach(s => {
      const p = P(s.lat, s.lng);
      h += `<g transform="translate(${f1(p[0])},${f1(p[1])}) scale(${k})"><circle class="st" r="3.2"/><text class="st-t" x="6" y="-5">${s.n}</text></g>`;
    });
  }
  if (o.labels)
    GEO.labels.forEach(l => {
      const p = P(l.lat, l.lng);
      h += `<text class="sea-t" x="${f1(p[0])}" y="${f1(p[1])}" style="font-size:${f1(13 * k)}px">${l.t}</text>`;
    });
  return h;
}
// 화면에 있는 지도 모두 그리기
function drawMaps() {
  if (HPV && (!S.sheet || S.sheet !== HPV.sh)) hpVecDrop();
  const r = document.getElementById('rmap');
  if (r) drawRegion(r, r.classList.contains('deco'));
  const d = document.getElementById('dmap');
  if (d) drawDay(d);
  const w = document.getElementById('wmap');
  if (w) drawWalk(w);
  const hm = document.getElementById('hpmap');
  if (hm) drawHpMap(hm);
}
// ★ 새 여행 2단계 지도 (동네 동그라미 + 내 숙소 핀)
// 글자 폭 재기 (1px 글꼴 기준 폭을 기억해 둬요. 못 재면 대충 계산)
const TEXT_EM = new Map();
function textEm(t) {
  t = String(t);
  if (TEXT_EM.has(t)) return TEXT_EM.get(t);
  let w = 0;
  try {
    const c = (textEm.c = textEm.c || document.createElement('canvas').getContext('2d'));
    c.font = `800 100px ${getComputedStyle(document.body).fontFamily}`;
    w = c.measureText(t).width / 100;
  } catch (e) {}
  if (!(w > 0)) for (const ch of t) w += /[　-鿿가-힯＀-￯]/.test(ch) ? 1 : /[·・\s]/.test(ch) ? 0.45 : 0.62;
  TEXT_EM.set(t, w);
  return w;
}
// 이름표 자리 정하기: 아래 → 위 → 오른쪽 → 왼쪽 → 대각선 순으로, 아무것과도 안 겹치는 첫 자리
function placeLabels(items, obstacles, bounds) {
  const boxes = obstacles.slice(),
    hit = (a, b) => !(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0),
    over = (a, b) =>
      hit(a, b) ? (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * (Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)) : 0;
  const pad = items.length ? items[0].hgt * 0.12 : 0;
  const tryAt = (it, w) => {
    const { x, y, r, hgt, gap } = it;
    const cands = [
      { ax: 'middle', tx: x, ty: y + r + gap + hgt * 0.8 },
      { ax: 'middle', tx: x, ty: y - r - gap - hgt * 0.2 },
      { ax: 'start', tx: x + r + gap, ty: y + hgt * 0.32 },
      { ax: 'end', tx: x - r - gap, ty: y + hgt * 0.32 },
      { ax: 'start', tx: x + r * 0.7, ty: y + r + gap + hgt * 0.7 },
      { ax: 'end', tx: x - r * 0.7, ty: y + r + gap + hgt * 0.7 },
      { ax: 'start', tx: x + r * 0.7, ty: y - r - gap },
      { ax: 'end', tx: x - r * 0.7, ty: y - r - gap }
    ];
    let best = null;
    for (const c of cands) {
      const x0 = c.ax === 'middle' ? c.tx - w / 2 : c.ax === 'start' ? c.tx : c.tx - w;
      const b = { x0: x0 - pad, x1: x0 + w + pad, y0: c.ty - hgt * 0.8 - pad, y1: c.ty + hgt * 0.2 + pad };
      let cost = boxes.reduce((t, o) => t + over(b, o), 0);
      if (bounds && (b.x0 < bounds.x0 || b.x1 > bounds.x1 || b.y0 < bounds.y0 || b.y1 > bounds.y1))
        cost += w * hgt * 0.5;
      if (!best || cost < best.cost - 1e-6) best = { ...c, b, cost };
      if (cost === 0) break;
    }
    return best;
  };
  items.forEach(it => {
    let best = tryAt(it, it.w);
    // 자리가 모자라면 짧은 이름(· 앞부분)으로 한 번 더
    if (best.cost > 0 && it.w2) {
      const b2 = tryAt(it, it.w2);
      if (b2.cost < best.cost) ((best = b2), (it.short = true));
    }
    it.at = best;
    boxes.push(best.b);
  });
}
// 좁을 때 쓰는 짧은 동네 이름: '오호리공원·성터' → '오호리공원'
function shortArea(n) {
  const i = String(n).search(/[·・]/);
  return i > 1 ? String(n).slice(0, i) : String(n);
}
function drawRegion(el, deco) {
  if (!deco && rgMode() === 'vector') return rgVector(el);
  el.classList.remove('vector');
  const W = el.clientWidth,
    H = el.clientHeight;
  if (!W || !H) return;
  const B = REGION_BASE,
    s = Math.min(W / B.w, H / B.h);
  const base = { w: W / s, h: H / s };
  base.x = B.x + B.w / 2 - base.w / 2;
  base.y = B.y + B.h / 2 - base.h / 2;
  if (!deco) S.mvBase = base;
  const mv = !deco && S.mv ? S.mv : base;
  const k = mv.w / W;
  const sel = deco ? [] : S.draft.areas;
  let h = geoSVG(fish, k, { labels: true, lineW: 2 });
  SPOTS.forEach(sp => {
    if (AREA[sp.a].kind === 'trip') return;
    const p = fish(sp.lat, sp.lng);
    h += `<circle class="sdot${sel.includes(sp.a) ? ' on' : ''}" cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(2.6 * k)}"/>`;
  });
  const areas = AREAS.filter(a => a.kind !== 'trip'),
    sc = deco ? k * 0.85 : k,
    R = (deco ? 9 : 13) * sc,
    FS = 13 * sc;
  // 숙소 핀 (이름표 자리 잡을 때 피해 가야 해요)
  const hp = deco ? [] : draftHotelPinData(),
    obstacles = [],
    items = [];
  areas.forEach(a => {
    const p = fish(a.lat, a.lng);
    obstacles.push({
      x0: p[0] - R - 1.5 * sc,
      x1: p[0] + R + 1.5 * sc,
      y0: p[1] - R - 1.5 * sc,
      y1: p[1] + R + 1.5 * sc
    });
    const nm = L(a.n, AREA_JA[a.id] || a.n),
      sn = shortArea(nm);
    items.push({
      kind: 'a',
      a,
      nm,
      x: p[0],
      y: p[1],
      r: R,
      sn,
      w2: sn !== nm ? textEm(sn) * FS + 5 * sc : 0,
      w: textEm(nm) * FS + 5 * sc,
      hgt: FS * 1.25,
      gap: 4 * sc,
      on: sel.includes(a.id)
    });
  });
  hp.forEach(g => {
    const p = fish(g.pt.lat, g.pt.lng);
    g.p = p;
    obstacles.push({ x0: p[0] - 12 * k, x1: p[0] + 12 * k, y0: p[1] - 31 * k, y1: p[1] + 2 * k });
  });
  // 숙소 이름표 먼저, 그다음 고른 동네, 나머지 순서
  const hItems = hp.map(g => ({
    kind: 'h',
    g,
    x: g.p[0],
    y: g.p[1] - 19 * k,
    r: 13 * k,
    w: textEm(g.lab) * 12.5 * k + 5 * k,
    hgt: 12.5 * k * 1.25,
    gap: 3 * k
  }));
  const order = [...hItems, ...items.filter(i => i.on), ...items.filter(i => !i.on)];
  const bounds = { x0: mv.x + 2 * k, x1: mv.x + mv.w - 2 * k, y0: mv.y + 2 * k, y1: mv.y + mv.h - 2 * k };
  placeLabels(order, obstacles, bounds);
  items.forEach(it => {
    const a = it.a,
      [x, y] = [it.x, it.y],
      t = it.at,
      lab = `<text class="apin-t" x="${f1((t.tx - x) / sc)}" y="${f1((t.ty - y) / sc)}" style="text-anchor:${t.ax}">${esc(it.short ? it.sn : it.nm)}</text>`;
    h += deco
      ? `<g class="apin deco" transform="translate(${f1(x)},${f1(y)}) scale(${f1(sc)})"><circle r="9" class="apin-c"/>${lab}</g>`
      : `<g class="apin${it.on ? ' on' : ''}" data-act="toggleArea" data-id="${a.id}" tabindex="0" role="button" aria-pressed="${it.on}" aria-label="${a.n}" transform="translate(${f1(x)},${f1(y)}) scale(${f1(sc)})"><circle r="21" class="apin-hit"/><circle r="13" class="apin-c"/>${it.on ? '<path class="apin-k" d="M-5.4 0l3.6 3.6 7.2-8"/>' : '<circle r="3.6" class="apin-d"/>'}${lab}</g>`;
  });
  hItems.forEach(it => {
    const g = it.g,
      [x, y] = g.p,
      t = it.at;
    h += `<g class="hpin" transform="translate(${f1(x)},${f1(y)}) scale(${f1(k)})" aria-hidden="true">
      <path class="hpin-b" d="M0 0C-4 -7 -12 -11 -12 -19a12 12 0 1 1 24 0c0 8 -8 12 -12 19z"/>
      <svg x="-7.5" y="-26.5" width="15" height="15" viewBox="0 0 24 24" class="hpin-ic">${ICON.home}</svg>
      <text class="hpin-t" x="${f1((t.tx - x) / k)}" y="${f1((t.ty - y) / k)}" style="text-anchor:${t.ax}">${esc(g.lab)}</text></g>`;
  });
  el.innerHTML = `<svg viewBox="${f1(mv.x)} ${f1(mv.y)} ${f1(mv.w)} ${f1(mv.h)}" role="img" aria-label="후쿠오카 안내 지도"${deco ? '' : ' class="pan"'}>${h}</svg>`;
  if (!deco) enablePan(el.querySelector('svg'), W);
}
// 새 여행 2단계 지도: 1단계에서 고른 숙소 자리에 핀 (같은 자리면 하나로 합쳐요)
function draftHotelStays() {
  const D = S.draft;
  if (!D || !D.start || !D.end) return [];
  return normStays(D.stays, draftNights(), D.hotel);
}
// ======================================================================
// ★ '가고 싶은 곳' 진짜 지도 (MapLibre). 동그라미·이름표·숙소 핀은 앱이 직접 위에 그려요.
//    화면 밖 동네(다자이후·이토시마 등)는 가장자리 이름표로 보여 줘요. 못 불러오면 안내 지도로.
// ======================================================================
let RGV = null,
  RGV_FAIL = false;
function rgMode() {
  return RGV_FAIL || navigator.onLine === false ? 'svg' : 'vector';
}
function rgLive() {
  const r = document.getElementById('rmap');
  return !!(RGV && RGV.map && RGV.loaded && r && r.contains(RGV.box));
}
function rgDrop() {
  if (!RGV) return;
  try {
    if (RGV.map) RGV.map.remove();
  } catch (_) {}
  RGV = null;
}
function rgFail() {
  if (RGV_FAIL) return;
  RGV_FAIL = true;
  rgDrop();
  dmDrop();
  render();
}
function rgVector(el) {
  const key = `${hpDark() ? 'd' : 'l'}${LANG}`;
  if (RGV && RGV.key !== key) rgDrop();
  if (!RGV) {
    const box = document.createElement('div'),
      gl = document.createElement('div'),
      ov = document.createElement('div');
    box.className = 'rg-vmap';
    gl.className = 'rg-gl';
    ov.className = 'rg-ov';
    box.append(gl, ov);
    RGV = { key, box, gl, ov, map: null };
    loadMapLibre().then(rgInit).catch(rgFail);
  }
  el.classList.add('vector');
  if (RGV.box.parentNode !== el) {
    el.innerHTML = '';
    el.appendChild(RGV.box);
  }
  if (RGV.map) RGV.map.resize();
  rgOverlay();
}
function rgInit(gl) {
  const R = RGV;
  if (!R || R.map) return;
  const city = AREAS.filter(a => a.kind === 'city'),
    lats = city.map(a => a.lat),
    lngs = city.map(a => a.lng);
  let map;
  try {
    map = new gl.Map({
      container: R.gl,
      style: HP_STYLE,
      bounds: [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      ],
      fitBoundsOptions: { padding: { top: 46, bottom: 40, left: 64, right: 64 }, maxZoom: 14 },
      minZoom: 8.5,
      maxZoom: 17,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: { compact: true },
      fadeDuration: 0
    });
  } catch (e) {
    rgFail();
    return;
  }
  map.touchZoomRotate.disableRotation();
  R.map = map;
  R.fit = () => {
    const pad = { top: 46, bottom: 40, left: 80, right: 56 },
      b = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      ];
    map.resize();
    const cam = map.cameraForBounds(b, { padding: pad, maxZoom: 14 });
    if (!cam) return;
    // 너무 멀리 빼면 시내 동그라미가 뭉쳐요 → 조금만 더 뺄 수 있게
    map.setMinZoom(Math.max(8.5, cam.zoom - 0.5));
    const all = AREAS.filter(a => a.kind !== 'trip');
    map.setMaxBounds([
      [Math.min(...all.map(a => a.lng)) - 0.12, Math.min(...all.map(a => a.lat)) - 0.1],
      [Math.max(...all.map(a => a.lng)) + 0.12, Math.max(...all.map(a => a.lat)) + 0.1]
    ]);
    map.jumpTo(cam);
  };
  map.on('load', () => {
    if (RGV !== R) return;
    R.loaded = true;
    R.fit();
    try {
      hpVecStyle(map);
      hpVecOverlay(map);
      // 역 이름은 많이 확대했을 때만 (동네 이름이 먼저 보이게)
      if (map.getLayer('fk-st-label')) map.setLayerZoomRange('fk-st-label', 14.5, 24);
    } catch (e) {
      console.warn('region style', e);
    }
    rgOverlay();
  });
  setTimeout(() => {
    if (RGV === R && !R.loaded) rgFail();
  }, 10000);
  map.on('move', rgOverlay);
  map.on('resize', rgOverlay);
}
// 지도 위 그림 (화면 픽셀 기준으로 매번 새로 그려요)
function rgOverlay() {
  const R = RGV;
  if (!R || !R.map || !S.draft) return;
  const map = R.map,
    W = R.box.clientWidth,
    H = R.box.clientHeight;
  if (!W || !H) return;
  const sel = S.draft.areas || [],
    Rr = 13,
    FS = 13,
    M = 6,
    obstacles = [],
    items = [],
    chips = [];
  // 동네: 화면 안이면 동그라미, 밖이면 가장자리 이름표
  AREAS.filter(a => a.kind !== 'trip').forEach(a => {
    const p = map.project([a.lng, a.lat]),
      on = sel.includes(a.id),
      nm = L(a.n, AREA_JA[a.id] || a.n);
    if (p.x >= Rr && p.x <= W - Rr && p.y >= Rr && p.y <= H - Rr) {
      const sn = shortArea(nm);
      obstacles.push({ x0: p.x - Rr - 1.5, x1: p.x + Rr + 1.5, y0: p.y - Rr - 1.5, y1: p.y + Rr + 1.5 });
      items.push({
        a,
        nm,
        sn,
        on,
        x: p.x,
        y: p.y,
        r: Rr,
        w: textEm(nm) * FS + 5,
        w2: sn !== nm ? textEm(sn) * FS + 5 : 0,
        hgt: FS * 1.25,
        gap: 4
      });
    } else chips.push({ a, nm, on, p, w: textEm(nm) * 12 + 34, h: 26 });
  });
  // 가장자리 이름표: 지도 가운데에서 그 동네 쪽으로 쭉 간 자리의 테두리에
  const cx = W / 2,
    cy = H / 2;
  chips.forEach(c => {
    const dx = c.p.x - cx,
      dy = c.p.y - cy,
      hw = W / 2 - M - c.w / 2,
      hh = H / 2 - M - c.h / 2,
      t = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : 1e9, Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : 1e9);
    c.x = cx + dx * t;
    c.y = cy + dy * t;
    c.ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    c.side = Math.abs(c.x - cx) >= hw - 0.5 ? (c.x < cx ? 'L' : 'R') : c.y < cy ? 'T' : 'B';
  });
  // 같은 테두리끼리 겹치지 않게 줄 세우기 (오른쪽 위 확대 버튼 자리는 비워요)
  const spread = (list, pos, size, lo, hi) => {
    list.sort((a, b) => a[pos] - b[pos]);
    for (let i = 0; i < list.length; i++) {
      const c = list[i],
        min = i ? list[i - 1][pos] + (list[i - 1][size] + c[size]) / 2 + 4 : lo + c[size] / 2;
      c[pos] = Math.max(c[pos], min);
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const c = list[i],
        max = i < list.length - 1 ? list[i + 1][pos] - (list[i + 1][size] + c[size]) / 2 - 4 : hi - c[size] / 2;
      c[pos] = Math.min(c[pos], max);
    }
  };
  spread(
    chips.filter(c => c.side === 'L'),
    'y',
    'h',
    M,
    H - M
  );
  spread(
    chips.filter(c => c.side === 'R'),
    'y',
    'h',
    100,
    H - M
  );
  spread(
    chips.filter(c => c.side === 'T'),
    'x',
    'w',
    M,
    W - 60
  );
  spread(
    chips.filter(c => c.side === 'B'),
    'x',
    'w',
    M,
    W - M
  );
  chips.forEach(c => {
    c.x = clamp(c.x, M + c.w / 2, W - M - c.w / 2);
    c.y = clamp(c.y, M + c.h / 2, H - M - c.h / 2);
  });
  // 이름표가 동그라미를 가리면 테두리를 따라 조금 옮겨요
  const cbox = (c, x, y) => ({ x0: x - c.w / 2 - 2, x1: x + c.w / 2 + 2, y0: y - c.h / 2 - 2, y1: y + c.h / 2 + 2 }),
    clash = (b, list) => list.some(o => !(b.x1 <= o.x0 || o.x1 <= b.x0 || b.y1 <= o.y0 || o.y1 <= b.y0));
  const circles = obstacles.slice(),
    done = [];
  chips.forEach(c => {
    const vert = c.side === 'L' || c.side === 'R',
      step = vert ? c.h + 4 : c.w / 2 + 4;
    for (const k of [0, 1, -1, 2, -2, 3, -3]) {
      const x = vert ? c.x : clamp(c.x + k * step, M + c.w / 2, W - M - c.w / 2),
        y = vert ? clamp(c.y + k * step, (c.side === 'R' ? 100 : M) + c.h / 2, H - M - c.h / 2) : c.y,
        b = cbox(c, x, y);
      if (!clash(b, circles) && !clash(b, done)) {
        c.x = x;
        c.y = y;
        break;
      }
    }
    done.push(cbox(c, c.x, c.y));
  });
  chips.forEach(c =>
    obstacles.push({ x0: c.x - c.w / 2 - 2, x1: c.x + c.w / 2 + 2, y0: c.y - c.h / 2 - 2, y1: c.y + c.h / 2 + 2 })
  );
  // 숙소 핀
  const hp = draftHotelPinData()
    .map(g => {
      const p = map.project([g.pt.lng, g.pt.lat]);
      return { ...g, x: p.x, y: p.y };
    })
    .filter(g => g.x > 8 && g.x < W - 8 && g.y > 26 && g.y < H + 2);
  hp.forEach(g => obstacles.push({ x0: g.x - 12, x1: g.x + 12, y0: g.y - 31, y1: g.y + 2 }));
  // 지도 오른쪽 위 확대 버튼 자리도 피해요
  obstacles.push({ x0: W - 54, x1: W, y0: 0, y1: 96 });
  const hItems = hp.map(g => ({
    g,
    x: g.x,
    y: g.y - 19,
    r: 13,
    w: textEm(g.lab) * 12.5 + 5,
    hgt: 12.5 * 1.25,
    gap: 3
  }));
  placeLabels([...hItems, ...items.filter(i => i.on), ...items.filter(i => !i.on)], obstacles, {
    x0: 2,
    x1: W - 2,
    y0: 2,
    y1: H - 2
  });
  let h = '';
  items.forEach(it => {
    const t = it.at,
      a = it.a;
    h += `<g class="apin${it.on ? ' on' : ''}" data-act="toggleArea" data-id="${a.id}" tabindex="0" role="button" aria-pressed="${it.on}" aria-label="${esc(it.nm)}" transform="translate(${f1(it.x)},${f1(it.y)})"><circle r="21" class="apin-hit"/><circle r="13" class="apin-c"/>${it.on ? '<path class="apin-k" d="M-5.4 0l3.6 3.6 7.2-8"/>' : '<circle r="3.6" class="apin-d"/>'}<text class="apin-t" x="${f1(t.tx - it.x)}" y="${f1(t.ty - it.y)}" style="text-anchor:${t.ax}">${esc(it.short ? it.sn : it.nm)}</text></g>`;
  });
  chips.forEach(c => {
    // 화살표는 이름표 안쪽 끝에, 동네 방향으로
    const ax = c.w / 2 - 13;
    h += `<g class="rg-chip${c.on ? ' on' : ''}" data-act="toggleArea" data-id="${c.a.id}" tabindex="0" role="button" aria-pressed="${c.on}" aria-label="${esc(c.nm)}" transform="translate(${f1(c.x)},${f1(c.y)})">
      <rect x="${f1(-c.w / 2)}" y="${f1(-c.h / 2)}" width="${f1(c.w)}" height="${c.h}" rx="${c.h / 2}"/>
      <text x="${f1(-c.w / 2 + 11)}" y="4.3">${esc(c.nm)}</text>
      <g transform="translate(${f1(ax)},0) rotate(${f1(c.ang)})"><path class="rg-ar" d="M-4.5 0H4.5M0.5 -4L4.5 0L0.5 4"/></g></g>`;
  });
  hItems.forEach(it => {
    const g = it.g,
      t = it.at;
    h += `<g class="hpin" transform="translate(${f1(g.x)},${f1(g.y)})" aria-hidden="true">
      <path class="hpin-b" d="M0 0C-4 -7 -12 -11 -12 -19a12 12 0 1 1 24 0c0 8 -8 12 -12 19z"/>
      <svg x="-7.5" y="-26.5" width="15" height="15" viewBox="0 0 24 24" class="hpin-ic">${ICON.home}</svg>
      <text class="hpin-t" x="${f1(t.tx - g.x)}" y="${f1(t.ty - g.y)}" style="text-anchor:${t.ax}">${esc(g.lab)}</text></g>`;
  });
  R.ov.innerHTML = `<svg class="rg-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${h}</svg>`;
}
// 2단계 지도의 숙소 핀 (같은 자리면 하나로 합쳐요)
function draftHotelPinData() {
  const st = draftHotelStays();
  if (!st.length) return [];
  const multi = st.length > 1,
    groups = new Map();
  st.forEach((x, i) => {
    const pt = hotelPt(x.h),
      key = `${pt.lat.toFixed(4)},${pt.lng.toFixed(4)}`;
    if (!groups.has(key)) groups.set(key, { pt, n: [] });
    groups.get(key).n.push(i + 1);
  });
  return [...groups.values()].map(g => ({
    ...g,
    lab: multi ? L(`숙소 ${g.n.join('·')}`, `宿${g.n.join('・')}`) : L('내 숙소', '宿')
  }));
}
// 확대한 지도 손가락으로 끌기
function enablePan(svg, W) {
  let st = null;
  svg.addEventListener('pointerdown', e => {
    if (!S.mv) return;
    st = { x: e.clientX, y: e.clientY, mv: { ...S.mv }, moved: false };
  });
  svg.addEventListener('pointermove', e => {
    if (!st) return;
    const dx = e.clientX - st.x,
      dy = e.clientY - st.y;
    if (!st.moved && Math.hypot(dx, dy) < 5) return;
    if (!st.moved) {
      st.moved = true;
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    const k = st.mv.w / W,
      b = S.mvBase;
    const x = clamp(st.mv.x - dx * k, b.x - b.w * 0.2, b.x + b.w * 1.2 - st.mv.w),
      y = clamp(st.mv.y - dy * k, b.y - b.h * 0.2, b.y + b.h * 1.2 - st.mv.h);
    S.mv = { ...st.mv, x, y };
    svg.setAttribute('viewBox', `${f1(x)} ${f1(y)} ${f1(st.mv.w)} ${f1(st.mv.h)}`);
  });
  const end = e => {
    if (st && st.moved) {
      svg.addEventListener('click', ev => ev.stopPropagation(), { capture: true, once: true });
    }
    st = null;
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', () => {
    st = null;
  });
}
// 일반 지도 좌표 변환 (일차 지도용)
function linear(ptsIn, W, H, pad, minKm = 1.2) {
  let la0 = Infinity,
    la1 = -Infinity,
    ln0 = Infinity,
    ln1 = -Infinity;
  ptsIn.forEach(p => {
    la0 = Math.min(la0, p.lat);
    la1 = Math.max(la1, p.lat);
    ln0 = Math.min(ln0, p.lng);
    ln1 = Math.max(ln1, p.lng);
  });
  let sx = (ln1 - ln0) * KX,
    sy = (la1 - la0) * KY;
  const cx = (ln0 + ln1) / 2,
    cy = (la0 + la1) / 2;
  sx = Math.max(sx, minKm);
  sy = Math.max(sy, minKm * 0.6);
  const s = Math.min((W - pad * 2) / sx, (H - pad * 2) / sy);
  const P = (lat, lng) => [W / 2 + (lng - cx) * KX * s, H / 2 - (lat - cy) * KY * s];
  return { P, s };
}
const SEG_STYLE = {
  walk: 'stroke-dasharray:0.1 7;stroke-linecap:round;stroke-width:4.5',
  subway: 'stroke-width:4.5',
  bus: 'stroke-width:4;stroke-dasharray:10 5',
  taxi: 'stroke-width:3.5;stroke-dasharray:4 4',
  car: 'stroke-width:3.5;stroke-dasharray:4 4',
  train: 'stroke-width:4.5;stroke-dasharray:14 4',
  ferry: 'stroke-width:4;stroke-dasharray:2 6;stroke-linecap:round',
  none: ''
};
// 이동 선 그리기
function segPath(seg, P) {
  return 'M' + seg.pts.map(p => P(p.lat, p.lng).map(f1).join(',')).join('L');
}
// 출발·도착(숙소·공항) 핀
function anchorPin(P, pt, icon, label) {
  const [x, y] = P(pt.lat, pt.lng);
  return `<g class="anc-pin" transform="translate(${f1(x)},${f1(y)})"><rect x="-13" y="-13" width="26" height="26" rx="7"/><svg x="-8" y="-8" width="16" height="16" viewBox="0 0 24 24" class="anc-ic">${ICON[icon]}</svg><title>${esc(label)}</title></g>`;
}
// ★ 계획의 지도 탭 (그날 동선)
function drawDay(el) {
  if (rgMode() === 'vector') return dmVector(el);
  el.classList.remove('vector');
  const W = el.clientWidth,
    H = el.clientHeight;
  if (!W || !H) return;
  const p = S.plan,
    c = computeDay(p, S.di),
    day = c.day;
  const legs = [...c.rows.map(r => r.leg), c.endLeg];
  let pts = [c.startPt, ...c.rows.map(r => r.p), c.endPt];
  const spanKm = pts2 => {
    const la = pts2.map(x => x.lat),
      ln = pts2.map(x => x.lng);
    return Math.max((Math.max(...ln) - Math.min(...ln)) * KX, (Math.max(...la) - Math.min(...la)) * KY);
  };
  let note = '';
  if (c.rows.length && spanKm(pts) > 28) {
    const zc = {};
    c.rows.forEach(r => (zc[r.p.z] = (zc[r.p.z] || 0) + 1));
    const z = Object.entries(zc).sort((a, b) => b[1] - a[1])[0][0];
    pts = c.rows.filter(r => r.p.z === z).map(r => r.p);
    note = `<p class="map-note2">${ZONES[z]} 주변을 보여 주고 있어요. 숙소·공항 쪽 이동은 지도 밖으로 이어져요.</p>`;
  }
  const { P, s } = linear(pts, W, H, 42);
  let h = geoSVG(P, 1, { stations: s > 120, riverW: clamp(s * 0.05, 1.5, 6), lineW: 2.2 });
  legs.forEach(l =>
    (l.segs || []).forEach(sg => {
      h += `<path class="seg-halo" d="${segPath(sg, P)}"/><path class="rseg" style="stroke:${sg.mode === 'subway' && sg.line ? LINES[sg.line].color : MODE[sg.mode].color};${SEG_STYLE[sg.mode] || ''}" d="${segPath(sg, P)}"/>`;
    })
  );
  const sameAnchor = km(c.startPt, c.endPt) < 0.05;
  h += anchorPin(P, c.startPt, day.start.kind === 'airport' ? 'plane' : 'home', '출발');
  if (!sameAnchor) h += anchorPin(P, c.endPt, day.end.kind === 'airport' ? 'plane' : 'home', '도착');
  c.rows.forEach((r, i) => {
    const [x, y] = P(r.p.lat, r.p.lng),
      on = S.sel === r.it.uid;
    h += `<g class="npin${on ? ' on' : ''}${r.it.src === 'walk' ? ' walkp' : ''}" data-act="mapPick" data-uid="${r.it.uid}" transform="translate(${f1(x)},${f1(y)})" tabindex="0" role="button" aria-label="${i + 1}. ${esc(itemName(p, r.it))}"><circle r="${on ? 15 : 12}"/><text y="4.5">${i + 1}</text>${on ? `<text class="npin-l" y="-22">${esc(itemName(p, r.it))}</text>` : ''}</g>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${S.di + 1}일차 동선 지도">${h}</svg>${note}`;
}
// ======================================================================
// ★ 지도 탭 진짜 지도 (MapLibre). 동선은 지도 위 선으로, 번호 핀·이름표는 앱이 위에 그려요.
//    그날 갈 곳 위주로 맞추고, 화면 밖 장소·공항·숙소는 가장자리 이름표로 보여 줘요.
// ======================================================================
let DMV = null;
function dmDrop() {
  if (!DMV) return;
  try {
    if (DMV.map) DMV.map.remove();
  } catch (_) {}
  DMV = null;
}
function dmVector(el) {
  const key = `${hpDark() ? 'd' : 'l'}${LANG}`;
  if (DMV && DMV.key !== key) dmDrop();
  if (!DMV) {
    const box = document.createElement('div'),
      gl = document.createElement('div'),
      ov = document.createElement('div');
    box.className = 'rg-vmap';
    gl.className = 'rg-gl';
    ov.className = 'rg-ov';
    box.append(gl, ov);
    DMV = { key, box, gl, ov, map: null, sig: '' };
    loadMapLibre().then(dmInit).catch(rgFail);
  }
  el.classList.add('vector');
  if (DMV.box.parentNode !== el) {
    el.innerHTML = '';
    el.appendChild(DMV.box);
  }
  if (DMV.map) {
    DMV.map.resize();
    dmSync();
  }
}
function dmInit(gl) {
  const R = DMV;
  if (!R || R.map) return;
  let map;
  try {
    map = new gl.Map({
      container: R.gl,
      style: HP_STYLE,
      center: [130.4, 33.59],
      zoom: 13,
      minZoom: 8,
      maxZoom: 18,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: { compact: true },
      fadeDuration: 0
    });
  } catch (e) {
    rgFail();
    return;
  }
  map.touchZoomRotate.disableRotation();
  R.map = map;
  map.on('load', () => {
    if (DMV !== R) return;
    R.loaded = true;
    try {
      hpVecStyle(map);
      hpVecOverlay(map);
      if (map.getLayer('fk-st-label')) map.setLayerZoomRange('fk-st-label', 15, 24);
      // 오늘 동선: 지하철·열차는 실선, 버스·택시는 끊은 선, 걷기는 점선
      const C = hpPalette();
      map.addSource('dm-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'dm-halo',
        type: 'line',
        source: 'dm-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': C.halo, 'line-width': 9, 'line-opacity': 0.9 }
      });
      map.addLayer({
        id: 'dm-solid',
        type: 'line',
        source: 'dm-route',
        filter: ['==', ['get', 'k'], 'solid'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'c'], 'line-width': 5 }
      });
      map.addLayer({
        id: 'dm-dash',
        type: 'line',
        source: 'dm-route',
        filter: ['==', ['get', 'k'], 'dash'],
        layout: { 'line-join': 'round' },
        paint: { 'line-color': ['get', 'c'], 'line-width': 4.5, 'line-dasharray': [2.2, 1.2] }
      });
      map.addLayer({
        id: 'dm-dot',
        type: 'line',
        source: 'dm-route',
        filter: ['==', ['get', 'k'], 'dot'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'c'], 'line-width': 5, 'line-dasharray': [0.01, 1.7] }
      });
    } catch (e) {
      console.warn('day map style', e);
    }
    dmSync();
  });
  setTimeout(() => {
    if (DMV === R && !R.loaded) rgFail();
  }, 10000);
  map.on('move', dmOverlay);
  map.on('resize', dmOverlay);
}
// 오늘 데이터 → 지도 (날짜·일정이 바뀌면 화면을 다시 맞춰요)
function dmSync() {
  const R = DMV;
  if (!R || !R.map || !S.plan) return;
  const map = R.map,
    c = computeDay(S.plan, S.di),
    rows = c.rows;
  R.c = c;
  if (R.loaded && map.getSource('dm-route')) {
    const feats = [];
    [...rows.map(r => r.leg), c.endLeg].forEach(l =>
      (l.segs || []).forEach(sg => {
        if (!sg.pts || sg.pts.length < 2) return;
        const color = sg.mode === 'subway' && sg.line ? LINES[sg.line].color : MODE[sg.mode].color,
          k = sg.mode === 'walk' ? 'dot' : sg.mode === 'bus' || sg.mode === 'taxi' ? 'dash' : 'solid';
        feats.push({
          type: 'Feature',
          properties: { c: color, k },
          geometry: { type: 'LineString', coordinates: sg.pts.map(p => [p.lng, p.lat]) }
        });
      })
    );
    map.getSource('dm-route').setData({ type: 'FeatureCollection', features: feats });
  }
  const sig = `${S.di}|${rows.map(r => r.it.uid).join(',')}`;
  if (sig !== R.sig) {
    R.sig = sig;
    R.lastSel = null;
    // 대부분 장소가 모인 곳에 맞추기 (멀리 떨어진 곳은 가장자리 이름표로)
    const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
    let pts = rows.map(r => r.p);
    if (pts.length) {
      const mc = { lat: med(pts.map(p => p.lat)), lng: med(pts.map(p => p.lng)) },
        near = pts.filter(p => km(p, mc) <= 1.8);
      if (near.length >= Math.min(3, pts.length)) pts = near;
    } else pts = [c.startPt, c.endPt];
    const lats = pts.map(p => p.lat),
      lngs = pts.map(p => p.lng),
      pad = { top: 64, bottom: 118, left: 44, right: 44 };
    map.resize();
    const cam = map.cameraForBounds(
      [
        [Math.min(...lngs) - 0.0015, Math.min(...lats) - 0.001],
        [Math.max(...lngs) + 0.0015, Math.max(...lats) + 0.001]
      ],
      { padding: pad, maxZoom: 16 }
    );
    if (cam) map.jumpTo(cam);
  }
  // 아래 카드에서 고른 곳이 화면 밖이면 그쪽으로
  if (S.mapSel && S.mapSel !== R.lastSel) {
    const r = rows.find(x => x.it.uid === S.mapSel);
    if (r) {
      const q = map.project([r.p.lng, r.p.lat]),
        W = R.box.clientWidth,
        H = R.box.clientHeight;
      if (q.x < 30 || q.x > W - 30 || q.y < 60 || q.y > H - 120)
        map.easeTo({ center: [r.p.lng, r.p.lat], duration: 500 });
    }
  }
  R.lastSel = S.mapSel;
  dmOverlay();
}
// 묶인 이름표를 누르면 그 장소들이 다 보이게
A.dmGo = d => {
  const R = DMV;
  if (!R || !R.map || !R.c) return;
  const ids = String(d.uids || '').split(','),
    pts = R.c.rows.filter(r => ids.includes(r.it.uid)).map(r => r.p);
  if (!pts.length) return;
  const lats = pts.map(p => p.lat),
    lngs = pts.map(p => p.lng);
  R.map.fitBounds(
    [
      [Math.min(...lngs) - 0.0015, Math.min(...lats) - 0.001],
      [Math.max(...lngs) + 0.0015, Math.max(...lats) + 0.001]
    ],
    { padding: { top: 64, bottom: 118, left: 44, right: 44 }, maxZoom: 16, duration: 600 }
  );
};
function dmOverlay() {
  const R = DMV;
  if (!R || !R.map || !R.c || !S.plan) return;
  const map = R.map,
    c = R.c,
    p = S.plan,
    day = c.day,
    W = R.box.clientWidth,
    H = R.box.clientHeight;
  if (!W || !H) return;
  const TOP = 52,
    BOT = H - 104,
    inView = q => q.x > 14 && q.x < W - 14 && q.y > TOP && q.y < BOT,
    short = t => (t.length > 10 ? t.slice(0, 9) + '…' : t),
    chips = [],
    pins = [];
  let h = '';
  // 출발·도착 (숙소·공항)
  const anchors = [
    [
      c.startPt,
      day.start.kind === 'airport' ? 'plane' : 'home',
      day.start.kind === 'airport' ? L('공항', '空港') : L('숙소', '宿')
    ]
  ];
  if (km(c.startPt, c.endPt) > 0.05)
    anchors.push([
      c.endPt,
      day.end.kind === 'airport' ? 'plane' : 'home',
      day.end.kind === 'airport' ? L('공항', '空港') : L('숙소', '宿')
    ]);
  const ancG = [];
  anchors.forEach(([pt, icn, nm]) => {
    const q = map.project([pt.lng, pt.lat]);
    if (inView(q)) ancG.push({ q, icn, nm });
    else chips.push({ q, nm, w: textEm(nm) * 12 + 36 });
  });
  c.rows.forEach((r, i) => {
    const q = map.project([r.p.lng, r.p.lat]),
      nm = itemName(p, r.it);
    if (inView(q)) pins.push({ i, r, nm, ox: q.x, oy: q.y, x: q.x, y: q.y, on: S.mapSel === r.it.uid });
    else {
      // 화면 밖에서 서로 가까운 곳들은 이름표 하나로 묶어요
      const g = chips.find(x => x.rs && x.rs.some(o => km(o.p, r.p) < 1.5));
      if (g) (g.rs.push(r), g.ix.push(i));
      else chips.push({ q, rs: [r], ix: [i] });
    }
  });
  chips.forEach(cp => {
    if (!cp.rs) return;
    const one = cp.rs.length === 1,
      t = one
        ? `${cp.ix[0] + 1} · ${short(itemName(p, cp.rs[0].it))}`
        : (() => {
            const n = cp.ix.map(i => i + 1),
              run = n.every((v, k) => !k || v === n[k - 1] + 1),
              lab = run ? `${n[0]}~${n[n.length - 1]}` : n.join('·');
            return L(`${lab}번 · ${n.length}곳`, `${lab.replace(/·/g, '・')} · ${n.length}か所`);
          })();
    cp.nm = t;
    cp.w = textEm(t) * 12 + 36;
    cp.on = cp.rs.some(r => r.it.uid === S.mapSel);
    cp.act = one
      ? `data-act="mapPick" data-uid="${cp.rs[0].it.uid}"`
      : `data-act="dmGo" data-uids="${cp.rs.map(r => r.it.uid).join(',')}"`;
  });
  // 겹치는 번호 핀은 살짝 펼치기 (원래 자리는 작은 점 + 선)
  for (let it = 0; it < 60; it++) {
    let moved = false;
    for (let a = 0; a < pins.length; a++)
      for (let b = a + 1; b < pins.length; b++) {
        const A2 = pins[a],
          B2 = pins[b];
        let dx = B2.x - A2.x,
          dy = B2.y - A2.y,
          d = Math.hypot(dx, dy);
        if (d < 27) {
          if (d < 0.01) {
            dx = Math.cos(b);
            dy = Math.sin(b);
            d = 1;
          }
          const m = (27 - d) / 2;
          A2.x -= (dx / d) * m;
          A2.y -= (dy / d) * m;
          B2.x += (dx / d) * m;
          B2.y += (dy / d) * m;
          moved = true;
        }
      }
    pins.forEach(q => {
      q.x += (q.ox - q.x) * 0.05;
      q.y += (q.oy - q.y) * 0.05;
    });
    if (!moved) break;
  }
  // 가장자리 이름표
  const cx = W / 2,
    cy = (TOP + BOT) / 2,
    used = [];
  chips.forEach(cp => {
    const dx = cp.q.x - cx,
      dy = cp.q.y - cy,
      t = Math.min(
        Math.abs(dx) > 1e-6 ? (W / 2 - 8 - cp.w / 2) / Math.abs(dx) : 1e9,
        Math.abs(dy) > 1e-6 ? ((BOT - TOP) / 2 - 16) / Math.abs(dy) : 1e9
      );
    cp.x = clamp(cx + dx * t, 8 + cp.w / 2, W - 8 - cp.w / 2);
    cp.y = clamp(cy + dy * t, TOP + 13, BOT - 13);
    cp.h = 26;
    cp.ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const hw = W / 2 - 8 - cp.w / 2;
    cp.side = Math.abs(cp.x - cx) >= hw - 0.5 ? (cp.x < cx ? 'L' : 'R') : cp.y < cy ? 'T' : 'B';
    used.push(cp);
  });
  // 같은 테두리끼리 겹치지 않게 줄 세우기
  const spread = (list, pos, size, lo, hi) => {
    list.sort((a, b) => a[pos] - b[pos]);
    for (let i = 0; i < list.length; i++) {
      const q = list[i],
        min = i ? list[i - 1][pos] + (list[i - 1][size] + q[size]) / 2 + 4 : lo + q[size] / 2;
      q[pos] = Math.max(q[pos], min);
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const q = list[i],
        max = i < list.length - 1 ? list[i + 1][pos] - (list[i + 1][size] + q[size]) / 2 - 4 : hi - q[size] / 2;
      q[pos] = Math.min(q[pos], max);
    }
  };
  spread(
    used.filter(q => q.side === 'L'),
    'y',
    'h',
    TOP,
    BOT
  );
  spread(
    used.filter(q => q.side === 'R'),
    'y',
    'h',
    TOP,
    BOT
  );
  spread(
    used.filter(q => q.side === 'T'),
    'x',
    'w',
    8,
    W - 8
  );
  spread(
    used.filter(q => q.side === 'B'),
    'x',
    'w',
    8,
    W - 8
  );
  // 위·아래 줄 이름표가 양옆 줄과 겹치면 안쪽으로
  used.forEach(q => {
    if (q.side !== 'T' && q.side !== 'B') return;
    const hit = used.some(
      o => (o.side === 'L' || o.side === 'R') && Math.abs(o.x - q.x) < (o.w + q.w) / 2 + 4 && Math.abs(o.y - q.y) < 30
    );
    if (hit) q.y += q.side === 'T' ? 32 : -32;
  });
  // 이름표: 자리가 있을 때만 (고른 곳은 항상)
  const obstacles = [
    ...pins.map(q => ({ x0: q.x - 13, x1: q.x + 13, y0: q.y - 13, y1: q.y + 13 })),
    ...ancG.map(a => ({ x0: a.q.x - 14, x1: a.q.x + 14, y0: a.q.y - 14, y1: a.q.y + 14 })),
    ...used.map(u => ({ x0: u.x - u.w / 2, x1: u.x + u.w / 2, y0: u.y - 13, y1: u.y + 13 }))
  ];
  const items = pins.map(q => {
    const t = short(q.nm);
    return {
      q,
      t,
      x: q.x,
      y: q.y,
      r: q.on ? 15 : 12,
      w: textEm(t) * (q.on ? 13 : 11.5) + 6,
      hgt: q.on ? 16 : 14,
      gap: 3
    };
  });
  placeLabels([...items.filter(i => i.q.on), ...items.filter(i => !i.q.on)], obstacles, {
    x0: 2,
    x1: W - 2,
    y0: TOP - 4,
    y1: BOT
  });
  pins.forEach(q => {
    if (Math.hypot(q.x - q.ox, q.y - q.oy) > 5)
      h += `<path class="np-lead" d="M${f1(q.ox)},${f1(q.oy)}L${f1(q.x)},${f1(q.y)}"/><circle class="np-dot" cx="${f1(q.ox)}" cy="${f1(q.oy)}" r="3"/>`;
  });
  ancG.forEach(a => {
    h += `<g class="anc-pin" transform="translate(${f1(a.q.x)},${f1(a.q.y)})"><rect x="-13" y="-13" width="26" height="26" rx="7"/><svg x="-8" y="-8" width="16" height="16" viewBox="0 0 24 24" class="anc-ic">${ICON[a.icn]}</svg><title>${esc(a.nm)}</title></g>`;
  });
  items.forEach(it => {
    const t = it.at;
    if (t.cost > 0 && !it.q.on) return;
    h += `<text class="np-lab${it.q.on ? ' on' : ''}" x="${f1(t.tx)}" y="${f1(t.ty)}" style="text-anchor:${t.ax}">${esc(it.t)}</text>`;
  });
  pins
    .slice()
    .sort((a, b) => a.on - b.on)
    .forEach(q => {
      h += `<g class="npin${q.on ? ' on' : ''}${q.r.it.src === 'walk' ? ' walkp' : ''}" data-act="mapPick" data-uid="${q.r.it.uid}" transform="translate(${f1(q.x)},${f1(q.y)})" tabindex="0" role="button" aria-label="${q.i + 1}. ${esc(q.nm)}"><circle r="${q.on ? 15 : 12}"/><text y="4.5">${q.i + 1}</text></g>`;
    });
  used.forEach(cp => {
    h += `<g class="rg-chip${cp.on ? ' on' : ''}"${cp.act ? ` ${cp.act} role="button" tabindex="0"` : ''} aria-label="${esc(cp.nm)}" transform="translate(${f1(cp.x)},${f1(cp.y)})"><rect x="${f1(-cp.w / 2)}" y="-13" width="${f1(cp.w)}" height="26" rx="13"/><text x="${f1(-cp.w / 2 + 11)}" y="4.3">${esc(cp.nm)}</text><g transform="translate(${f1(cp.w / 2 - 13)},0) rotate(${f1(cp.ang)})"><path class="rg-ar" d="M-4.5 0H4.5M0.5 -4L4.5 0L0.5 4"/></g></g>`;
  });
  R.ov.innerHTML = `<svg class="rg-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${h}</svg>`;
}
// 걷기 추천 지도
function drawWalk(el) {
  const sh = S.sheet;
  if (!sh || !sh.recs || sh.recs.err) return;
  const W = el.clientWidth,
    H = el.clientHeight;
  if (!W || !H) return;
  const R = sh.recs,
    pts = [R.A, R.B, ...R.recs.map(r => r.s)];
  const { P, s } = linear(pts, W, H, 34, 0.8);
  let h = geoSVG(P, 1, { stations: s > 160, riverW: clamp(s * 0.05, 1.5, 6), lineW: 2 });
  const a = P(R.A.lat, R.A.lng),
    b = P(R.B.lat, R.B.lng);
  h += `<path class="corr" style="stroke-width:${f1(R.corridor * 2 * s)}" d="M${a.map(f1).join(',')}L${b.map(f1).join(',')}"/>`;
  h += `<path class="rseg" style="stroke:${MODE.walk.color};${SEG_STYLE.walk}" d="M${a.map(f1).join(',')}L${b.map(f1).join(',')}"/>`;
  R.recs.forEach((r, k) => {
    const [x, y] = P(r.s.lat, r.s.lng),
      on = sh.picks.includes(r.s.id);
    h += `<g class="rpin${on ? ' on' : ''}" data-act="recToggle" data-id="${r.s.id}" transform="translate(${f1(x)},${f1(y)})"><circle r="11"/><text y="4">${k + 1}</text></g>`;
  });
  [
    [a, '출발'],
    [b, '도착']
  ].forEach(([p, t]) => {
    h += `<g class="ab-pin" transform="translate(${f1(p[0])},${f1(p[1])})"><rect x="-17" y="-11" width="34" height="22" rx="11"/><text y="4">${t}</text></g>`;
  });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="걷는 길 추천 지도">${h}</svg>`;
}
