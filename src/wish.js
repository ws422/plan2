// ======================================================================
// wish.js · 가고 싶은 곳 (직접 고르기)
// - 동네 탭: 「＋ 직접 장소 추가」 버튼, 「가고 싶은 곳」 탭(담은 곳 모아 보기)
// - 동네 둘러보기 시트: 명소 옆 ＋로 담기
// - 직접 장소 추가: 숙소 위치 시트(stays.js)를 ctx 'wish' 로 같이 써요 (지도·이름으로 찾기·구글 좌표·동네)
// - 새 여행: 날짜 다음에 「어떻게 짤까요?」(자동 / 가고 싶은 곳으로) → 가고 싶은 곳으로 짜기 화면
// - 계획 만들기 계산은 engine.js 의 createPlanWish
// 가고 싶은 곳은 계획과 따로 이 폰에 저장돼요 (localStorage 'fk-wish'). 계획을 지워도 남아요.
// 한 곳의 모양: 앱 장소 { id, sid } · 직접 넣은 곳 { id, n, c(종류), stay, lat, lng, z, a(동네), ap(대략 위치면 1) }
// 고치는 법: docs/수정가이드.md
// ======================================================================
const WISH_KEY = 'fk-wish';
// 종류별 기본 머무는 시간(분)
const WISH_STAY = { food: 60, cafe: 45, sight: 60, shop: 60, nature: 60, onsen: 90, free: 60 };
function wishLoad() {
  const v = lsGet(WISH_KEY, []);
  return Array.isArray(v)
    ? v.filter(w => w && w.id && (w.sid ? SPOT[w.sid] : isFinite(w.lat) && isFinite(w.lng) && w.n))
    : [];
}
function wishSave() {
  lsSet(WISH_KEY, S.wish);
}
S.wish = wishLoad();
function wishId() {
  return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function wishHas(sid) {
  return S.wish.some(w => w.sid === sid);
}
function wishName(w) {
  return w.sid ? SPOT[w.sid].n : w.n;
}
// 일본어 화면용 이름 (앱 장소는 일본어 이름, 직접 넣은 곳은 적은 그대로)
function wishNameT(w) {
  return w.sid && LANG === 'ja' ? SPOT[w.sid].j || SPOT[w.sid].n : wishName(w);
}
function wishArea(w) {
  return w.sid ? SPOT[w.sid].a : w.a && AREA[w.a] ? w.a : areaNear(w).id;
}
function wishKind(w) {
  return w.sid ? SPOT[w.sid].c : w.c || 'free';
}
function wishStay(w) {
  return w.sid ? SPOT[w.sid].s : w.stay || 60;
}
function wishKinds() {
  return [
    ['food', L('식사', '食事')],
    ['cafe', L('카페', 'カフェ')],
    ['sight', L('구경', '観光')],
    ['shop', L('쇼핑', 'ショッピング')],
    ['free', L('기타', 'その他')]
  ];
}
function wishKindName(k) {
  const m = Object.fromEntries(wishKinds());
  return m[k] || (CATS[k] ? CATS[k].n : m.free);
}
function areaNameT(id) {
  return L(AREA[id].n, AREA_JA[id] || AREA[id].n);
}
// 한 줄 설명: 앱 장소는 「맛집 · 40분」, 직접 넣은 곳은 「텐진 근처 · 식사 · 1시간 30분」
// (글자 조각마다 따로 감싸야 일본어 화면에서 하나씩 바뀌어요)
function wishMeta(w) {
  if (w.sid) return `<span>${CATS[SPOT[w.sid].c].n}</span> · <span>${dur(SPOT[w.sid].s)}</span>`;
  const near = L(`${areaNameT(wishArea(w))} ${w.ap ? '쯤' : '근처'}`, `${areaNameT(wishArea(w))}${w.ap ? 'あたり' : '周辺'}`);
  return `<span>${esc(near)}</span> · <span>${wishKindName(w.c)}</span> · <span>${dur(w.stay)}</span>`;
}
// 동네별로 묶기 (동네 순서는 AREAS 순서)
function wishGroups(list) {
  const by = {};
  list.forEach(w => (by[wishArea(w)] = by[wishArea(w)] || []).push(w));
  return AREAS.filter(a => by[a.id]).map(a => ({ a, ws: by[a.id] }));
}
// 동네 둘러보기·추천 목록의 ＋/✓ 버튼
function wishPlusBtn(sid) {
  const on = wishHas(sid),
    n = SPOT[sid].n;
  return `<button class="w-plus${on ? ' on' : ''}" data-act="wishToggle" data-sid="${sid}" aria-pressed="${on}" aria-label="${esc(on ? L(`${n} 가고 싶은 곳에서 빼기`, `${SPOT[sid].j || n}を行きたい所から外す`) : L(`${n} 가고 싶은 곳에 담기`, `${SPOT[sid].j || n}を行きたい所に入れる`))}">${ic(on ? 'check' : 'plus')}</button>`;
}

// ---- 동네 탭: 「가고 싶은 곳」 ----
function wishRowV(w, tail) {
  const name = esc(wishName(w)),
    head = w.sid
      ? `<button class="w-t" data-act="spotSheet" data-id="${w.sid}"><b>${name}</b><small>${wishMeta(w)}</small></button>`
      : `<span class="w-t"><b><span data-notr>${name}</span><i class="w-u">${L('직접 추가', '直接追加')}</i></b><small>${wishMeta(w)}</small></span>`;
  return `<li class="w-row">${catTile(wishKind(w))}${head}${tail}</li>`;
}
function wishDelBtn(w) {
  return `<button class="w-x" data-act="wishDel" data-id="${w.id}" aria-label="${esc(L(`${wishName(w)} 빼기`, `${wishNameT(w)}を外す`))}">${ic('close')}</button>`;
}
function wishTabV() {
  const W = S.wish;
  const add = `<button class="w-addline" data-act="wishAdd">${ic('plus')}${L('직접 장소 추가', '場所を直接追加')}</button>`;
  if (!W.length)
    return `<div class="w-empty">${ic('star')}<b>${L('아직 담은 곳이 없어요', 'まだ何も入っていません')}</b><small>${L('동네를 눌러 명소 옆 ＋로 담거나, 목록에 없는 곳은 직접 추가해요. 담은 곳으로 계획을 짤 수 있어요.', 'エリアを押して見どころの＋で入れるか、リストにない場所は直接追加します。入れた場所で計画を作れます。')}</small></div>${add}`;
  return `<div class="w-top">${ic('star')}<span>${L(`<b>가고 싶은 곳 ${W.length}곳</b> · 계획을 짤 때 이곳들을 먼저 넣고, 동선·시간을 맞춰 짜요.`, `<b>行きたい所 ${W.length}か所</b> · 計画を作るときにここを先に入れ、ルートと時間を合わせます。`)}</span></div>
    ${wishGroups(W)
      .map(
        g =>
          `<div class="w-grp">${ic('pin')}${esc(areaNameT(g.a.id))} <i>${L(`${g.ws.length}곳`, `${g.ws.length}か所`)}</i></div><ul class="w-list">${g.ws.map(w => wishRowV(w, wishDelBtn(w))).join('')}</ul>`
      )
      .join('')}
    ${add}
    <div class="w-cta"><button class="btn pri big" data-act="wishPlan">${ic('shuffle')}${L(`이 장소들로 계획 짜기 · ${W.length}곳`, `この場所で計画を作る · ${W.length}か所`)}</button></div>`;
}

// ---- 직접 장소 추가 시트 (stays.js 의 hpickSheetV 가 ctx 'wish' 일 때 부르는 조각) ----
function wishCautionV(hot) {
  return `<div class="w-caution${hot ? ' hot' : ''}"><h4>${ic('alert')}${L('이름으로 안 나오면 이렇게 해 주세요', '名前で出ないときは')}</h4><ol>
    <li><b>${L('한국어 이름으로는 작은 가게가 잘 안 나와요.', '韓国語の名前では小さなお店はほとんど出ません。')}</b> ${L('일본어·영어 이름으로 다시 찾아 보세요.', '日本語・英語の名前でもう一度探してください。')}<small>${L('구글 지도에서 가게를 열면 일본어 이름이 보여요', 'Googleマップでお店を開くと日本語名が見られます')}</small></li>
    <li><b>${L('그래도 안 나오면 「구글 좌표」 탭에서 구글 지도 좌표로 등록해 주세요.', 'それでも出なければ「Google座標」タブでGoogleマップの座標を登録してください。')}</b></li></ol>
    <button class="w-gbtn" data-act="hpTab" data-t="paste">${ic('pin')}${L('구글 좌표로 등록하기', 'Google座標で登録する')}${ic('next')}</button></div>`;
}
function wishKindV(sh) {
  const k = sh.kind || 'food',
    st = sh.stay || WISH_STAY[k] || 60,
    mins = [...new Set([30, 45, 60, 90, 120, 180, st])].sort((a, b) => a - b);
  return `<div class="w-kind"><div class="fld"><span>${L('종류', '種類')} <small>${L('· 식사면 점심·저녁 시간에 맞춰 넣어요', '· 食事ならお昼・夕食の時間に入れます')}</small></span>
      <div class="chips-sel">${wishKinds()
        .map(([v, t]) => `<button class="${k === v ? 'on' : ''}" data-act="wKind" data-k="${v}" aria-pressed="${k === v}">${t}</button>`)
        .join('')}</div></div>
    <label class="fld"><span>${L('머무는 시간', '滞在時間')}</span><select data-change="wStay">${mins.map(m => `<option value="${m}"${m === st ? ' selected' : ''}>${dur(m)}</option>`).join('')}</select></label></div>`;
}
// 앱에 있는 장소 중 이름이 맞는 곳 (한국어·일본어 이름 모두, 띄어 쓴 낱말이 다 들어 있으면)
function wishNorm(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/[\s·・\-_.,()（）]/g, '');
}
function wishLocal(q) {
  const toks = String(q || '')
    .split(/\s+/)
    .map(wishNorm)
    .filter(Boolean);
  if (!toks.length) return [];
  return SPOTS.filter(s => {
    const hay = wishNorm(s.n) + '|' + wishNorm(s.j) + '|' + wishNorm(AREA[s.a].n) + '|' + wishNorm(AREA_JA[s.a]);
    return toks.every(t => hay.includes(t)) && toks.some(t => wishNorm(s.n).includes(t) || wishNorm(s.j).includes(t));
  })
    .sort((a, b) => (b.p || 3) - (a.p || 3))
    .slice(0, 5)
    .map(s => ({
      lat: s.lat,
      lng: s.lng,
      name: LANG === 'ja' ? s.j || s.n : s.n,
      ja: s.j,
      addr: L(`앱에 있는 장소 · ${AREA[s.a].n}`, `アプリ内の場所 · ${AREA_JA[s.a] || AREA[s.a].n}`),
      sid: s.id
    }));
}
// OpenStreetMap 결과의 종류 → 식사·카페·쇼핑·구경
function osmKind(x) {
  const c = x.category,
    t = x.type;
  if (['restaurant', 'fast_food', 'food_court', 'bar', 'pub', 'biergarten'].includes(t)) return 'food';
  if (['cafe', 'ice_cream'].includes(t)) return 'cafe';
  if (c === 'shop' || ['mall', 'department_store', 'marketplace'].includes(t)) return 'shop';
  if (
    ['tourism', 'historic', 'leisure'].includes(c) ||
    ['place_of_worship', 'museum', 'attraction', 'viewpoint', 'park', 'theatre'].includes(t)
  )
    return 'sight';
  return null;
}
function wishSheetSave(sh) {
  const name = (sh.nm || '').trim().slice(0, 40),
    h = sh.h,
    pin = hotelPin(h);
  if (!name) {
    toast(L('장소 이름을 적어 주세요.', '場所の名前を入力してください。'));
    const el = document.getElementById('hName');
    if (el) el.focus();
    return;
  }
  if (!pin && !sh.picked) {
    toast(
      L(
        '위치를 정해 주세요. 이름으로 찾거나, 지도를 누르거나, 구글 좌표·동네로 정할 수 있어요.',
        '場所を決めてください。名前で探す・地図をタップ・Google座標・エリアで決められます。'
      )
    );
    return;
  }
  const pt = hotelPt(h),
    a = areaNear(pt);
  let w;
  const same = sh.sid && pin && Math.abs(+h.lat - SPOT[sh.sid].lat) < 1e-5 && Math.abs(+h.lng - SPOT[sh.sid].lng) < 1e-5;
  if (same) {
    if (wishHas(sh.sid)) {
      toast(L('이미 가고 싶은 곳에 있어요.', 'すでに行きたい所に入っています。'));
      return wishSheetClose(sh);
    }
    w = { id: wishId(), sid: sh.sid };
  } else {
    const k = sh.kind || 'food';
    w = {
      id: wishId(),
      n: name,
      c: k,
      stay: Number(sh.stay) || WISH_STAY[k] || 60,
      lat: +(+pt.lat).toFixed(6),
      lng: +(+pt.lng).toFixed(6),
      z: a.z,
      a: a.id
    };
    if (!pin) w.ap = 1;
  }
  S.wish.push(w);
  wishSave();
  wishSheetClose(sh);
  toast(L(`가고 싶은 곳에 담았어요 · ${wishName(w)}`, `行きたい所に入れました · ${wishNameT(w)}`));
}
function wishSheetClose(sh) {
  S.sheet = sh.backSh ? { ...sh.backSh } : null;
  if (sh.from === 'areas') S.aseg = 'wish';
  S.keepSheetScroll = !!sh.backSh;
  render();
}

