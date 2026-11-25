// ======================================================================
// home3.js · 새 홈 (모모치 바다 일러스트 + 아래 5칸 메뉴)
// - 계획이 없을 때: 큰 제목 「福岡 후쿠오카 FUKUOKA」 + 일본어 소개
// - 계획이 있을 때: 제목을 「福岡 후쿠오카」 한 줄로 줄이고 카드 2장 (옆으로 넘기기)
//     여행 중(오늘이 여행 날): 「지금 이동」(지금 있는 곳 → 다음 장소, 탈 역·방면·다음 차) / 「오늘 일정」
//     여행 전: 「다가오는 여행」(D-day, 날짜별 바로가기) / 「첫날 일정」
// - 아래 메뉴: 홈 · 여행 준비 · ＋새 여행 · 동네 · 내 여행 (S.htab)
// 다크 모드에서는 그림이 밤 풍경으로 바뀌어요 (style.css 의 --h3-* 색)
// ======================================================================

// 홈 그림 (viewBox 로 잘라 쓰면 다른 탭 위쪽 띠에도 써요)
function h3Scene(vb = '0 0 390 760', ratio = 'xMidYMin slice') {
  const v = n => `var(--h3-${n})`;
  return `<svg class="h3-svg" viewBox="${vb}" preserveAspectRatio="${ratio}" aria-hidden="true">
<defs>
<linearGradient id="h3sky" x1="0" y1="0" x2="0" y2="760" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:${v('s0')}"/><stop offset=".25" style="stop-color:${v('s1')}"/><stop offset=".45" style="stop-color:${v('s2')}"/><stop offset=".56" style="stop-color:${v('s3')}"/></linearGradient>
<radialGradient id="h3glow" cx="58" cy="118" r="120" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:${v('glow')};stop-opacity:.9"/><stop offset="1" style="stop-color:${v('glow')};stop-opacity:0"/></radialGradient>
<linearGradient id="h3sea" x1="0" y1="420" x2="0" y2="760" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:${v('sea0')}"/><stop offset=".45" style="stop-color:${v('sea1')}"/><stop offset="1" style="stop-color:var(--bg)"/></linearGradient>
<linearGradient id="h3tw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${v('tw0')}"/><stop offset=".55" style="stop-color:${v('tw1')}"/><stop offset=".56" style="stop-color:${v('tw2')}"/><stop offset="1" style="stop-color:${v('tw3')}"/></linearGradient>
</defs>
<rect width="390" height="760" fill="url(#h3sky)"/>
<rect width="390" height="480" fill="url(#h3glow)"/>
<g class="h3-stars"><circle cx="40" cy="40" r="1.2"/><circle cx="110" cy="22" r="1"/><circle cx="170" cy="60" r="1.4"/><circle cx="240" cy="30" r="1"/><circle cx="196" cy="150" r="1.2"/><circle cx="120" cy="120" r=".9"/><circle cx="20" cy="150" r="1"/><circle cx="140" cy="250" r="1.1"/><circle cx="260" cy="190" r=".9"/><circle cx="375" cy="60" r="1.1"/><circle cx="60" cy="210" r="1"/></g>
<circle class="h3-sun" cx="58" cy="118" r="30"/>
<g class="h3-cloud"><ellipse cx="210" cy="236" rx="64" ry="7"/><ellipse cx="392" cy="140" rx="44" ry="10"/><ellipse cx="0" cy="182" rx="16" ry="6"/></g>
<path class="h3-bird" d="M150 168q8-7 15 0q7-7 15 0M132 186q6-5 11 0q6-5 11 0"/>
<path style="fill:${v('city')}" d="M0 372h40v-14h26v8h22v-20h30v26h36v-12h30v18h40v-10h50v-16h30v20h40v-8h46v100H0z"/>
<g class="h3-win"><rect x="8" y="380" width="3" height="3"/><rect x="48" y="366" width="3" height="3"/><rect x="74" y="374" width="3" height="3"/><rect x="100" y="356" width="3" height="3"/><rect x="138" y="388" width="3" height="3"/><rect x="176" y="376" width="3" height="3"/><rect x="250" y="372" width="3" height="3"/><rect x="292" y="380" width="3" height="3"/><rect x="372" y="378" width="3" height="3"/></g>
<path style="fill:${v('dome')}" d="M-60 408a118 96 0 0 1 236 0z"/>
<path style="fill:none;stroke:${v('domel')};stroke-width:1.6" d="M-40 404q60-78 196 0M-6 336q24 30 30 68M58 314v90M118 334q-14 30-16 70M-20 374q80-26 190 6"/>
<rect x="-60" y="402" width="240" height="8" style="fill:${v('base')}"/>
<path style="fill:${v('hawk')}" d="M188 410V272q0-16 24-14q26 3 28 22v130z"/>
<path style="fill:${v('hawk2')}" d="M222 262q18 6 18 18v130h-18z"/>
<path style="stroke:${v('hwin')};stroke-width:1.4" d="M196 286h18M196 297h18M196 308h18M196 319h18M196 330h18M196 341h18M196 352h18M196 363h18M196 374h18M196 385h18"/>
<path style="fill:none;stroke:${v('lat')};stroke-width:2.2;stroke-linejoin:round" d="M337 4v22M323 92l14-66l14 66M326 76l22-22M348 76l-22-22M329 52l16-14M345 52l-16-14"/>
<path d="M318 94h38l8 316h-54z" fill="url(#h3tw)"/>
<path style="stroke:${v('twl')};stroke-width:1;opacity:.55" d="M314 120h46M314 140h46M314 160h47M313 182h48M312 246h50M311 266h51M311 286h52M310 306h53M310 326h53M309 346h55M309 366h55M308 386h56"/>
<path class="h3-twlight" d="M319 96l-9 312M355 96l9 312"/>
<path style="fill:${v('deck')}" d="M315 200h44l2 22h-48z"/>
<rect x="321" y="206" width="34" height="6" rx="2" style="fill:${v('deckw')}"/>
<path style="fill:none;stroke:${v('palm')};stroke-width:4;stroke-linecap:round" d="M260 402q4-46 14-74"/>
<path style="fill:none;stroke:${v('palm')};stroke-width:4.5;stroke-linecap:round" d="M274 328q-22-6-36 8M274 328q-14-16-30-14M274 328q20-12 34-2M274 328q16 2 24 18M274 328q2-18 14-26"/>
<path style="fill:none;stroke:${v('palm2')};stroke-width:3;stroke-linecap:round" d="M286 406q0-30 10-52"/>
<path style="fill:none;stroke:${v('palm2')};stroke-width:3.5;stroke-linecap:round" d="M296 354q-16-2-24 8M296 354q12-10 24-4M296 354q4-12 12-16"/>
<path style="fill:${v('sand')}" d="M0 404q120-8 240 0t150 2v18H0z"/>
<rect y="420" width="390" height="340" fill="url(#h3sea)"/>
<path style="stroke:${v('refl')};stroke-width:2;stroke-linecap:round;opacity:.75" d="M324 436h30M328 448h24M326 460h26M330 472h20M332 484h16M28 460h42M150 448h56M240 476h40"/>
</svg>`;
}

