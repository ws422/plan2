// ======================================================================
// stays.js · 숙소를 날짜별로 정하기
// 새 여행 1단계의 숙소 칸, 숙소 위치 고르기 시트, 계획 화면의 숙소 시트, 일차 카드의 「오늘 밤 숙소」 줄
// 고치는 법: docs/수정가이드.md
// ======================================================================
// ---- 숙소: 날짜별로 다르게 정하기 (새 여행 화면 · 계획 화면 공통) ----
function hotelWhereT(h) {
  return LANG === 'ja' ? hotelWhereJ(h) : hotelWhere(h);
}
function hotelLabelT(h) {
  h = h || {};
  return h.name ? `${h.name} · ${hotelWhereT(h)}` : hotelWhereT(h);
}
function hotelNearT(h) {
  return LANG === 'ja' ? `${hotelWhereJ(h)}周辺` : `${hotelWhere(h)} 근처`;
}
function draftNights() {
  const D = S.draft;
  return D.start && D.end ? dayDiff(D.start, D.end) : 0;
}
function nightDate(start, n) {
  const d = pd(start);
  d.setDate(d.getDate() + n);
  return ymd(d);
}
// ctx: 'draft' = 새 여행 만들기 화면, 'plan' = 만들어 둔 계획
function stayCtx(ctx) {
  if (ctx === 'plan') {
    const p = S.plan;
    return {
      start: p.days[0].date,
      nights: nightsOf(p),
      get: () => staysOf(p),
      set: st => {
        pushUndo();
        p.set.stays = st;
        syncMoveItems(p);
        dirty();
      }
    };
  }
  const D = S.draft;
  return {
    start: D.start,
    nights: draftNights(),
    get: () => normStays(D.stays, draftNights(), D.hotel),
    set: st => {
      D.stays = st;
      D.hotel = hotelKeyOf(st[0] && st[0].h);
    }
  };
}
function staysEditorV(ctx) {
  const c = stayCtx(ctx),
    st = c.get(),
    n = c.nights;
  const rows = st
    .map((x, k) => {
      const cnt = x.n1 - x.n0 + 1,
        inD = nightDate(c.start, x.n0),
        outD = nightDate(c.start, x.n1 + 1);
      let opts = '';
      if (k > 0)
        for (let b = st[k - 1].n0 + 1; b <= x.n1; b++)
          opts += `<option value="${b}"${b === x.n0 ? ' selected' : ''}>${mds(nightDate(c.start, b))}</option>`;
      return `<li class="stay">
      <div class="stay-h"><span class="stay-n">${k + 1}</span><span class="stay-d"><b>${mds(inD)} – ${mds(outD)}</b><small>${L(`${cnt}박`, `${cnt}泊`)}</small></span>
        ${
          k > 0
            ? `<button class="ib xs" data-act="stayDel" data-ctx="${ctx}" data-k="${k}" aria-label="${L(`${k + 1}번째 숙소 빼기`, `${k + 1}番目の宿を外す`)}">${ic('close')}</button>
        <label class="stay-in"><span>${L('이 숙소 체크인 날', 'この宿のチェックイン日')}</span><select data-change="stayFrom" data-ctx="${ctx}" data-k="${k}">${opts}</select></label>`
            : ''
        }</div>
      <button class="stay-pick" data-act="stayPick" data-ctx="${ctx}" data-k="${k}">${ic('home')}<span><b>${esc(x.h.name || hotelNearT(x.h))}</b><small>${stayPickSub(x.h)}</small></span>${ic('next', 'chev')}</button></li>`;
    })
    .join('');
  const canAdd = st.some(x => x.n1 > x.n0);
  return (
    `<ol class="stays">${rows}</ol>` +
    (canAdd
      ? `<button class="btn soft wide stay-add" data-act="stayAdd" data-ctx="${ctx}">${ic('plus')}${L('중간에 숙소 옮기기', '途中で宿を移る')}</button>`
      : '')
  );
}
// 숙소 칸 아래 작은 글씨: 정확한 위치면 가까운 역까지 걸어서 몇 분
function stayPickSub(h) {
  if (hotelPin(h)) {
    const ns = nearStation(h);
    return (
      '📍 ' +
      (ns
        ? L(`${ns.st.n}역까지 걸어서 ${wmin(ns.d)}분`, `${ns.st.j}駅まで徒歩${wmin(ns.d)}分`)
        : L('정확한 위치로 정했어요', '正確な場所に設定済み'))
    );
  }
  return h.name ? esc(hotelNearT(h)) : L('눌러서 예약한 숙소 정하기', 'タップして予約した宿を設定');
}
// 새 여행 화면의 숙소 카드
function draftHotelCard() {
  const D = S.draft,
    n = draftNights();
  const head = `<h2 class="h-s">${L('숙소', '宿')}</h2>`;
  if (!D.start || !D.end)
    return `<section class="card">${head}<p class="sub">${L('날짜를 고르면 밤마다 묵을 숙소를 정할 수 있어요.', '日付を選ぶと、泊まる宿を夜ごとに決められます。')}</p></section>`;
  if (!n)
    return `<section class="card">${head}<p class="sub">${L('당일치기라 숙소 없이 공항에서 출발해 공항으로 돌아오는 동선으로 짜요.', '日帰りなので、宿なしで空港発・空港着のルートを作ります。')}</p></section>`;
  return `<section class="card">${head}<p class="sub">${L('매일 숙소에서 출발해 숙소로 돌아오는 동선으로 짜요. 숙소를 옮기면 그날 아침 새 숙소에 짐을 맡기고 시작해요.', '毎日宿を出発して宿に戻るルートを作ります。宿を移る日は、朝に新しい宿へ荷物を預けてから始めます。')}</p>${staysEditorV('draft')}</section>`;
}
// 숙소 위치 고르기 — 지도에 핀 꽂기 · 이름으로 찾기 · 좌표 붙여넣기 · 동네만
function hpickSheetV(sh) {
  const c = stayCtx(sh.ctx),
    st = c.get(),
    x = st[sh.k] || st[0],
    h = sh.h,
    tab = sh.tab || 'find',
    pin = hotelPin(h);
  const pt = hotelPt(h),
    ns = nearStation(pt);
  const nowSub = pin
    ? ns
      ? L(`${ns.st.n}역까지 걸어서 ${wmin(ns.d)}분`, `${ns.st.j}駅まで徒歩${wmin(ns.d)}分`)
      : L('가까운 지하철역이 없어요 · 버스·택시로 계산해요', '近くに地下鉄駅がありません · バス・タクシーで計算します')
    : L(`지금은 「${hotelWhereT(h)} 근처」로 대략 계산해요`, `今は「${hotelWhereT(h)}周辺」でおおまかに計算しています`);
  const tabBtn = (t, label) =>
    `<button role="tab" class="${tab === t ? 'on' : ''}" aria-selected="${tab === t}" data-act="hpTab" data-t="${t}">${label}</button>`;
  let body = '';
  if (tab === 'find') {
    let res = '';
    if (sh.busy) res = `<p class="hp-msg">${ic('search')}${L('찾는 중…', '検索中…')}</p>`;
    else if (sh.err) res = `<p class="hp-msg bad">${esc(sh.err)}</p>`;
    else if (sh.res && !sh.res.length)
      res = `<p class="hp-msg">${L('못 찾았어요. 일본어·영어 이름으로 다시 찾거나, 위 지도에서 숙소 자리를 직접 눌러 주세요.', '見つかりませんでした。日本語・英語の名前で探すか、上の地図で宿の場所を直接タップしてください。')}</p>`;
    else if (sh.res)
      res = `<ul class="hp-res">${sh.res
        .map(
          (r, i) =>
            `<li><button class="${pin && +h.lat === r.lat && +h.lng === r.lng ? 'on' : ''}" data-act="hpRes" data-i="${i}">${ic('pin')}<span><b>${esc(r.name)}</b><small>${esc(r.addr)}</small></span>${pin && +h.lat === r.lat && +h.lng === r.lng ? ic('check', 'ok') : ''}</button></li>`
        )
        .join('')}</ul>`;
    body = `<div class="hp-find"><input id="hQ" type="search" enterkeyhint="search" autocomplete="off" value="${esc(sh.q ?? '')}" placeholder="${L('예: Dormy Inn Hakata, ドーミーイン博多', '例: ドーミーイン博多、Dormy Inn')}"><button class="btn pri" data-act="hpFind">${L('찾기', '検索')}</button></div>
      <p class="fine hp-fine">${L('예약 확인서에 적힌 일본어·영어 호텔 이름으로 찾으면 잘 나와요. 인터넷이 필요해요.', '予約確認書の日本語・英語のホテル名で探すと見つかりやすいです。インターネットが必要です。')}</p>${res}`;
  } else if (tab === 'paste') {
    body = `<div class="hp-find"><input id="hPaste" type="text" inputmode="decimal" autocomplete="off" value="${esc(sh.paste ?? '')}" placeholder="33.5905, 130.4207"><button class="btn pri" data-act="hpPaste">${L('적용', '適用')}</button></div>
      <ol class="hp-how">
        <li>${L('구글 지도에서 숙소를 찾아 그 자리를 꾹 눌러요', 'Googleマップで宿を探し、その場所を長押しします')}</li>
        <li>${L('위에 나온 숫자 좌표(33.59…, 130.41…)를 복사해요', '上に出る数字の座標(33.59…, 130.41…)をコピーします')}</li>
        <li>${L('여기에 붙여 넣고 「적용」을 눌러요. 주소창의 긴 링크도 돼요', 'ここに貼り付けて「適用」。アドレスバーの長いリンクでもOK')}</li>
      </ol>`;
  } else {
    const chip = (v, label, on) =>
      `<button class="${on ? 'on' : ''}" data-act="hpPick" data-v="${v}" aria-pressed="${on}">${label}</button>`;
    const presets = Object.keys(HOTEL_LABEL)
      .map(k => chip('k:' + k, esc(hotelWhereT({ k })), !pin && !h.st && h.k === k))
      .join('');
    const skip = new Set([...Object.values(HOTEL_STATION), 'airport']),
      seen = new Set();
    const lines = Object.values(LINES)
      .map(ln => {
        const ids = ln.st.filter(id => !skip.has(id) && !seen.has(id));
        ids.forEach(id => seen.add(id));
        return ids.length
          ? `<p class="hp-line"><i style="--m:${ln.color}"></i>${esc(LANG === 'ja' ? ln.j : ln.n)}</p><div class="chips-sel hp-st">${ids.map(id => chip('st:' + id, esc(LANG === 'ja' ? STATIONS[id].j : STATIONS[id].n), !pin && h.st === id)).join('')}</div>`
          : '';
      })
      .join('');
    body = `<p class="fine hp-fine">${L('정확한 위치를 모를 때 동네나 가까운 역만 골라도 돼요. 동선은 그 근처 기준으로 짜요.', '正確な場所がわからなければ、エリアか最寄り駅だけでもOK。その周辺を基準にルートを作ります。')}</p>
      <h3 class="sec"><span>${L('많이 묵는 동네', '人気の宿泊エリア')}</span></h3><div class="chips-sel">${presets}</div>
      <h3 class="sec"><span>${L('다른 역 근처', 'ほかの駅の近く')}</span></h3>${lines}`;
  }
  return (
    shHead(
      L('숙소 위치', '宿の場所'),
      `${L(`${sh.k + 1}번째 숙소`, `${sh.k + 1}番目の宿`)} · ${mds(nightDate(c.start, x.n0))} – ${mds(nightDate(c.start, x.n1 + 1))}`
    ) +
    `<label class="fld hp-name"><span>${L('숙소 이름', '宿の名前')}</span><input id="hName" type="text" maxlength="40" value="${esc(sh.nm ?? h.name ?? '')}" placeholder="${L('예: 도미인 하카타 기온', '例: ドーミーイン博多祇園')}" autocomplete="off"></label>
    <div class="hp-map-wrap">
      <div class="hp-map" id="hpmap" role="application" aria-label="${L('숙소 위치 지도 · 눌러서 핀 꽂기', '宿の場所の地図 · タップでピンを置く')}"></div>
      <div class="hp-zoom"><button class="ib sm" data-act="hpZoom" data-n="1" aria-label="${L('확대', '拡大')}">${ic('plus')}</button><button class="ib sm" data-act="hpZoom" data-n="-1" aria-label="${L('축소', '縮小')}">${ic('minus')}</button></div>
      ${hpMode(sh) === 'svg' ? `<p class="hp-off">${L('인터넷이 없어 간단한 지도로 보여요', 'オフラインのため簡易地図で表示しています')}</p>` : ''}
      <p class="hp-tip">${pin ? L('다른 곳을 누르면 핀이 옮겨져요', '別の場所をタップするとピンが移動します') : L('숙소 자리를 눌러 핀을 꽂아요', '宿の場所をタップしてピンを置きます')}</p>
    </div>
    <div class="hp-now${pin ? ' ok' : ''}">${ic(pin ? 'check' : 'pin')}<span><b>${pin ? L('정확한 위치로 정했어요', '正確な場所に設定しました') : L('아직 대략적인 위치예요', 'まだおおまかな場所です')}</b><small>${nowSub}</small></span></div>
    <div class="hp-tabs" role="tablist">${tabBtn('find', L('이름으로 찾기', '名前で探す'))}${tabBtn('paste', L('좌표·링크', '座標・リンク'))}${tabBtn('area', L('동네만 고르기', 'エリアだけ'))}</div>
    <div class="hp-body">${body}</div>
    <div class="sh-foot"><button class="btn pri" data-act="hpSave">${ic('check')}${L('이 숙소로 정하기', 'この宿に決める')}</button></div>`
  );
}
// 숙소 위치 지도 (실제 축척 · 끌어서 이동 · 눌러서 핀)
function hpView(sh) {
  if (!sh.view) {
    const pt = hotelPt(sh.h);
    sh.view = { lat: pt.lat, lng: pt.lng, span: hotelPin(sh.h) ? 1.4 : 2.6 };
  }
  return sh.view;
}
function hpProj(v, W, H) {
  const s = W / v.span;
  return {
    s,
    P: (lat, lng) => [W / 2 + (lng - v.lng) * KX * s, H / 2 - (lat - v.lat) * KY * s],
    inv: (x, y) => ({ lat: v.lat - (y - H / 2) / (KY * s), lng: v.lng + (x - W / 2) / (KX * s) })
  };
}
function hpMapSVG(sh, W, H) {
  const v = hpView(sh),
    { P, s } = hpProj(v, W, H);
  let h = geoSVG(P, 1, { stations: v.span < 6, riverW: clamp(s * 0.05, 1.5, 6), lineW: 2.4 });
  const pt = hotelPt(sh.h),
    [x, y] = P(pt.lat, pt.lng);
  if (hotelPin(sh.h)) {
    h += `<g class="hpk" transform="translate(${f1(x)},${f1(y)})"><ellipse class="hpk-sh" cx="0" cy="1" rx="7" ry="3"/><path d="M0 0C-3 -8 -13 -14 -13 -24A13 13 0 1 1 13 -24C13 -14 3 -8 0 0Z"/><circle cy="-24" r="5"/></g>`;
  } else {
    h += `<g class="hpin-ap" transform="translate(${f1(x)},${f1(y)})"><circle r="${f1(clamp(0.45 * s, 18, 70))}"/><circle class="dot" r="5"/></g>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true">${h}</svg>`;
}
// ---- 실제 지도 (일본 국토지리원 지도 · 안 되면 OpenStreetMap) — 둘 다 API 키가 필요 없어요 ----
// 인터넷이 있으면 길·건물까지 보이는 지도, 없거나 타일이 안 오면 간단한 그림 지도로 바꿔요
const HP_TILE = 256,
  HP_ZMIN = 11,
  HP_ZMAX = 18;
function hpDark() {
  const t = document.documentElement.dataset.theme;
  return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
}
function hpTileUrl(z, x, y) {
  return `https://cyberjapandata.gsi.go.jp/xyz/pale/${z}/${x}/${y}.png`;
}
function hpTileUrlOsm(z, x, y) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}
// 위도·경도 ↔ 지도 픽셀 (웹 메르카토르)
function merc(lat, lng, z) {
  const ws = HP_TILE * 2 ** z,
    r = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return [((lng + 180) / 360) * ws, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * ws];
}
function mercInv(x, y, z) {
  const ws = HP_TILE * 2 ** z;
  return { lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / ws))) * 180) / Math.PI, lng: (x / ws) * 360 - 180 };
}
function hpTileView(sh) {
  if (!sh.tv) {
    const pt = hotelPt(sh.h);
    sh.tv = { lat: pt.lat, lng: pt.lng, z: hotelPin(sh.h) ? 16 : 15 };
  }
  return sh.tv;
}
// 지도 종류: vector(예쁜 벡터 지도) → raster(지리원 연한 지도) → svg(간단한 그림 지도) 순으로 물러나요
function hpMode(sh) {
  return sh.mapMode || (navigator.onLine === false ? 'svg' : 'vector');
}
function hpUseTiles(sh) {
  return hpMode(sh) === 'raster';
}
function hpTilesHTML(sh, W, H) {
  const v = hpTileView(sh),
    [cx, cy] = merc(v.lat, v.lng, v.z),
    left = cx - W / 2,
    top = cy - H / 2,
    n = 2 ** v.z;
  let h = '';
  for (let ty = Math.floor(top / HP_TILE); ty <= Math.floor((top + H) / HP_TILE); ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor(left / HP_TILE); tx <= Math.floor((left + W) / HP_TILE); tx++) {
      const x = ((tx % n) + n) % n;
      h += `<img class="hp-tile" alt="" draggable="false" src="${hpTileUrl(v.z, x, ty)}" data-fb="${hpTileUrlOsm(v.z, x, ty)}" style="left:${Math.round(tx * HP_TILE - left)}px;top:${Math.round(ty * HP_TILE - top)}px">`;
    }
  }
  const pt = hotelPt(sh.h),
    [px, py] = merc(pt.lat, pt.lng, v.z),
    x = px - left,
    y = py - top;
  if (hotelPin(sh.h)) {
    h += `<svg class="hp-pin-svg" style="left:${f1(x - 16)}px;top:${f1(y - 42)}px" width="32" height="46" viewBox="-16 -42 32 46" aria-hidden="true"><g class="hpk"><ellipse class="hpk-sh" cx="0" cy="1" rx="7" ry="3"/><path d="M0 0C-3 -8 -13 -14 -13 -24A13 13 0 1 1 13 -24C13 -14 3 -8 0 0Z"/><circle cy="-24" r="5"/></g></svg>`;
  } else {
    const mpp = (156543.03 * Math.cos((pt.lat * Math.PI) / 180)) / n,
      r = clamp(450 / mpp, 22, 140);
    h += `<span class="hp-ap" style="left:${f1(x - r)}px;top:${f1(y - r)}px;width:${f1(r * 2)}px;height:${f1(r * 2)}px"><i></i></span>`;
  }
  return `<div class="hp-layer">${h}</div><p class="hp-attr"><a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></p>`;
}
// 지도 그리기 (타일 또는 그림 지도)
function hpRedraw(el) {
  const sh = S.sheet;
  if (!sh || sh.type !== 'hpick' || !el || hpMode(sh) === 'vector') return;
  const W = el.clientWidth,
    H = el.clientHeight;
  if (!W || !H) return;
  if (!hpUseTiles(sh)) {
    el.classList.remove('tiles');
    el.innerHTML = hpMapSVG(sh, W, H);
    return;
  }
  el.classList.add('tiles');
  el.innerHTML = hpTilesHTML(sh, W, H);
  // 타일이 하나도 안 오면 그림 지도로
  const imgs = el.querySelectorAll('img.hp-tile');
  imgs.forEach(img => {
    img.addEventListener('load', () => (sh.tileOk = true), { once: true });
    img.addEventListener(
      'error',
      () => {
        // 지리원 지도가 안 오면 같은 칸을 OpenStreetMap 으로 한 번 더
        if (img.dataset.fb) {
          img.src = img.dataset.fb;
          delete img.dataset.fb;
          img.addEventListener('error', () => fail(img), { once: true });
          return;
        }
        fail(img);
      },
      { once: true }
    );
  });
  function fail(img) {
    img.style.visibility = 'hidden';
    sh.tileErr = (sh.tileErr || 0) + 1;
    if (!sh.tileOk && sh.tileErr >= Math.min(3, imgs.length) && hpMode(sh) === 'raster' && S.sheet === sh) {
      sh.mapMode = 'svg';
      S.keepSheetScroll = true;
      hpKeep();
      render();
    }
  }
}
function drawHpMap(el) {
  const sh = S.sheet;
  if (!sh || sh.type !== 'hpick') return;
  if (hpMode(sh) === 'vector') {
    hpVector(el, sh);
    return;
  }
  if (HPV) hpVecDrop();
  hpRedraw(el);
  if (el.__hp) return;
  el.__hp = true;
  let st = null;
  const layer = () => el.querySelector('.hp-layer, svg');
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('a')) return;
    st = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  });
  el.addEventListener('pointermove', e => {
    if (!st) return;
    const dx = e.clientX - st.x,
      dy = e.clientY - st.y;
    if (!st.moved && Math.hypot(dx, dy) < 6) return;
    if (!st.moved) {
      st.moved = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    // 끄는 동안은 그림만 옮기고, 손을 떼면 그 자리로 다시 그려요
    const ly = layer();
    if (ly) ly.style.transform = `translate(${dx}px,${dy}px)`;
    st.dx = dx;
    st.dy = dy;
  });
  const finish = e => {
    if (!st) return;
    const s0 = st;
    st = null;
    const W = el.clientWidth,
      H = el.clientHeight;
    if (s0.moved) {
      if (hpUseTiles(sh)) {
        const v = hpTileView(sh),
          [cx, cy] = merc(v.lat, v.lng, v.z),
          g = mercInv(cx - s0.dx, cy - s0.dy, v.z);
        sh.tv = { ...v, lat: g.lat, lng: g.lng };
      } else {
        const v = hpView(sh),
          s = W / v.span;
        sh.view = { ...v, lat: v.lat + s0.dy / (KY * s), lng: v.lng - s0.dx / (KX * s) };
      }
      hpRedraw(el);
      return;
    }
    if (e.type !== 'pointerup') return;
    const r = el.getBoundingClientRect(),
      ox = e.clientX - r.left,
      oy = e.clientY - r.top;
    let g;
    if (hpUseTiles(sh)) {
      const v = hpTileView(sh),
        [cx, cy] = merc(v.lat, v.lng, v.z);
      g = mercInv(cx - W / 2 + ox, cy - H / 2 + oy, v.z);
    } else g = hpProj(hpView(sh), W, H).inv(ox, oy);
    hpKeep();
    sh.h = { lat: +g.lat.toFixed(6), lng: +g.lng.toFixed(6) };
    S.keepSheetScroll = true;
    render();
  };
  el.addEventListener('pointerup', finish);
  el.addEventListener('pointercancel', finish);
  // 마우스 휠·트랙패드로 확대·축소
  el.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 4) return;
      A.hpZoom({ n: e.deltaY < 0 ? 1 : -1 });
    },
    { passive: false }
  );
}