// ---- 새 여행: 어떻게 짤까요? (자동 / 가고 싶은 곳으로) ----
function draftSet(D) {
  return {
    start: D.start,
    end: D.end,
    hotel: D.hotel,
    stays: D.stays,
    arrive: D.arrive,
    depart: D.depart,
    dayStart: D.dayStart,
    dayEnd: D.dayEnd
  };
}
function draftSub() {
  const D = S.draft;
  return `${mds(D.start)} – ${mds(D.end)} · ${nights(draftCaps().N)}`;
}
function howV() {
  const D = S.draft,
    how = D.how || (S.wish.length ? 'wish' : 'auto'),
    n = S.wish.length;
  const card = (v, icon, t, sub, pts, extra) =>
    `<button class="how-c${how === v ? ' on' : ''}" data-act="howPick" data-v="${v}" aria-pressed="${how === v}"><span class="how-i">${ic(icon)}</span>
      <span class="how-b"><b>${t}</b><small>${sub}</small><span class="how-l">${pts.map(p => `<span>${ic('check')}${p}</span>`).join('')}</span>${extra || ''}</span>
      <span class="how-r">${how === v ? ic('check') : ''}</span></button>`;
  return (
    appbar({ back: 'toDates', title: L('어떻게 짤까요?', 'どう作りますか?'), sub: draftSub() }) +
    progress(2) +
    `<main class="scr flow">
    <p class="how-p">${L('어느 쪽이든 이동 시간·문 여는 시간·식사 시간·막차까지 계산해서 짜요.', 'どちらでも移動時間・営業時間・食事の時間・終電まで計算して作ります。')}</p>
    ${card('auto', 'spark', L('자동으로 짜기', '自動で作る'), L('동네만 고르면 장소·순서·시간을 앱이 다 짜요.', 'エリアを選ぶだけで、場所・順番・時間をアプリが作ります。'), [L('처음 가는 후쿠오카라 잘 모를 때', '初めての福岡でよくわからないとき'), L('고르는 시간 없이 빨리', '選ぶ時間なしですぐに')])}
    ${card(
      'wish',
      'pen',
      L('가고 싶은 곳으로 짜기', '行きたい所で作る'),
      L('담아 둔 곳을 날짜에 나누고, 가장 좋은 동선·시간으로 짜요.', '入れておいた場所を日ごとに分け、いちばん良いルートと時間で作ります。'),
      [
        L('앱 추천 장소 + 내가 찾은 곳', 'アプリのおすすめ + 自分で見つけた場所'),
        L('꼭 갈 곳 ★ · 예약한 곳은 날짜·시간 고정', '必ず行く所★ · 予約した所は日時を固定')
      ],
      `<em class="how-n">${n ? L(`가고 싶은 곳 ${n}곳이 담겨 있어요`, `行きたい所が${n}か所入っています`) : L('다음 화면에서 담을 수 있어요', '次の画面で入れられます')}</em>`
    )}
  </main>
  <div class="cta"><button class="btn pri big" data-act="howNext">${how === 'wish' ? L('다음 · 가고 싶은 곳 확인', '次へ · 行きたい所を確認') : L('다음 · 동네 고르기', '次へ · エリアを選ぶ')}</button></div>`
  );
}
// 가고 싶은 곳이 일정에 얼마나 차는지 (하루 쓸 수 있는 시간 합 대비)
function wishCaps() {
  const D = S.draft,
    shell = planShell(draftSet(D), []),
    total = shell.days.reduce((t, d, i) => t + dayCap(shell, i), 0);
  const zones = new Set();
  let need = 0;
  S.wish.forEach(w => {
    need += wishStay(w) + 15;
    const z = w.sid ? SPOT[w.sid].z : w.z || 'city';
    if (z !== 'city') zones.add(z);
  });
  zones.forEach(z => (need += 2 * accessMin(z)));
  return { total, need, days: shell.days };
}
const WISH_TIMES = (() => {
  const r = [];
  for (let m = 7 * 60; m <= 23 * 60; m += 30) r.push(m);
  return r;
})();
// ---- 가고 싶은 곳 지도 (화면 맨 위) ----
// 담은 곳을 핀으로 보여 줘요. 핀은 모두 남색, ★ 꼭 갈 곳만 빨강. 안의 흰 아이콘으로 종류를 알아봐요.
// 시내 밖(다자이후 등)에 담은 곳이 있으면 처음엔 시내만 크게, 위 버튼으로 전체·동네별로 바꿔 봐요.
// 지도 그리기는 maps.js 의 drawWpMap (진짜 지도 MapLibre · 못 불러오면 안내 지도)
function wpData() {
  const D = S.draft,
    ws = D.wset || {};
  const items = S.wish.map(w => {
    const p = w.sid ? SPOT[w.sid] : w;
    return { w, id: w.id, lat: p.lat, lng: p.lng, z: (w.sid ? SPOT[w.sid].z : w.z) || 'city', a: wishArea(w), o: ws[w.id] || {} };
  });
  const city = items.filter(i => i.z === 'city'),
    by = {};
  items.filter(i => i.z !== 'city').forEach(i => (by[i.a] = by[i.a] || []).push(i));
  const far = AREAS.filter(a => by[a.id]).map(a => ({ a, list: by[a.id] }));
  let hotel;
  try {
    hotel = hotelPt(nightHotel({ set: draftSet(D) }, 0));
  } catch (e) {
    hotel = PLACES.hotel.hakata;
  }
  return { items, city, far, hotel };
}
function wpView(d = wpData()) {
  let v = S.draft.wpView || (d.city.length ? 'city' : 'all');
  if (v === 'city' && !d.city.length) v = 'all';
  if (v !== 'all' && v !== 'city' && !d.far.some(f => f.a.id === v)) v = d.city.length ? 'city' : 'all';
  if (v === 'all' && !d.far.length) v = 'city';
  return v;
}
function wpShown(d, v) {
  return v === 'all' ? d.items : v === 'city' ? d.city : (d.far.find(f => f.a.id === v) || { list: [] }).list;
}
function wDayOpts(cap, cur) {
  return (
    `<option value="">${L('아무 날', 'いつでも')}</option>` +
    cap.days.map((d, k) => `<option value="${k}"${cur === k ? ' selected' : ''}>${L(`${k + 1}일차`, `${k + 1}日目`)} · ${mds(d.date)}</option>`).join('')
  );
}
function wpMapV(cap) {
  if (!S.wish.length) return '';
  const d = wpData(),
    v = wpView(d),
    sel = d.items.find(i => i.id === S.draft.wpSel);
  const segs = d.far.length
    ? [['all', L(`전체 ${d.items.length}`, `すべて ${d.items.length}`)], d.city.length ? ['city', L(`시내 ${d.city.length}`, `市内 ${d.city.length}`)] : null, ...d.far.map(f => [f.a.id, `${areaNameT(f.a.id)} ${f.list.length}`])].filter(Boolean)
    : [];
  const seg = segs.length
    ? `<div class="wpm-seg" role="group" aria-label="${L('지도 범위', '地図の範囲')}">${segs.map(([k, t]) => `<button class="${v === k ? 'on' : ''}" data-act="wpView" data-v="${k}" aria-pressed="${v === k}">${esc(t)}</button>`).join('')}</div>`
    : '';
  const nFar = d.far.reduce((t, f) => t + f.list.length, 0);
  const edge =
    v === 'city' && d.far.length && !sel
      ? `<button class="wpm-edge" data-act="wpView" data-v="${d.far.length === 1 ? d.far[0].a.id : 'all'}">${
          d.far.length === 1
            ? esc(L(`${areaNameT(d.far[0].a.id)} ${nFar}곳 보기`, `${areaNameT(d.far[0].a.id)} ${nFar}か所を見る`))
            : esc(L(`시내 밖 ${nFar}곳 보기`, `市外 ${nFar}か所を見る`))
        }${ic('next')}</button>`
      : '';
  const mine = d.items.some(i => !i.w.sid);
  const leg = sel
    ? ''
    : `<div class="wpm-leg" aria-hidden="true"><span><i class="lp must"></i>${L('꼭 갈 곳', '必ず行く')}</span><span><i class="lp"></i>${L('담은 곳', '入れた所')}</span>${v === 'city' ? `<span><i class="lh">${ic('home')}</i>${L('숙소', '宿')}</span>` : ''}${mine ? `<span><i class="lm"></i>${L('직접 추가', '直接追加')}</span>` : ''}</div>`;
  let card = '';
  if (sel) {
    const w = sel.w,
      o = sel.o,
      day = o.day != null && o.day < cap.days.length ? o.day : null;
    card = `<div class="wpm-card">
      ${catTile(wishKind(w))}
      <span class="t"><b>${w.sid ? esc(wishName(w)) : `<span data-notr>${esc(wishName(w))}</span>`}</b><small>${w.sid ? `<span>${esc(areaNameT(sel.a))}</span> · ` : ''}${wishMeta(w)}</small></span>
      <button class="ib xs wpm-x" data-act="wpSel" data-id="" aria-label="${L('닫기', '閉じる')}">${ic('close')}</button>
      <span class="acts"><button class="wpm-star${o.must ? ' on' : ''}" data-act="wMust" data-id="${w.id}" aria-pressed="${!!o.must}">${ic('star')}${L('꼭 갈 곳', '必ず行く')}</button><select data-change="wDay" data-id="${w.id}" aria-label="${L('날짜 고정', '日付の固定')}" class="${day != null ? 'set' : ''}">${wDayOpts(cap, day)}</select><button class="wpm-del" data-act="wishDel" data-id="${w.id}">${L('빼기', '外す')}</button></span>
    </div>`;
  }
  return `<div class="wpm${sel ? ' has-card' : ''}" id="wpm"><div class="wpm-map" id="wpmap" role="img" aria-label="${L('가고 싶은 곳 지도', '行きたい所の地図')}"></div>${seg}<div class="map-ctl"><button class="ib sm" data-act="wpZoom" data-n="1" aria-label="${L('확대', '拡大')}">${ic('plus')}</button><button class="ib sm" data-act="wpZoom" data-n="-1" aria-label="${L('축소', '縮小')}">${ic('minus')}</button></div>${edge}${leg}${card}</div>`;
}