// 배경: 전에 넣었던 상단 사진 (시간에 따라 낮/밤 사진). 사진을 못 불러오면 그림으로
function h3Bg(cls = '') {
  if (S.photoBroken) return h3Scene();
  const hp = heroPhoto(heroScene());
  return `<img class="hero-img stock h3-photo ${cls}" src="${hp.src}" alt="${esc(hp.altT)}">`;
}

// 지금 보여줄 계획 (여행 중이거나 다가오는 것). 다녀온 여행만 있으면 없음
function h3Plan() {
  return sortedPlans().find(p => planStatus(p).k !== 'past') || null;
}

// ---- 아래 4칸 메뉴 (위쪽에 줄무늬 한 줄) ----
function h3NavV(on) {
  const t = on || S.htab || 'home',
    it = (k, i, l) =>
      `<button class="h3-ni${t === k ? ' on' : ''}" data-act="htab" data-t="${k}"${t === k ? ' aria-current="page"' : ''}>${ic(i)}<span>${l}</span></button>`;
  return `<nav class="h3-nav" aria-label="${L('메인 메뉴', 'メインメニュー')}">
    ${it('home', 'home', L('홈', 'ホーム'))}${it('prep', 'plane', L('여행 준비', '旅の準備'))}${it('areas', 'map', L('동네', 'エリア'))}${it('trips', 'list', L('내 여행', 'マイ旅行'))}
  </nav>`;
}