// ---- 예쁜 벡터 지도 (OpenFreeMap · MapLibre) — API 키 없이 써요 ----
// 시트를 다시 그려도 지도는 하나를 계속 써요 (상자째로 옮겨 붙여요)
const ML_VER = '4.7.1',
  ML_BASE = `https://unpkg.com/maplibre-gl@${ML_VER}/dist/`,
  HP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
let HPV = null,
  MLP = null;
function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (MLP) return MLP;
  MLP = new Promise((res, rej) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = ML_BASE + 'maplibre-gl.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = ML_BASE + 'maplibre-gl.js';
    js.onload = () => (window.maplibregl ? res(window.maplibregl) : rej(new Error('maplibre')));
    js.onerror = () => rej(new Error('maplibre load'));
    document.head.appendChild(js);
    setTimeout(() => rej(new Error('maplibre timeout')), 12000);
  });
  MLP.catch(() => (MLP = null));
  return MLP;
}
function hpVecDrop() {
  if (!HPV) return;
  try {
    if (HPV.map) HPV.map.remove();
  } catch (_) {}
  HPV = null;
}
// 벡터 지도가 안 되면 지리원 지도로
function hpVecFail(sh) {
  if (S.sheet !== sh || hpMode(sh) !== 'vector') return;
  hpVecDrop();
  sh.mapMode = 'raster';
  hpKeep();
  S.keepSheetScroll = true;
  render();
}
function hpVector(el, sh) {
  if (HPV && HPV.sh !== sh) hpVecDrop();
  if (!HPV) {
    const box = document.createElement('div');
    box.className = 'hp-vmap';
    HPV = { sh, box, map: null };
    loadMapLibre()
      .then(gl => hpVecInit(gl, sh))
      .catch(() => hpVecFail(sh));
  }
  el.classList.add('vector');
  el.innerHTML = '';
  el.appendChild(HPV.box);
  if (HPV.map) {
    HPV.map.resize();
    hpVecSync(sh);
  }
}
function hpVecInit(gl, sh) {
  if (!HPV || HPV.sh !== sh || HPV.map) return;
  const pt = hotelPt(sh.h);
  let map;
  try {
    map = new gl.Map({
      container: HPV.box,
      style: HP_STYLE,
      center: [pt.lng, pt.lat],
      zoom: hotelPin(sh.h) ? 15.5 : 14,
      minZoom: 9,
      maxZoom: 19,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: { compact: true },
      fadeDuration: 0
    });
  } catch (e) {
    hpVecFail(sh);
    return;
  }
  map.touchZoomRotate.disableRotation();
  HPV.map = map;
  map.on('load', () => {
    if (!HPV || HPV.map !== map) return;
    HPV.loaded = true;
    try {
      hpVecStyle(map);
      hpVecOverlay(map);
    } catch (e) {
      console.warn('map style', e);
    }
    hpVecSync(sh);
  });
  setTimeout(() => {
    if (HPV && HPV.map === map && !HPV.loaded) hpVecFail(sh);
  }, 10000);
  map.on('click', e => {
    if (S.sheet !== sh) return;
    hpKeep();
    sh.h = { lat: +e.lngLat.lat.toFixed(6), lng: +e.lngLat.lng.toFixed(6) };
    S.keepSheetScroll = true;
    render();
  });
  map.on('zoom', () => hpVecRing());
  hpVecSync(sh);
}
// ---- 플래너 지도 스타일: 앱 색으로 칠하고, 필요 없는 건 숨기고, 지하철·역·걷는 길을 위에 그려요 ----
function hpPalette() {
  return hpDark()
    ? {
        land: '#172036',
        land2: '#1b2540',
        water: '#12324a',
        park: '#1b3a2a',
        bld: '#222c45',
        road: '#2e3a58',
        road2: '#3a4868',
        casing: '#121a2c',
        rail: '#56627a',
        text: '#e6ebf5',
        text2: '#a8b0c2',
        halo: '#0e1424'
      }
    : {
        land: '#fbf8f2',
        land2: '#f4efe6',
        water: '#c9def0',
        park: '#d8eacd',
        bld: '#ece6dc',
        road: '#ffffff',
        road2: '#fff3d6',
        casing: '#ddd5c8',
        rail: '#b8bcc4',
        text: '#15203a',
        text2: '#5a6175',
        halo: '#ffffff'
      };
}
function hpVecStyle(map) {
  const C = hpPalette(),
    hide = new Set([
      'poi',
      'housenumber',
      'mountain_peak',
      'aerodrome_label',
      'aeroway',
      'transportation_name',
      'boundary',
      'waterway_name'
    ]);
  const set = (id, k, v) => {
    try {
      map.setPaintProperty(id, k, v);
    } catch (_) {}
  };
  (map.getStyle().layers || []).forEach(l => {
    const sl = l['source-layer'] || '',
      id = l.id;
    if (l.type === 'background') return set(id, 'background-color', C.land);
    if (hide.has(sl)) {
      try {
        map.setLayoutProperty(id, 'visibility', 'none');
      } catch (_) {}
      return;
    }
    if (l.type === 'fill') {
      if (sl === 'water') set(id, 'fill-color', C.water);
      else if (sl === 'park' || (sl === 'landcover' && /wood|grass|park|forest/.test(id)))
        set(id, 'fill-color', C.park);
      else if (sl === 'building') {
        set(id, 'fill-color', C.bld);
        set(id, 'fill-outline-color', C.bld);
      } else if (sl === 'landuse' || sl === 'landcover') set(id, 'fill-color', C.land2);
    } else if (l.type === 'line') {
      if (sl === 'waterway') set(id, 'line-color', C.water);
      else if (sl === 'transportation') {
        if (/rail|transit/.test(id)) set(id, 'line-color', C.rail);
        else if (/casing/.test(id)) set(id, 'line-color', C.casing);
        else set(id, 'line-color', /motorway|trunk|primary/.test(id) ? C.road2 : C.road);
      }
    } else if (l.type === 'symbol') {
      set(id, 'text-color', sl === 'water_name' ? (hpDark() ? '#7fa7c8' : '#4f7ea6') : C.text);
      set(id, 'text-halo-color', C.halo);
      set(id, 'text-halo-width', 1.4);
    }
  });
  hpVecLang(map);
}
function hpFont(map) {
  const l = (map.getStyle().layers || []).find(x => x.type === 'symbol' && x.layout && x.layout['text-font']);
  return l ? l.layout['text-font'] : ['Noto Sans Regular'];
}
// 지하철 노선·역 (앱 데이터로 직접 그려요) + 숙소 → 가까운 역 걷는 길
function hpVecOverlay(map) {
  const C = hpPalette(),
    before = ((map.getStyle().layers || []).find(l => l.type === 'symbol') || {}).id,
    font = hpFont(map),
    lineOf = {};
  const lines = Object.entries(LINES).map(([k, ln]) => {
    ln.st.forEach(id => (lineOf[id] = lineOf[id] || ln.color));
    return {
      type: 'Feature',
      properties: { c: ln.color },
      geometry: { type: 'LineString', coordinates: ln.st.map(id => [STATIONS[id].lng, STATIONS[id].lat]) }
    };
  });
  const sts = Object.entries(STATIONS)
    .filter(([id]) => lineOf[id])
    .map(([id, st]) => ({
      type: 'Feature',
      properties: { id, c: lineOf[id], t: LANG === 'ja' ? st.j : st.n },
      geometry: { type: 'Point', coordinates: [st.lng, st.lat] }
    }));
  map.addSource('fk-lines', { type: 'geojson', data: { type: 'FeatureCollection', features: lines } });
  map.addSource('fk-st', { type: 'geojson', data: { type: 'FeatureCollection', features: sts } });
  map.addLayer(
    {
      id: 'fk-line-casing',
      type: 'line',
      source: 'fk-lines',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.halo, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 4, 16, 9] }
    },
    before
  );
  map.addLayer(
    {
      id: 'fk-line',
      type: 'line',
      source: 'fk-lines',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'c'], 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2.2, 16, 5.5] }
    },
    before
  );
  map.addLayer({
    id: 'fk-st-dot',
    type: 'circle',
    source: 'fk-st',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 16, 7],
      'circle-color': C.halo,
      'circle-stroke-color': ['get', 'c'],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 16, 3]
    }
  });
  map.addLayer({
    id: 'fk-st-label',
    type: 'symbol',
    source: 'fk-st',
    minzoom: 12.5,
    layout: {
      'text-field': ['get', 't'],
      'text-font': font,
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 17, 14],
      'text-offset': [0, 1.1],
      'text-anchor': 'top',
      'text-optional': true
    },
    paint: { 'text-color': C.text, 'text-halo-color': C.halo, 'text-halo-width': 1.6 }
  });
  if (HPV) HPV.font = font;
}
// 숙소 핀 → 가장 가까운 역까지 점선 + 「○○역까지 도보 N분」 (핀이 바뀔 때마다 새로 만들어요)
function hpVecWalk(sh) {
  const map = HPV && HPV.map;
  if (!map || !HPV.loaded || !map.getLayer('fk-st-dot')) return;
  ['fk-walk-label', 'fk-walk-line'].forEach(id => map.getLayer(id) && map.removeLayer(id));
  ['fk-walk-t', 'fk-walk'].forEach(id => map.getSource(id) && map.removeSource(id));
  if (!hotelPin(sh.h)) return;
  const ns = nearStation(sh.h);
  if (!ns) return;
  const a = [+sh.h.lng, +sh.h.lat],
    b = [ns.st.lng, ns.st.lat];
  // 선과 글자는 따로 둬요 (글꼴을 못 받아도 선은 보이게)
  map.addSource('fk-walk', {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [a, b] } }
  });
  map.addSource('fk-walk-t', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: { t: L(`${ns.st.n}역까지 도보 ${wmin(ns.d)}분`, `${ns.st.j}駅まで徒歩${wmin(ns.d)}分`) },
      geometry: { type: 'Point', coordinates: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }
    }
  });
  map.addLayer(
    {
      id: 'fk-walk-line',
      type: 'line',
      source: 'fk-walk',
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': '#1D8A55', 'line-width': 4, 'line-dasharray': [0.1, 1.8] }
    },
    'fk-st-dot'
  );
  map.addLayer({
    id: 'fk-walk-label',
    type: 'symbol',
    source: 'fk-walk-t',
    layout: {
      'text-field': ['get', 't'],
      'text-font': HPV.font || ['Noto Sans Regular'],
      'text-size': 12.5,
      'text-allow-overlap': true,
      'text-ignore-placement': true
    },
    paint: { 'text-color': '#ffffff', 'text-halo-color': '#1D8A55', 'text-halo-width': 6 }
  });
}
// 지명은 한국어 → 일본어 → 현지 이름 순으로 (일본어 화면이면 일본어)
function hpVecLang(map) {
  const field =
    LANG === 'ja'
      ? ['coalesce', ['get', 'name:ja'], ['get', 'name']]
      : ['coalesce', ['get', 'name:ko'], ['get', 'name:ja'], ['get', 'name']];
  (map.getStyle().layers || []).forEach(l => {
    const tf = l.layout && l.layout['text-field'];
    if (l.type === 'symbol' && tf && /name/.test(JSON.stringify(tf)))
      try {
        map.setLayoutProperty(l.id, 'text-field', field);
      } catch (_) {}
  });
}
function hpVecSync(sh) {
  const gl = window.maplibregl,
    map = HPV && HPV.map;
  if (!gl || !map) return;
  const pt = hotelPt(sh.h),
    pin = hotelPin(sh.h);
  if (sh.recenter) {
    map.jumpTo({ center: [pt.lng, pt.lat], zoom: sh.recenter });
    sh.recenter = 0;
  }
  if (!HPV.pin) {
    const a = document.createElement('div');
    a.className = 'hp-vpin';
    a.innerHTML = `<svg width="32" height="46" viewBox="-16 -42 32 46" aria-hidden="true"><g class="hpk"><ellipse class="hpk-sh" cx="0" cy="1" rx="7" ry="3"/><path d="M0 0C-3 -8 -13 -14 -13 -24A13 13 0 1 1 13 -24C13 -14 3 -8 0 0Z"/><circle cy="-24" r="5"/></g></svg>`;
    HPV.pin = new gl.Marker({ element: a, anchor: 'bottom', offset: [0, 4] });
    const b = document.createElement('div');
    b.className = 'hp-ap';
    b.innerHTML = '<i></i>';
    HPV.ring = new gl.Marker({ element: b, anchor: 'center' });
  }
  hpVecWalk(sh);
  if (pin) {
    HPV.ring.remove();
    HPV.pin.setLngLat([pt.lng, pt.lat]).addTo(map);
  } else {
    HPV.pin.remove();
    HPV.ring.setLngLat([pt.lng, pt.lat]).addTo(map);
    hpVecRing();
  }
}
// 대략 위치 동그라미: 반지름 약 450m
function hpVecRing() {
  if (!HPV || !HPV.map || !HPV.ring) return;
  const el = HPV.ring.getElement(),
    lat = HPV.ring.getLngLat() ? HPV.ring.getLngLat().lat : 33.59,
    mpp = (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (512 * 2 ** HPV.map.getZoom()),
    r = clamp(450 / mpp, 22, 160);
  el.style.width = el.style.height = `${f1(r * 2)}px`;
}
// 다시 그리기 전에 입력칸 값을 시트 상태에 담아 둬요
function hpKeep() {
  const sh = S.sheet;
  if (!sh || sh.type !== 'hpick') return;
  [
    ['hName', 'nm'],
    ['hQ', 'q'],
    ['hPaste', 'paste']
  ].forEach(([id, k]) => {
    const el = document.getElementById(id);
    if (el) sh[k] = el.value;
  });
}
// 숙소 이름으로 찾기 (OpenStreetMap Nominatim · 후쿠오카 주변만)
async function hpSearch(q) {
  const u =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&namedetails=1&bounded=1' +
    '&viewbox=129.95,33.85,130.75,33.30&accept-language=ja&q=' +
    encodeURIComponent(q);
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('http ' + r.status);
  const js = await r.json();
  return js
    .map(x => {
      const nd = x.namedetails || {},
        ja = nd.name || x.name || '',
        ko = nd['name:ko'] || nd['name:en'] || ja;
      const addr = (x.display_name || '')
        .split(', ')
        .filter(p => p && p !== ja && !/^\d{3}-\d{4}$/.test(p) && p !== '日本')
        .reverse()
        .join('');
      return { lat: +(+x.lat).toFixed(6), lng: +(+x.lon).toFixed(6), name: LANG === 'ja' ? ja : ko, ja, addr };
    })
    .filter(x => x.name && isFinite(x.lat));
}
SHEETS.hpick = hpickSheetV;
SHEET_LABEL.hpick = '숙소 위치';
// 계획 화면에서 숙소 관리
function staysSheetV() {
  return (
    shHead(
      L('숙소', '宿'),
      L(
        '날짜별로 묵는 숙소를 정해요. 바꾸면 그날 이동 경로가 새 숙소 기준으로 바뀌어요.',
        '日付ごとに泊まる宿を決めます。変えるとその日の移動ルートが新しい宿に合わせて変わります。'
      )
    ) +
    staysEditorV('plan') +
    `<p class="fine">${L('숙소를 옮기는 날엔 아침에 「숙소 옮기기 · 짐 맡기기」가 자동으로 들어가요. 이미 넣은 장소는 그대로 두고 이동 경로와 시간만 다시 계산해요. 동네 배치까지 새 숙소에 맞추려면 그날의 「다시 짜기」를 눌러 주세요.', '宿を移る日は、朝に「宿の移動・荷物預け」が自動で入ります。入れた場所はそのままで、移動ルートと時間だけ計算し直します。エリアの割り振りも合わせたいときは、その日の「組み直す」を押してください。')}</p>`
  );
}
SHEETS.stays = staysSheetV;
SHEET_LABEL.stays = '숙소';
// 일차 카드에 보이는 숙소 한 줄
function dayHotelRow(p, di) {
  const N = p.days.length;
  if (N < 2) return '';
  const prev = di > 0 ? nightHotel(p, di - 1) : null,
    cur = di < N - 1 ? nightHotel(p, di) : null;
  let t;
  if (cur && prev && !sameHotel(prev, cur))
    t = `${L('숙소 옮기는 날', '宿を移る日')} · ${esc(hotelLabelT(prev))} → ${esc(hotelLabelT(cur))}`;
  else if (cur) t = `${L('오늘 밤', '今夜の宿')} · ${esc(hotelLabelT(cur))}`;
  else t = `${L('체크아웃', 'チェックアウト')} · ${esc(hotelLabelT(prev))}`;
  return `<button class="dc-hotel" data-act="staysSheet">${ic('home')}<span>${t}</span>${ic('next', 'chev')}</button>`;
}
Object.assign(A, {
  staysSheet() {
    S.sheet = { type: 'stays' };
    render();
  },
  stayPick(d) {
    const st = stayCtx(d.ctx).get(),
      k = Number(d.k);
    if (!st[k]) return;
    const h = clone(st[k].h);
    S.sheet = { type: 'hpick', ctx: d.ctx, k, h, tab: 'find', back: d.ctx === 'plan' ? 'stays' : null };
    if (h.name && !hotelPin(h)) S.sheet.q = h.name;
    render();
  },
  hpPick(d) {
    hpKeep();
    const [t, v] = d.v.split(':');
    S.sheet.h = t === 'k' ? { k: v } : { st: v };
    S.sheet.view = null;
    S.sheet.tv = null;
    S.sheet.recenter = 14;
    S.keepSheetScroll = true;
    render();
  },
  hpTab(d) {
    hpKeep();
    S.sheet.tab = d.t;
    S.keepSheetScroll = true;
    render();
    const f = document.getElementById(d.t === 'find' ? 'hQ' : d.t === 'paste' ? 'hPaste' : '');
    if (f && !f.value) f.focus();
  },
  hpZoom(d) {
    const sh = S.sheet;
    if (!sh || sh.type !== 'hpick') return;
    if (hpMode(sh) === 'vector') {
      if (HPV && HPV.map) Number(d.n) > 0 ? HPV.map.zoomIn() : HPV.map.zoomOut();
      return;
    }
    if (hpUseTiles(sh)) {
      const v = hpTileView(sh);
      v.z = clamp(v.z + (Number(d.n) > 0 ? 1 : -1), HP_ZMIN, HP_ZMAX);
    } else {
      const v = hpView(sh);
      v.span = clamp(v.span * (Number(d.n) > 0 ? 0.6 : 1 / 0.6), 0.5, 14);
    }
    hpRedraw(document.getElementById('hpmap'));
  },
  async hpFind() {
    hpKeep();
    const sh = S.sheet,
      q = (sh.q || '').trim();
    if (!q) {
      const f = document.getElementById('hQ');
      if (f) f.focus();
      return;
    }
    Object.assign(sh, { busy: true, err: '', res: null });
    S.keepSheetScroll = true;
    render();
    try {
      const res = await hpSearch(q);
      if (S.sheet !== sh) return;
      sh.res = res;
    } catch (e) {
      if (S.sheet !== sh) return;
      sh.err = L(
        '지금은 찾을 수 없어요. 인터넷 연결을 확인하거나, 좌표 붙여넣기·지도에서 직접 찍기를 써 주세요.',
        '今は検索できません。接続を確認するか、座標の貼り付け・地図で直接タップを使ってください。'
      );
    }
    sh.busy = false;
    hpKeep();
    S.keepSheetScroll = true;
    render();
  },
  hpRes(d) {
    hpKeep();
    const sh = S.sheet,
      r = sh.res && sh.res[Number(d.i)];
    if (!r) return;
    sh.h = { lat: r.lat, lng: r.lng, addr: r.ja && r.addr ? r.addr : undefined };
    if (!sh.h.addr) delete sh.h.addr;
    if (!(sh.nm || '').trim()) sh.nm = r.name;
    sh.view = { lat: r.lat, lng: r.lng, span: 1.4 };
    sh.tv = { lat: r.lat, lng: r.lng, z: 17 };
    sh.recenter = 16;
    S.keepSheetScroll = true;
    render();
    toast(L('지도에서 핀 위치가 맞는지 확인해 주세요.', '地図でピンの位置が合っているか確認してください。'));
  },
  hpPaste() {
    hpKeep();
    const sh = S.sheet,
      t = sh.paste || '';
    if (/goo\.gl|maps\.app/.test(t) && !/\d{2}\.\d{3}/.test(t)) {
      toast(
        L(
          '짧은 공유 링크에는 좌표가 없어요. 지도를 꾹 눌러 나온 숫자 좌표를 복사해 주세요.',
          '短い共有リンクには座標がありません。地図を長押しして出る数字の座標をコピーしてください。'
        )
      );
      return;
    }
    const g = parseLatLng(t);
    if (!g || g.far) {
      toast(
        g
          ? L(
              '후쿠오카에서 너무 먼 좌표예요. 숫자를 다시 확인해 주세요.',
              '福岡から遠すぎる座標です。数字を確認してください。'
            )
          : L(
              '좌표를 못 찾았어요. 「33.5905, 130.4207」처럼 숫자 두 개를 붙여 넣어 주세요.',
              '座標が見つかりません。「33.5905, 130.4207」のように数字を2つ貼り付けてください。'
            )
      );
      return;
    }
    sh.h = { lat: +g.lat.toFixed(6), lng: +g.lng.toFixed(6) };
    sh.view = { lat: g.lat, lng: g.lng, span: 1.4 };
    sh.tv = { lat: g.lat, lng: g.lng, z: 17 };
    sh.recenter = 16;
    S.keepSheetScroll = true;
    render();
  },
  hpSave() {
    hpKeep();
    const sh = S.sheet,
      name = (sh.nm || '').trim().slice(0, 40);
    const h = { ...sh.h };
    delete h.name;
    if (name) h.name = name;
    const c = stayCtx(sh.ctx),
      st = c.get().map(x => ({ ...x }));
    if (!st[sh.k]) return;
    st[sh.k].h = h;
    c.set(st);
    S.sheet = sh.back ? { type: sh.back } : null;
    render();
    toast(
      sh.ctx === 'plan'
        ? L(
            `${hotelLabelT(h)}(으)로 바꾸고 이동 경로를 다시 계산했어요.`,
            `${hotelLabelT(h)}に変えて、移動ルートを計算し直しました。`
          )
        : L(`${hotelLabelT(h)}(으)로 정했어요.`, `${hotelLabelT(h)}に決めました。`)
    );
  },
  stayAdd(d) {
    const c = stayCtx(d.ctx),
      st = c.get().map(x => ({ ...x }));
    let k = st.length - 1;
    while (k >= 0 && st[k].n1 <= st[k].n0) k--;
    if (k < 0) {
      toast(L('나눌 수 있는 밤이 없어요.', '分けられる夜がありません。'));
      return;
    }
    const x = st[k],
      b = x.n0 + Math.ceil((x.n1 - x.n0 + 1) / 2);
    st.splice(k + 1, 0, { n0: b, n1: x.n1, h: clone(x.h) });
    x.n1 = b - 1;
    c.set(st);
    A.stayPick({ ctx: d.ctx, k: k + 1 });
  },
  stayDel(d) {
    const c = stayCtx(d.ctx),
      st = c.get().map(x => ({ ...x })),
      k = Number(d.k);
    if (k < 1 || !st[k]) return;
    st[k - 1].n1 = st[k].n1;
    st.splice(k, 1);
    c.set(st);
    S.keepSheetScroll = true;
    render();
  }
});
function stayFromChange(t) {
  const c = stayCtx(t.dataset.ctx),
    st = c.get().map(x => ({ ...x })),
    k = Number(t.dataset.k),
    b = Number(t.value);
  if (!st[k] || !st[k - 1]) return;
  st[k - 1].n1 = b - 1;
  st[k].n0 = b;
  c.set(st);
  S.keepSheetScroll = true;
  render();
}
// 숙소 찾기·좌표 칸에서 엔터를 누르면 바로 찾기/적용
$app.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.isComposing) return;
  if (e.target.id === 'hQ') {
    e.preventDefault();
    A.hpFind();
  } else if (e.target.id === 'hPaste') {
    e.preventDefault();
    A.hpPaste();
  }
});