function wplanV() {
  const D = S.draft,
    ws = D.wset || (D.wset = {}),
    W = S.wish,
    cap = wishCaps(),
    pct = cap.total ? Math.round((cap.need / cap.total) * 100) : 0,
    fill = D.fill !== false;
  const msg = !W.length
    ? L('가고 싶은 곳을 담아 주세요', '行きたい所を入れてください')
    : pct <= 70
      ? fill
        ? L('여유 있어요 · 빈 시간은 추천으로 채워요', '余裕あり · 空き時間はおすすめで埋めます')
        : L('여유 있어요 · 더 담아도 돼요', '余裕あり · もっと入れてもOK')
      : pct <= 100
        ? L('일정에 딱 맞아요', 'ちょうどいい量です')
        : L('빠듯해요 · ★ 아닌 곳은 보류함으로 갈 수 있어요', 'きつめ · ★以外は保留箱に入ることがあります');
  const dayOpts = cur => wDayOpts(cap, cur);
  const atOpts = cur =>
    `<option value="">${L('시간 아무 때', '時間はいつでも')}</option>` +
    WISH_TIMES.map(m => `<option value="${m}"${cur === m ? ' selected' : ''}>${fmt(m)}</option>`).join('');
  const row = w => {
    const o = ws[w.id] || {},
      day = o.day != null && o.day < cap.days.length ? o.day : null;
    const tail = `<button class="w-x" data-act="wishDel" data-id="${w.id}" aria-label="${esc(L(`${wishName(w)} 빼기`, `${wishNameT(w)}を外す`))}">${ic('close')}</button>`;
    return `<li class="w-row wp${D.wpSel === w.id ? ' hl' : ''}">
      <button class="w-star${o.must ? ' on' : ''}" data-act="wMust" data-id="${w.id}" aria-pressed="${!!o.must}" aria-label="${esc(L(`${wishName(w)} 꼭 갈 곳`, `${wishNameT(w)} 必ず行く所`))}">${ic('star')}</button>
      <button class="w-ct" data-act="wpSel" data-id="${w.id}" data-from="list" aria-label="${esc(L(`${wishName(w)} 지도에서 보기`, `${wishNameT(w)}を地図で見る`))}">${catTile(wishKind(w))}</button>
      <span class="w-t"><b data-act="wpSel" data-id="${w.id}" data-from="list">${w.sid ? esc(wishName(w)) : `<span data-notr>${esc(wishName(w))}</span><i class="w-u">${L('직접 추가', '直接追加')}</i>`}</b><small>${wishMeta(w)}</small>
        <span class="w-fix"><select data-change="wDay" data-id="${w.id}" aria-label="${L('날짜 고정', '日付の固定')}" class="${day != null ? 'set' : ''}">${dayOpts(day)}</select>${day != null ? `<select data-change="wAt" data-id="${w.id}" aria-label="${L('시간 고정', '時間の固定')}" class="${o.at != null ? 'set' : ''}">${atOpts(o.at)}</select>` : ''}</span></span>
      ${tail}</li>`;
  };
  const list = W.length
    ? `<p class="w-hint">${ic('star')}<span>${L('★ 꼭 갈 곳은 시간이 모자라도 빼지 않아요 · 날짜를 안 고르면 앱이 가까운 곳끼리 묶어요', '★必ず行く所は時間が足りなくても外しません · 日付を選ばなければ近い所どうしでまとめます')}</span></p>
      ${wishGroups(W)
        .map(g => `<div class="w-grp">${ic('pin')}${esc(areaNameT(g.a.id))} <i>${L(`${g.ws.length}곳`, `${g.ws.length}か所`)}</i></div><ul class="w-list">${g.ws.map(row).join('')}</ul>`)
        .join('')}`
    : `<div class="w-empty">${ic('star')}<b>${L('아직 담은 곳이 없어요', 'まだ何も入っていません')}</b><small>${L('추천 장소에서 고르거나, 목록에 없는 곳은 직접 추가해요.', 'おすすめから選ぶか、リストにない場所は直接追加します。')}</small></div>`;
  return (
    appbar({ back: 'toHow', title: L(`가고 싶은 곳 ${W.length}곳`, `行きたい所 ${W.length}か所`), sub: draftSub() }) +
    progress(3) +
    `<main class="scr flow wplan">
    ${wpMapV(cap)}
    ${list}
    <div class="row2 w-adds"><button class="btn soft" data-act="wpickSheet">${ic('star')}${L('추천 장소 담기', 'おすすめから入れる')}</button><button class="btn soft" data-act="wishAdd">${ic('pin')}${L('직접 장소 추가', '場所を直接追加')}</button></div>
    <button class="w-tog" data-act="wFill" role="switch" aria-checked="${fill}"><span><b>${L('빈 시간은 추천 장소로 채우기', '空き時間はおすすめで埋める')}</b><small>${L('담은 곳 사이에 시간이 남으면 근처 맛집·명소를 넣어요', '入れた場所の間に時間が余れば、近くのお店・見どころを入れます')}</small></span><i class="w-sw${fill ? ' on' : ''}"></i></button>
  </main>
  <div class="cta">
    <div class="meter"><div class="m-t"><b>${L(`${W.length}곳`, `${W.length}か所`)}</b><span class="${pct > 100 ? 'warn-t' : ''}">${msg}</span></div>
    <div class="bar"><i style="width:${Math.min(100, pct)}%" class="${pct > 100 ? 'over' : ''}"></i></div></div>
    <button class="btn pri big" data-act="generateWish" ${W.length ? '' : 'disabled'}>${ic('shuffle')}${L('최적 동선으로 계획 짜기', '最適ルートで計画を作る')}</button>
  </div>`
  );
}