// ---- 홈 탭 ----
// 첫 화면: 사진 위에 큰 제목(福岡 후쿠오카 FUKUOKA)만. 계획이 있으면 위로 넘길 때 두 번째 화면에
// 「지금 이동 / 오늘 일정」(여행 전이면 「다가오는 여행 / 첫날 일정」) 카드가 나오고 제목은 한 줄로 줄어요
function h3HomeV() {
  const p = h3Plan();
  const top = `<header class="h3-top"><span class="h3-logo" data-notr${p ? '' : ' hidden'}><span class="j" lang="ja">福岡</span><b>${L('후쿠오카', 'ふくおか')}</b></span>${langBtn(true)}</header>`;
  const hero = `<section class="h3-p1">
      <div class="h3-hero" data-notr>
        <div class="j" lang="ja">福岡</div>
        <h1>${L('후쿠오카', 'ふくおか')}</h1>
        <div class="en">FUKUOKA</div>
        <p lang="ja">海と屋台と、ラーメンの街。<br>アジアの玄関口へようこそ。</p>
      </div>
      <div class="h3-p1b">
        <ul class="h3-feats"><li>${ic('map')}${L('동선 자동', 'ルート自動')}</li><li>${ic('walk')}${L('걷는 길 추천', '歩く道のおすすめ')}</li><li>${ic('wallet')}${L('교통비·패스', '交通費・パス')}</li></ul>
        ${
          p
            ? `<button class="h3-cue" data-act="h3Down">${L('위로 넘기면 내 여행', '上にスワイプでマイ旅行')}${ic('up')}</button>`
            : `<button class="h3-start" data-act="newPlan">${ic('plus')}${L('새 여행 계획 세우기', '新しい旅行計画を作る')}</button>`
        }
      </div>
    </section>`;
  if (!p) return `${top}<main class="h3-pages" id="h3pages">${hero}</main>`;
  const st = planStatus(p),
    now = st.k === 'now';
  const labels = now
    ? [L('지금 이동', '今の移動'), L('오늘 일정', '今日の予定')]
    : [L('다가오는 여행', '次の旅行'), L('첫날 일정', '1日目の予定')];
  const cards = now ? [h3MoveV(p, st), h3TodayV(p, st)] : [h3SoonV(p, st), h3FirstV(p)];
  const pg = S.hpage === 1 ? 1 : 0;
  return `${top}<main class="h3-pages" id="h3pages">${hero}
    <section class="h3-p2">
      <div class="h3-cards">
        <div class="h3-tabs" data-l0="${esc(labels[0])}" data-l1="${esc(labels[1])}">
          <button class="h3-tl" data-act="hPage" data-n="0"${pg ? '' : ' hidden'}>‹ ${labels[0]}</button>
          <b class="h3-tc">${labels[pg]}</b>
          <button class="h3-tr" data-act="hPage" data-n="1"${pg ? ' hidden' : ''}>${labels[1]} ›</button>
        </div>
        <div class="h3-car" id="h3car">${cards.join('')}</div>
        <div class="h3-dots" aria-hidden="true"><i class="${pg ? '' : 'on'}"></i><i class="${pg ? 'on' : ''}"></i></div>
      </div>
    </section>
  </main>`;
}

// 오늘의 지금 위치(일정 기준): 다음 장소(k)와 그 전 장소
function h3NowInfo(p, st) {
  const di = Math.min(st.di, p.days.length - 1),
    c = computeDay(p, di),
    day = p.days[di],
    rows = c.rows,
    now = nowMin();
  let k = rows.findIndex(r => r.arr > now);
  if (k < 0) k = rows.length;
  const cur = k > 0 ? rows[k - 1] : null,
    to = rows[k] || null;
  const anc = a => (a.kind === 'airport' ? L('공항', '空港') : L('숙소', '宿'));
  return {
    di,
    c,
    day,
    k,
    now,
    cur,
    to,
    leg: to ? to.leg : c.endLeg,
    fromPt: cur ? cur.p : c.startPt,
    toPt: to ? to.p : c.endPt,
    fromName: cur ? itemName(p, cur.it) : anc(day.start),
    toName: to ? itemName(p, to.it) : anc(day.end),
    leaveAt: cur ? cur.dep : c.start,
    arr: to ? to.arr : c.endArr
  };
}