// ---- 시트: 추천 장소 담기 (동네·종류로 거르고 이름으로 찾기) ----
function wpListHTML(sh) {
  const toks = String(sh.q || '')
    .split(/\s+/)
    .map(wishNorm)
    .filter(Boolean);
  const list = SPOTS.filter(
    s =>
      (sh.a === 'all' || s.a === sh.a) &&
      (sh.c === 'all' || s.c === sh.c) &&
      (!toks.length ||
        toks.every(t =>
          (wishNorm(s.n) + '|' + wishNorm(s.j) + '|' + wishNorm(AREA[s.a].n) + '|' + wishNorm(s.d)).includes(t)
        ))
  ).sort((x, y) => (y.p || 3) - (x.p || 3));
  if (!list.length)
    return `<li class="w-none">${L('맞는 장소가 없어요. 목록에 없는 곳은 「직접 장소 추가」로 넣어 주세요.', '合う場所がありません。リストにない場所は「場所を直接追加」で入れてください。')}</li>`;
  return list
    .map(
      s =>
        `<li class="w-row${wishHas(s.id) ? ' in' : ''}">${catTile(s.c)}<button class="w-t" data-act="spotSheet" data-id="${s.id}"><b>${esc(s.n)}</b><small><span>${esc(areaNameT(s.a))}</span> · <span>${CATS[s.c].n}</span> · <span>${dur(s.s)}</span></small></button>${wishPlusBtn(s.id)}</li>`
    )
    .join('');
}
function wpickSheetV(sh) {
  const chip = (act, v, t, on) => `<button class="${on ? 'on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${on}">${t}</button>`;
  return (
    shHead(L('추천 장소 담기', 'おすすめから入れる'), L('＋를 누르면 「가고 싶은 곳」에 담겨요', '＋を押すと「行きたい所」に入ります')) +
    `<div class="w-search">${ic('search')}<input id="wpQ" type="search" data-input="wpQ" value="${esc(sh.q || '')}" placeholder="${L('장소 이름·메뉴로 찾기 (예: 라멘, 오호리)', '名前・メニューで探す(例: ラーメン、大濠)')}" autocomplete="off"></div>
    <div class="w-chips">${chip('wpArea', 'all', L('전체', 'すべて'), sh.a === 'all')}${AREAS.map(a => chip('wpArea', a.id, esc(shortArea(areaNameT(a.id))), sh.a === a.id)).join('')}</div>
    <div class="w-chips soft">${chip('wpCat', 'all', L('전체', 'すべて'), sh.c === 'all')}${Object.keys(CATS)
      .map(c => chip('wpCat', c, CATS[c].n, sh.c === c))
      .join('')}</div>
    <ul class="w-list" id="wpList">${wpListHTML(sh)}</ul>
    <div class="sh-foot"><button class="btn soft" data-act="wishAdd">${ic('pin')}${L('직접 장소 추가', '場所を直接追加')}</button><button class="btn pri" data-act="closeSheet">${L(`완료 · ${S.wish.length}곳`, `完了 · ${S.wish.length}か所`)}</button></div>`
  );
}
SHEETS.wpick = wpickSheetV;
SHEET_LABEL.wpick = '추천 장소 담기';