// 이동 상자: 지하철이면 탈 역·내릴 역(번호)·방면·다음 차, 아니면 방법·시간·요금
function h3LegBox(leg, A, B, t0) {
  if (!leg || leg.mode === 'none') return '';
  const fare = fareTxt(leg.fare);
  if (leg.mode === 'subway' && leg.route && leg.route.rides.length) {
    const r = leg.route,
      rd = r.rides[0],
      last = r.rides[r.rides.length - 1],
      Ln = LINES[rd.line],
      tw = TOWARD[rd.line][rd.toward] || { ja: rd.toward, ko: rd.toward + ' 방면' };
    const board = stLabel(rd.st[0], rd.line),
      off = stLabel(last.st[last.st.length - 1], last.line),
      stops = r.rides.reduce((t, x) => t + x.stops, 0);
    const tt = withTimetable(leg, t0);
    const head = `${r.wa ? L(`도보 ${r.wa}분 → `, `徒歩${r.wa}分 → `) : ''}${L(`지하철 ${Ln.n}`, `地下鉄${Ln.j}`)}${fare ? ` · ${fare}` : ''}`;
    const xfer =
      r.rides.length > 1
        ? `<p class="h3-x">${ic('swap')}${L(`${STATIONS[rd.st[rd.st.length - 1]].n}에서 ${LINES[r.rides[1].line].n}으로 갈아타요`, `${STATIONS[rd.st[rd.st.length - 1]].j}で${LINES[r.rides[1].line].j}に乗り換え`)}</p>`
        : '';
    return `<div class="h3-leg" style="--lc:${Ln.color}">
      <p class="h3-lh"><span class="h3-li">${ic('subway')}</span>${head}</p>
      <div class="h3-st">
        <div><small>${L('타는 역', '乗る駅')}</small><p><em>${board.code}</em><b lang="ja">${board.ja}</b></p><small>${board.ko}</small></div>
        <div class="h3-n">${L(`${stops}정거장`, `${stops}駅`)}<br>›››</div>
        <div><small>${L('내리는 역', '降りる駅')}</small><p><em>${off.code}</em><b lang="ja">${off.ja}</b></p><small>${off.ko}</small></div>
      </div>
      ${xfer}
      <p class="h3-dir">${L('방면', '方面')} <b lang="ja">${tw.ja}</b>${LANG === 'ja' ? '' : ` · ${esc(tw.ko)}`}</p>
      ${
        tt && tt.tt
          ? `<p class="h3-next"><span>${tt.lastGone ? L('막차가 끝났어요 · 택시를 알아봐요', '終電が終わりました · タクシーを検討') : L(`다음 차 (약 ${leg.hw}분 간격)`, `次の便(約${leg.hw}分間隔)`)}</span><b>${tt.lastGone ? '—' : fmt(tt.depAt % 1440)}</b></p>`
          : ''
      }
    </div>`;
  }
  const M = MODE[leg.mode] || MODE.walk;
  const tt = leg.hw ? withTimetable(leg, t0) : null,
    sw = svcSwapTxt(leg);
  return `<div class="h3-leg" style="--lc:${M.color}">
    <p class="h3-lh"><span class="h3-li">${ic(leg.mode)}</span><span>${M.n}</span> ${dur(leg.min)}${fare ? ` · ${fare}` : ''}</p>
    ${sw ? `<p class="h3-x warn">${ic('alert')}${esc(sw)}</p>` : ''}
    ${leg.label && leg.mode !== 'walk' ? `<p class="h3-dir">${esc(leg.label)}</p>` : ''}
    ${leg.mode === 'walk' && leg.km ? `<p class="h3-dir">${L(`약 ${leg.km.toFixed(1)}km 걸어요`, `約${leg.km.toFixed(1)}km歩きます`)}</p>` : ''}
    ${tt && tt.tt ? `<p class="h3-next"><span>${L(`다음 차 (약 ${leg.hw}분 간격)`, `次の便(約${leg.hw}分間隔)`)}</span><b>${fmt(tt.depAt % 1440)}</b></p>` : ''}
    <a class="h3-maps" href="${mapsUrl(A, B, leg.mode)}" target="_blank" rel="noopener">${ic('map')}${L('구글 지도로 길 보기', 'Googleマップで見る')}</a>
  </div>`;
}

// 카드: 지금 이동
// 카드 아래 버튼 줄: [일정 보기][🗑 삭제] — 삭제는 한 번 더 물어본 뒤 지워요
function h3Acts(p, main) {
  return `<div class="h3-acts">${main}<button class="h3-del" data-act="delAsk" data-id="${p.id}">${ic('trash')}<span>${L('삭제', '削除')}</span></button></div>`;
}
function h3AllBtn(p, di) {
  return `<button class="h3-cta h3-cta-sub" data-act="openPlan" data-id="${p.id}" data-di="${di}">${ic('list')}${L('전체 일정 보기', '全体の予定を見る')}</button>`;
}

function h3MoveV(p, st) {
  const x = h3NowInfo(p, st);
  const head = `<div class="h3-ch"><span class="h3-pill">${L('지금', '現在')} ${fmt(x.now)}</span><span class="h3-dl">${L(`${x.di + 1}일차`, `${x.di + 1}日目`)} · ${mds(x.day.date)}</span>${
    x.to
      ? `<button class="h3-go" data-act="h3Go" data-id="${p.id}" data-uid="${x.to.it.uid}">${ic('nav')}${L('길찾기', '道案内')}</button>`
      : ''
  }</div>`;
  if (!x.c.rows.length)
    return `<article class="h3-card">${head}<p class="h3-empty">${L('오늘은 아직 일정이 없어요.', '今日はまだ予定がありません。')}</p>${h3Acts(p, h3AllBtn(p, x.di))}</article>`;
  // 오늘 일정이 다 끝났으면 (숙소 도착 뒤) 내일 일정으로 안내
  if (x.now >= x.c.endArr) {
    const nx = x.di + 1 < p.days.length;
    return `<article class="h3-card">${head}<p class="h3-empty">${L(`오늘 일정을 모두 마쳤어요 · ${fmt(x.c.endArr % 1440)} ${x.toName} 도착`, `今日の予定はすべて終わりました · ${fmt(x.c.endArr % 1440)} ${x.toName}着`)}</p>${h3Acts(
      p,
      nx
        ? `<button class="h3-cta" data-act="openPlan" data-id="${p.id}" data-di="${x.di + 1}">${L('내일 일정 보기', '明日の予定を見る')}</button>`
        : h3AllBtn(p, x.di)
    )}</article>`;
  }
  const t0 = Math.max(x.now, x.leaveAt);
  return `<article class="h3-card">${head}
    <ol class="h3-route">
      <li><b>${esc(x.fromName)}</b><small>~${fmt(x.leaveAt)}</small></li>
      <li class="to"><b>${esc(x.toName)}</b><small>${fmt(x.arr)} ${L('도착', '着')}</small></li>
    </ol>
    ${h3LegBox(x.leg, x.fromPt, x.toPt, t0)}
    ${h3Acts(p, h3AllBtn(p, x.di))}
  </article>`;
}

// 일정 목록 줄
function h3Row(p, r, cur) {
  return `<li class="${cur ? 'cur' : ''}"><b>${fmt(r.arr)}</b><span class="h3-ri">${ic(cur ? 'pin' : 'clock')}</span><span class="h3-rn">${esc(itemName(p, r.it))}</span></li>`;
}

// 카드: 오늘 일정
function h3TodayV(p, st) {
  const x = h3NowInfo(p, st),
    rows = x.c.rows,
    s = Math.max(0, x.k - 1),
    show = rows.slice(s, s + 4),
    past = s,
    f = dayFares(p, x.di);
  return `<article class="h3-card">
    <div class="h3-ch"><span class="h3-pill">${L('오늘', '今日')}</span><span class="h3-dl">${L(`${x.di + 1}일차`, `${x.di + 1}日目`)} · ${mds(x.day.date)}</span></div>
    ${show.length ? `<ol class="h3-list">${show.map((r, i) => h3Row(p, r, x.k > 0 && i === 0 && s === x.k - 1)).join('')}</ol>` : `<p class="h3-empty">${L('오늘 일정을 다 마쳤어요.', '今日の予定はすべて終わりました。')}</p>`}
    <p class="h3-more">${past ? L(`지난 일정 ${past}곳 · `, `済んだ予定 ${past}か所 · `) : ''}<button data-act="openPlan" data-id="${p.id}">${L('전체 일정 보기', '全体の予定を見る')}</button></p>
    <div class="h3-stats"><div><small>${L('오늘 교통비', '今日の交通費')}</small><b>${f.unknown && !f.raw ? '—' : (f.approx ? L('약 ', '約') : '') + yen(f.raw + f.boat)}</b></div><div><small>${L('예상 일정 종료', '終了予定')}</small><b>${fmt(x.c.endArr % 1440)}</b></div></div>
  </article>`;
}

// 카드: 다가오는 여행 (여행 전)
function h3SoonV(p, st) {
  const areas = (p.areas || []).filter(id => AREA[id]);
  return `<article class="h3-card">
    <div class="h3-ch"><span class="h3-pill red">${st.label}</span><span class="h3-dl">${mds(p.set.start)} – ${mds(p.set.end)} · ${nights(p.days.length)}</span></div>
    <h2 class="h3-tt">${esc(p.title)}</h2>
    ${areas.length ? `<div class="h3-chips">${areas.map(id => `<span>${esc(shortArea(L(AREA[id].n, AREA_JA[id] || AREA[id].n)))}</span>`).join('')}</div>` : ''}
    <div class="h3-days">${p.days
      .slice(0, 6)
      .map(
        (d, i) =>
          `<button data-act="openPlan" data-id="${p.id}" data-di="${i}"><b>${L(`${i + 1}일차`, `${i + 1}日目`)}</b>${mds(d.date)}</button>`
      )
      .join('')}</div>
    ${h3Acts(p, `<button class="h3-cta" data-act="openPlan" data-id="${p.id}">${L('일정 보기', '予定を見る')}</button>`)}
  </article>`;
}

// 카드: 첫날 일정 (여행 전)
function h3FirstV(p) {
  const c = computeDay(p, 0),
    show = c.rows.slice(0, 4),
    fp = farePlan(p);
  return `<article class="h3-card">
    <div class="h3-ch"><span class="h3-pill">${L('1일차', '1日目')}</span><span class="h3-dl">${mds(p.days[0].date)}</span></div>
    ${show.length ? `<ol class="h3-list">${show.map(r => h3Row(p, r, false)).join('')}</ol>` : `<p class="h3-empty">${L('아직 일정이 없어요.', 'まだ予定がありません。')}</p>`}
    <p class="h3-more">${c.rows.length > show.length ? L(`그 밖에 ${c.rows.length - show.length}곳 · `, `ほか${c.rows.length - show.length}か所 · `) : ''}<button data-act="openPlan" data-id="${p.id}" data-di="0">${L('전체 일정 보기', '全体の予定を見る')}</button></p>
    <div class="h3-stats"><div><small>${L('여행 교통비', '旅行の交通費')}</small><b>${fp.approx ? L('약 ', '約') : ''}${yen(fp.best)}</b></div><div><small>${L('첫날 마무리', '1日目の終了')}</small><b>${fmt(c.endArr % 1440)}</b></div></div>
  </article>`;
}