// ---- 계획 화면 위 알림: 가고 싶은 곳으로 짠 결과 ----
function wishBannerV(w) {
  const N = S.plan.days.length,
    li = [];
  const dayTxt = d =>
    `<span class="w-bd"><b>${L(`${d.i + 1}일차`, `${d.i + 1}日目`)}</b> ${d.areas.length ? d.areas.map(id => esc(shortArea(areaNameT(id)))).join('·') : '—'} ${L(`${d.n}곳`, `${d.n}か所`)}${d.fill ? L(` +추천 ${d.fill}`, ` +おすすめ${d.fill}`) : ''}</span>`;
  li.push(`<li><i class="dot d-ok"></i><span><b>${L('날짜 나누기', '日ごとに分ける')}</b> ${L('가까운 곳끼리 같은 날로', '近い所どうしを同じ日に')}<br>${w.days.map(dayTxt).join('')}</span></li>`);
  li.push(
    `<li><i class="dot"></i><span><b>${L('순서·시간', '順番・時間')}</b> ${L('하루마다 이동이 가장 짧은 순서로, 문 여는 시간·식사·막차에 맞췄어요', '日ごとに移動がいちばん短い順にし、営業時間・食事・終電に合わせました')}</span></li>`
  );
  if (w.must) li.push(`<li><i class="dot d-ok"></i><span><b>${L('꼭 갈 곳', '必ず行く所')}</b> ${L(`★ ${w.must}곳은 모두 넣었어요`, `★${w.must}か所はすべて入れました`)}</span></li>`);
  w.fixed.forEach(f =>
    li.push(`<li><i class="dot d-ok"></i><span><b>${L('고정', '固定')}</b> ${esc(f.n)} · ${L(`${f.di + 1}일차`, `${f.di + 1}日目`)} ${fmt(f.at)}</span></li>`)
  );
  if (w.fill) li.push(`<li><i class="dot"></i><span><b>${L('추천으로 채움', 'おすすめで追加')}</b> ${L(`빈 시간에 ${w.fill}곳`, `空き時間に${w.fill}か所`)}</span></li>`);
  if (w.parked.length)
    li.push(
      `<li><i class="dot d-warn"></i><span><b>${L('보류함으로', '保留箱へ')}</b> ${w.parked.map(x => `<span>${esc(x.n)}</span> <small>(${esc(x.reason.replace(' 보류', ''))})</small>`).join(', ')}</span></li>`
    );
  w.days
    .filter(d => d.over > 10)
    .forEach(d =>
      li.push(
        `<li><i class="dot d-warn"></i><span><b>${L(`${d.i + 1}일차`, `${d.i + 1}日目`)}</b> <span class="bad-t">${L(`꼭 갈 곳이 많아 마무리보다 ${d.over}분 늦어요`, `必ず行く所が多く、終了予定より${d.over}分遅れます`)}</span></span></li>`
      )
    );
  return `<div class="banner w-banner" role="status"><div class="bn-h">${ic('spark')}<b>${L(`가고 싶은 곳 ${w.placed}곳으로 ${N}일 계획을 짰어요`, `行きたい所${w.placed}か所で${N}日の計画を作りました`)}</b></div><ul>${li.join('')}</ul>
    <button class="btn soft wide" data-act="closeBanner">${L('확인', 'OK')}</button></div>`;
}

Object.assign(A, {
  // 동네 둘러보기·추천 목록의 ＋: 앱 장소 담기/빼기
  wishToggle(d) {
    const i = S.wish.findIndex(w => w.sid === d.sid);
    if (i >= 0) S.wish.splice(i, 1);
    else S.wish.push({ id: wishId(), sid: d.sid });
    wishSave();
    S.keepSheetScroll = true;
    render();
  },
  // 지도: 범위 바꾸기 (전체 · 시내 · 동네)
  wpView(d) {
    S.draft.wpView = d.v;
    S.draft.wpSel = null;
    render();
  },
  // 지도 핀 또는 목록을 누르면: 그 장소를 고르고 지도를 그쪽으로 (한 번 더 누르면 해제)
  wpSel(d) {
    const D = S.draft;
    if (!d.id || D.wpSel === d.id) {
      D.wpSel = null;
      render();
      return;
    }
    const dd = wpData(),
      it = dd.items.find(i => i.id === d.id);
    if (!it) return;
    D.wpSel = d.id;
    if (!wpShown(dd, wpView(dd)).includes(it)) D.wpView = it.z === 'city' ? 'city' : it.a;
    render();
    if (typeof WPV !== 'undefined' && WPV && WPV.map) WPV.map.easeTo({ center: [it.lng, it.lat], offset: [0, -44], duration: 420 });
    if (d.from === 'list') {
      const m = document.getElementById('wpm');
      if (m && m.getBoundingClientRect().top < 40) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  wpZoom(d) {
    if (typeof WPV !== 'undefined' && WPV && WPV.map) Number(d.n) > 0 ? WPV.map.zoomIn() : WPV.map.zoomOut();
  },
  wishDel(d) {
    const i = S.wish.findIndex(w => w.id === d.id);
    if (i < 0) return;
    const [w] = S.wish.splice(i, 1);
    if (S.draft && S.draft.wset) delete S.draft.wset[w.id];
    if (S.draft && S.draft.wpSel === w.id) S.draft.wpSel = null;
    wishSave();
    S.keepSheetScroll = true;
    render();
    toast(L(`뺐어요 · ${wishName(w)}`, `外しました · ${wishNameT(w)}`));
  },
  // 직접 장소 추가 시트 열기 (지도는 하카타 쪽에서 시작)
  wishAdd() {
    const back = S.sheet && S.sheet.type === 'wpick' ? { ...S.sheet } : null;
    S.sheet = {
      type: 'hpick',
      ctx: 'wish',
      h: { k: 'hakata' },
      tab: 'find',
      kind: 'food',
      stay: WISH_STAY.food,
      from: S.view === 'home' ? 'areas' : S.view,
      back: back ? 'wpick' : null,
      backSh: back
    };
    render();
  },
  wKind(d) {
    hpKeep();
    const sh = S.sheet;
    sh.kind = d.k;
    sh.kindSet = true;
    sh.stay = WISH_STAY[d.k] || 60;
    S.keepSheetScroll = true;
    render();
  },
  // 동네 탭 「이 장소들로 계획 짜기」 → 새 여행 (가고 싶은 곳으로 짜기를 골라 둔 채)
  wishPlan() {
    A.newPlan();
    if (S.draft) S.draft.how = 'wish';
  },
  toHow() {
    if (S.draft && S.draft.start && S.draft.end) go('how');
  },
  howPick(d) {
    S.draft.how = d.v;
    render();
  },
  howNext() {
    const how = S.draft.how || (S.wish.length ? 'wish' : 'auto');
    S.draft.how = how;
    go(how === 'wish' ? 'wplan' : 'areas');
  },
  wMust(d) {
    const ws = S.draft.wset || (S.draft.wset = {}),
      o = ws[d.id] || (ws[d.id] = {});
    o.must = !o.must;
    render();
  },
  wFill() {
    S.draft.fill = S.draft.fill === false;
    render();
  },
  wpickSheet() {
    S.sheet = { type: 'wpick', a: 'all', c: 'all', q: '' };
    render();
  },
  wpArea(d) {
    S.sheet.a = d.v;
    S.keepSheetScroll = true;
    render();
  },
  wpCat(d) {
    S.sheet.c = d.v;
    S.keepSheetScroll = true;
    render();
  },
  generateWish() {
    const D = S.draft,
      ws = D.wset || {};
    if (!S.wish.length) return;
    const entries = S.wish.map(w => {
      const o = ws[w.id] || {};
      return { w, must: !!o.must, day: o.day != null ? o.day : null, at: o.day != null && o.at != null ? o.at : null };
    });
    S.plan = createPlanWish(draftSet(D), entries, { fill: D.fill !== false });
    S.saved = false;
    S.isNew = true;
    S.di = 0;
    S.tab = 'sched';
    S.sel = null;
    S.undo = [];
    S.banner = { wish: wishSummary(S.plan) };
    go('plan');
    toast(L('일정을 만들었어요. 마음에 들면 저장하세요.', '日程を作りました。気に入ったら保存してください。'));
  }
});

$app.addEventListener('change', e => {
  const t = e.target,
    k = t.dataset.change;
  if (k === 'wStay' && S.sheet && S.sheet.ctx === 'wish') {
    hpKeep();
    S.sheet.stay = Number(t.value);
  } else if (k === 'wDay' || k === 'wAt') {
    const ws = S.draft.wset || (S.draft.wset = {}),
      o = ws[t.dataset.id] || (ws[t.dataset.id] = {});
    if (k === 'wDay') {
      if (t.value === '') {
        delete o.day;
        delete o.at;
      } else o.day = Number(t.value);
    } else if (t.value === '') delete o.at;
    else o.at = Number(t.value);
    render();
  }
});
$app.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.input === 'wpQ' && S.sheet && S.sheet.type === 'wpick') {
    S.sheet.q = t.value;
    const l = document.getElementById('wpList');
    if (l) l.innerHTML = wpListHTML(S.sheet);
  }
});