// ---- 다른 탭: 위쪽 하늘 띠 ----
function h3BandSVG() {
  const v = n => `var(--h3-${n})`;
  return `<svg class="h3-svg" viewBox="0 0 390 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="h3bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${v('s0')}"/><stop offset=".7" style="stop-color:${v('s1')}"/><stop offset="1" style="stop-color:${v('s2')}"/></linearGradient></defs>
<rect width="390" height="170" fill="url(#h3bsky)"/>
<g class="h3-stars"><circle cx="40" cy="30" r="1.1"/><circle cx="120" cy="18" r="1"/><circle cx="200" cy="40" r="1.2"/><circle cx="268" cy="22" r="1"/><circle cx="160" cy="70" r=".9"/><circle cx="300" cy="60" r="1"/></g>
<ellipse class="h3-cloud" cx="250" cy="64" rx="46" ry="5"/>
<path style="fill:${v('city')}" d="M0 136h24v-12h30v8h20v-18h34v22h30v-10h40v14h36v-8h44v-14h30v16h40v-6h62v40H0z"/>
<path style="fill:${v('dome')}" d="M-20 150a70 42 0 0 1 140 0z"/>
<path style="fill:${v('hawk')}" d="M236 150v-50q0-8 12-7q13 2 14 11v46z"/>
<path style="fill:none;stroke:${v('lat')};stroke-width:1.6" d="M348 14v10M341 50l7-26 7 26"/>
<path style="fill:${v('tw1')}" d="M339 50h18l4 100h-26z"/>
<path style="fill:${v('deck')}" d="M338 86h20l1 9h-22z"/>
<path style="fill:${v('sand')}" d="M0 148q120-5 240 0t150 1v8H0z"/>
<rect y="155" width="390" height="15" style="fill:var(--bg)"/>
</svg>`;
}
function h3BandV(t, s) {
  return `<header class="h3-band">${S.photoBroken ? h3BandSVG() : h3Bg()}<span class="h3-bshade"></span>
    <div class="h3-bt"><h1>${t}</h1>${s ? `<p>${s}</p>` : ''}</div><span class="h3-bl">${langBtn(true)}</span></header>`;
}

// 여행 준비 탭
function h3PrepV() {
  const [air, ...rest] = TILES;
  const tile = t =>
    `<button class="h3-tile" data-act="${t.act}" style="--c:${t.c}"><span class="h3-ti">${ic(t.ic)}</span><b>${t.t}</b><small>${t.s}</small></button>`;
  return `${h3BandV(L('여행 준비', '旅の準備'), L('떠나기 전에 한 번씩 보면 좋아요', '出発前に一度見ておくと安心'))}
  <main class="h3-page">
    <button class="h3-wide" data-act="${air.act}" style="--c:${air.c}"><span class="h3-ti">${ic(air.ic)}</span><span><b>${air.t}</b><small>${air.s}</small></span>${ic('next', 'chev')}</button>
    <div class="h3-grid">${rest.map(tile).join('')}
      <button class="h3-tile" data-act="xferSheet" style="--c:#5B4C9A"><span class="h3-ti">${ic('share')}</span><b>${IS_APP ? L('계획 공유하기', '計画を共有') : L('계획 옮기기', '計画を移す')}</b><small>${L('친구에게 · 내 다른 폰으로', '友だちへ · 別のスマホへ')}</small></button>
    </div>
    <p class="note">${ic('info')}<span>${L('여행 중에는 계획 화면 아래 「길안내」 탭에서 장소마다 가는 법을 볼 수 있어요.', '旅行中は計画画面の下の「道案内」タブで、スポットごとの行き方を見られます。')}</span></p>
  </main>`;
}

// 동네 탭
function h3AreasV() {
  const seg = S.aseg || 'city',
    segs = [
      ['city', L('시내', '市内')],
      ['outer', L('근교', '近郊')],
      ['trip', L('당일치기', '日帰り')]
    ];
  const list = AREAS.filter(a => (a.kind || 'city') === seg);
  const card = a => {
    const n = SPOTS.filter(s => s.a === a.id).length,
      [c1, c2] = AREA_TONE[a.id] || ['#F0703A', '#B92E1C'],
      ph = areaPh(a.id),
      tm = a.min + 2 * accessMin(a.z),
      span = a.kind === 'trip' ? a.far : tm >= 400 ? '하루' : tm >= 240 ? '반나절+' : '반나절';
    return `<button class="h3-area" data-act="areaSheet" data-id="${a.id}">
      <span class="h3-at" style="--c1:${c1};--c2:${c2}">${ph ? areaImg(a.id).replace('<img ', '<img loading="lazy" ') : `<span lang="ja">${AREA_JA[a.id] || ''}</span>`}</span>
      <span class="h3-ab"><b>${a.n}</b><small>${esc(a.sub)}</small><em>${span} · ${L(`${n}곳`, `${n}か所`)}</em></span>
    </button>`;
  };
  return `${h3BandV(L('동네', 'エリア'), L(`후쿠오카 동네 ${AREAS.length}곳 · 눌러서 명소 보기`, `福岡のエリア${AREAS.length}か所 · タップで見どころ`))}
  <main class="h3-page">
    <div class="h3-seg" role="tablist">${segs
      .map(([k, t]) => {
        const n = AREAS.filter(a => (a.kind || 'city') === k).length;
        return `<button role="tab" aria-selected="${seg === k}" class="${seg === k ? 'on' : ''}" data-act="aseg" data-k="${k}">${t} ${n}</button>`;
      })
      .join('')}</div>
    <div class="h3-alist">${list.map(card).join('')}</div>
  </main>`;
}

// 내 여행 탭
function h3TripsV() {
  const plans = sortedPlans(),
    up = plans.filter(p => planStatus(p).k !== 'past'),
    f = up[0],
    rest = plans.filter(p => p !== f);
  const big = f
    ? (() => {
        const st = planStatus(f),
          areas = (f.areas || []).filter(id => AREA[id]);
        return `<h2 class="h3-sec red">${st.k === 'now' ? L('여행 중', '旅行中') : L('다가오는 여행', '次の旅行')}</h2>
        <article class="h3-card h3-trip">
          <div class="h3-ch"><span class="h3-pill${st.k === 'now' ? '' : ' red'}">${st.label}</span><span class="h3-dl">${mds(f.set.start)} – ${mds(f.set.end)}</span>
            <button class="ib sm" data-act="delAsk" data-id="${f.id}" aria-label="${esc(f.title)} ${L('삭제', '削除')}">${ic('trash')}</button></div>
          <h2 class="h3-tt">${esc(f.title)}</h2>
          ${areas.length ? `<div class="h3-chips">${areas.map(id => `<span>${esc(shortArea(L(AREA[id].n, AREA_JA[id] || AREA[id].n)))}</span>`).join('')}</div>` : ''}
          <div class="h3-days">${f.days
            .slice(0, 6)
            .map(
              (d, i) =>
                `<button data-act="openPlan" data-id="${f.id}" data-di="${i}"><b>${L(`${i + 1}일차`, `${i + 1}日目`)}</b>${mds(d.date)}</button>`
            )
            .join('')}</div>
          <div class="h3-row"><button class="h3-cta" data-act="openPlan" data-id="${f.id}">${L('일정 보기', '予定を見る')}</button><button class="h3-sq" data-act="xferSheet" aria-label="${IS_APP ? L('계획 공유하기', '計画を共有') : L('계획 옮기기', '計画を移す')}">${ic('share')}</button></div>
        </article>`;
      })()
    : `<div class="h3-none"><p>${L('아직 세운 여행 계획이 없어요.', 'まだ旅行計画がありません。')}</p><button class="h3-cta" data-act="newPlan">${ic('plus')}${L('새 여행 계획 세우기', '新しい旅行計画を作る')}</button></div>`;
  return `${h3BandV(L('내 여행', 'マイ旅行'), plans.length ? L(`계획 ${plans.length}개`, `計画 ${plans.length}件`) : '')}
  <main class="h3-page">
    ${big}
    ${f ? `<button class="h3-new" data-act="newPlan">${ic('plus')}<span>${L('새 여행 계획 세우기', '新しい旅行計画を作る')}</span></button>` : ''}
    ${rest.length ? `<h2 class="h3-sec">${L('다른 계획', 'ほかの計画')}</h2><ul class="plist">${rest.map(planRow).join('')}</ul>` : ''}
    <button class="h3-recv" data-act="recvOpen">${ic('save')}<span>${L('공유받은 계획 불러오기', '受け取った計画を取り込む')}</span></button>
    <p class="store-note" id="storeNote">${storeNote()}</p>
    ${S.photoBroken ? '' : `<p class="credit">${L('배경 사진', '背景の写真')} <a href="${heroPhoto(heroScene()).url}" target="_blank" rel="noopener">${heroPhoto(heroScene()).by}</a> · Unsplash</p>`}
  </main>`;
}

// ★ 화면: 홈 (ui.js 의 render 가 불러요)
function homeV() {
  const t = S.htab || 'home';
  const body = t === 'prep' ? h3PrepV() : t === 'areas' ? h3AreasV() : t === 'trips' ? h3TripsV() : h3HomeV();
  return `<div class="h3 h3-${t}${t === 'home' && S.h3p2 ? ' on-p2' : ''}">${t === 'home' ? `<div class="h3-bg">${h3Bg()}<span class="h3-shade"></span><span class="h3-dim"></span></div>` : ''}${body}${h3NavV()}</div>`;
}

// 넘기기 연결 (render 가 끝날 때 불러요)
// - 세로: 첫 화면(큰 제목) ↔ 카드 화면. 넘길수록 사진이 살짝 어두워지고 큰 제목이 사라지며 한 줄 제목이 나타나요
// - 가로: 카드 두 장. 손가락으로 밀면 위 제목·점이 따라 바뀌어요
function h3Wire() {
  const pages = document.getElementById('h3pages');
  if (pages) {
    const root = pages.closest('.h3'),
      hero = pages.querySelector('.h3-hero'),
      logo = root.querySelector('.h3-logo'),
      dim = root.querySelector('.h3-dim');
    const paint = () => {
      const f = Math.min(1, pages.scrollTop / Math.max(1, pages.clientHeight));
      if (hero) hero.style.opacity = String(Math.max(0, 1 - f * 1.8));
      if (dim) dim.style.opacity = String(f * 0.5);
      if (logo && !logo.hidden) logo.style.opacity = String(Math.max(0, f * 2 - 0.8));
      const on = f > 0.5;
      if (on !== !!S.h3p2) {
        S.h3p2 = on;
        root.classList.toggle('on-p2', on);
        if (typeof navSync === 'function') navSync();
      }
    };
    if (S.h3p2 && pages.querySelector('.h3-p2')) pages.scrollTop = pages.clientHeight;
    else S.h3p2 = false;
    paint();
    pages.addEventListener('scroll', paint, { passive: true });
  }
  const car = document.getElementById('h3car');
  if (!car) return;
  car.scrollLeft = (S.hpage === 1 ? 1 : 0) * car.clientWidth;
  car.addEventListener(
    'scroll',
    () => {
      const n = Math.round(car.scrollLeft / Math.max(1, car.clientWidth));
      if (n !== (S.hpage || 0)) {
        S.hpage = n;
        h3Paint(n);
      }
    },
    { passive: true }
  );
}
// 첫 화면으로 / 카드 화면으로
function h3GoPage(n) {
  const pages = document.getElementById('h3pages');
  if (pages) pages.scrollTo({ top: n ? pages.clientHeight : 0, behavior: 'smooth' });
}
function h3Paint(n) {
  const tb = document.querySelector('.h3-tabs');
  if (!tb) return;
  tb.querySelector('.h3-tc').textContent = n ? tb.dataset.l1 : tb.dataset.l0;
  tb.querySelector('.h3-tl').hidden = !n;
  tb.querySelector('.h3-tr').hidden = !!n;
  document.querySelectorAll('.h3-dots i').forEach((d, i) => d.classList.toggle('on', i === n));
}

Object.assign(A, {
  htab(d) {
    // 계획 화면에서 누르면 그 탭으로 홈에 돌아가요 (저장 안 했으면 먼저 물어요)
    if (S.view !== 'home') {
      S.htab = d.t;
      S.h3p2 = false;
      A.goHome();
      return;
    }
    if (d.t === 'home' && S.htab === 'home' && S.h3p2) {
      h3GoPage(0);
      return;
    }
    S.htab = d.t;
    S.h3p2 = false;
    S.sheet = null;
    render();
    window.scrollTo(0, 0);
  },
  h3Down() {
    h3GoPage(1);
  },
  hPage(d) {
    const car = document.getElementById('h3car'),
      n = Number(d.n) || 0;
    S.hpage = n;
    h3Paint(n);
    if (car) car.scrollTo({ left: n * car.clientWidth, behavior: 'smooth' });
  },
  aseg(d) {
    S.aseg = d.k;
    render();
  },
  // 홈 카드의 「길찾기」: 그 계획을 열고 지금 위치에서 다음 장소까지 안내
  h3Go(d) {
    A.openPlan({ id: d.id });
    A.gpsGo({ uid: d.uid });
  },
  // 내 여행 「공유받은 계획 불러오기」: 공유 시트를 가져오기 칸이 펼쳐진 채로 열어요
  recvOpen() {
    S.sheet = { type: 'xfer', m: 'out', pick: 'all', openIn: true };
    prepLink(S.sheet);
    render();
  }
});
