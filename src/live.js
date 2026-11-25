// ======================================================================
// live.js · 여행 중 다시 짜기 (현재 시각 기준)
// - 일정 탭 위 안내 바: 오늘이면 「지금 출발」, 맞춘 시각이 있으면 「맞춘 시각 지우기」
// - 일정 카드마다 「지금 도착」「지금 출발」, 하루 시작 칸에도 「지금 출발」
// - 누른 시각부터 지하철·열차를 '그 시각 이후 가장 빠른 다음 차'로 다시 계산 (engine.js 의 withTimetable)
//   실제 시간표가 아니라 노선별 배차 간격으로 추정해요. 막차가 지나면 경고.
// - 바뀐 내용은 배너로 보여 주고, 「남은 일정 다시 짜기」는 사용자가 직접 눌러요 (자동으로 바꾸지 않음)
// 화면에 끼우는 곳: ui.js 의 legRow(다음 차) · itemRow(버튼·태그) · schedTab(시작 칸) · bannerV(안내 바·배너)
// ======================================================================

// 지금 시각(분)
function nowMin() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

// 맞추기 전/후를 비교한 요약 (배너에 표시)
function syncSummary(p, before, after) {
  const L = [];
  if (before.start !== after.start) L.push({ k: 'ok', t: `<b>출발</b> ${fmt(before.start)} → ${fmt(after.start)}` });
  const legs = [
    ...after.rows.map(r => ({ leg: r.leg, b: itemName(p, r.it) })),
    { leg: after.endLeg, b: after.day.end.kind === 'airport' ? '공항' : '숙소' }
  ];
  legs
    .filter(x => x.leg.tt && x.leg.mode !== 'none' && x.leg.mode !== 'walk' && !x.leg.lastGone)
    .slice(0, 3)
    .forEach(x =>
      L.push({
        k: '',
        t: `<b>다음 ${MODE[x.leg.mode].n}</b> ${fmt(x.leg.depAt % 1440)} 출발${x.leg.wait ? ` (${x.leg.wait}분 대기)` : ''} → ${esc(x.b)}`
      })
    );
  legs
    .filter(x => x.leg.lastGone)
    .forEach(x => L.push({ k: 'warn', t: `<b>막차가 끝났어요</b> ${esc(x.b)}까지는 택시로 바꿔 보세요.` }));
  const d = after.endArr - before.endArr;
  L.push({
    k: after.over > 0 ? 'warn' : 'ok',
    t: `<b>마무리</b> ${fmt(before.endArr)} → ${fmt(after.endArr)}${d ? ` (${d > 0 ? '+' : ''}${d}분)` : ''}${after.over > 0 ? ` · 목표보다 ${after.over}분 늦어요` : ''}`
  });
  const was = new Set(before.rows.flatMap(r => r.warn.map(w => r.it.uid + w)));
  after.rows.forEach(r =>
    r.warn.forEach(w => {
      if (!was.has(r.it.uid + w) && L.length < 8)
        L.push({ k: 'warn', t: `<b>${esc(itemName(p, r.it))}</b> ${esc(w)}` });
    })
  );
  return L;
}

// 항목 하나에 '지금' 시각을 적고 이후 일정을 다시 계산 (key: 'arrAct' 도착 | 'leave' 출발)
function liveSet(uid, key) {
  const p = S.plan,
    day = p.days[S.di],
    idx = day.items.findIndex(i => i.uid === uid),
    it = day.items[idx];
  if (!it) return;
  const before = computeDay(p, S.di),
    n = nowMin();
  pushUndo();
  it[key] = n;
  if (key === 'arrAct' && it.leave != null && it.leave < n) delete it.leave;
  if (key === 'leave' && it.arrAct != null && it.arrAct > n) delete it.arrAct;
  dirty();
  S.banner = {
    title:
      key === 'arrAct'
        ? `${itemName(p, it)}에 ${fmt(n)} 도착으로 맞췄어요`
        : `${itemName(p, it)}에서 ${fmt(n)} 출발로 맞췄어요`,
    sync: syncSummary(p, before, computeDay(p, S.di)),
    fixed: idx + 1
  };
  S.sel = null;
  render();
  scrollToBanner();
}

// 배너가 보이도록 화면을 부드럽게 내려 줘요 (위쪽 날짜 탭에 가리지 않게 130px 여유)
function scrollToBanner() {
  const el = document.querySelector('.banner');
  if (el)
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 130), behavior: 'smooth' });
}

// 일정 탭 위쪽 안내 바: 오늘이면 지금 시각과 '지금 출발', 맞춘 시각이 있으면 '지우기'
function liveBar(p, di) {
  const day = p.days[di],
    has = !!day.live || day.items.some(i => i.arrAct != null || i.leave != null);
  if (day.date !== today() && !has)
    return `<div class="livebar soft">${ic('clock')}<span><b>여행 중에 늦어졌다면</b><small>장소를 눌러 ‘지금 도착’·‘지금 출발’을 고르면 실제 시각에 맞춰 이후 시각과 다음 지하철·열차를 다시 계산해요.</small></span></div>`;
  return `<div class="livebar">${ic('clock')}<span><b>지금 ${fmt(nowMin())}</b><small>${has ? '실제 시각에 맞춘 일정이에요. 지하철·열차는 ‘다음 차’ 기준(배차 간격 추정)이에요.' : '늦어졌다면 지금 시각으로 맞춰 보세요. 이후 지하철·열차를 ‘가장 빠른 다음 차’로 다시 계산해요.'}</small></span>${has ? '<button class="btn soft sm" data-act="clearLive">맞춘 시각 지우기</button>' : '<button class="btn pri sm" data-act="startNow">지금 출발</button>'}</div>`;
}

// 실시간 배너 (맞추기 전/후 요약 + 되돌리기 · 남은 일정 다시 짜기)
function liveBannerV(b) {
  const L = b.sync.map(x => `<li><i class="dot${x.k ? ' d-' + x.k : ''}"></i><span>${x.t}</span></li>`);
  return `<div class="banner" role="status"><div class="bn-h">${ic('clock')}<b>${esc(b.title)}</b></div><ul>${L.join('')}</ul>
    <div class="row2"><button class="btn soft" data-act="undo">${ic('undo')}되돌리기</button><button class="btn pri" data-act="replanLive" data-n="${b.fixed}">${ic('shuffle')}남은 일정 다시 짜기</button></div></div>`;
}

// 이동 칸에 붙는 '다음 차 09:12' / '막차 끝남'
function liveLegTag(leg) {
  if (!(leg.tt && leg.mode !== 'walk' && leg.mode !== 'none')) return '';
  return `<i class="nxt${leg.lastGone ? ' gone' : ''}">${leg.lastGone ? '막차 끝남' : `다음 차 ${fmt(leg.depAt % 1440)}`}</i>`;
}
// 일정 카드에 붙는 맞춘 시각 태그
function liveTags(it) {
  return (
    (it.arrAct != null ? `<span class="tag live">${ic('clock')}${fmt(it.arrAct)} 도착</span>` : '') +
    (it.leave != null ? `<span class="tag live">${ic('clock')}${fmt(it.leave)} 출발</span>` : '')
  );
}
// 일정 카드의 「지금 도착」「지금 출발」
function liveActs(it) {
  return `<div class="itemact"><button class="nowbtn" data-act="arriveNow" data-uid="${it.uid}">${ic('pin')}지금 도착</button><button class="nowbtn" data-act="leaveNow" data-uid="${it.uid}">${ic('clock')}지금 출발</button></div>`;
}
// 펼친 카드의 「이 장소에 맞춘 시각 지우기」
function liveClearBtn(it) {
  if (it.arrAct == null && it.leave == null) return '';
  return `<button class="btn soft sm wide" data-act="clearLiveItem" data-uid="${it.uid}">이 장소에 맞춘 시각 지우기</button>`;
}

Object.assign(A, {
  startNow() {
    const p = S.plan,
      day = p.days[S.di],
      before = computeDay(p, S.di),
      n = nowMin();
    pushUndo();
    day.start.time = fmt(n);
    day.live = true;
    dirty();
    S.banner = {
      title: `${fmt(n)}에 ${day.start.kind === 'airport' ? '공항' : '숙소'}에서 출발하는 걸로 맞췄어요`,
      sync: syncSummary(p, before, computeDay(p, S.di)),
      fixed: leadingFixed(day)
    };
    S.sel = null;
    render();
    scrollToBanner();
  },
  arriveNow(d) {
    liveSet(d.uid, 'arrAct');
  },
  leaveNow(d) {
    liveSet(d.uid, 'leave');
  },
  replanLive(d) {
    const day = S.plan.days[S.di];
    pushUndo();
    const res = replanFrom(S.plan, S.di, Math.max(Number(d.n) || 0, leadingFixed(day)));
    S.banner = { title: '지금 시각에 맞춰 남은 일정을 다시 짰어요', res };
    dirty();
    S.sel = null;
    render();
    scrollToBanner();
  },
  clearLive() {
    const day = S.plan.days[S.di];
    pushUndo();
    day.items.forEach(i => {
      delete i.arrAct;
      delete i.leave;
    });
    delete day.live;
    dirty();
    S.banner = null;
    render();
    toast('맞춘 시각을 모두 지웠어요.', true);
  },
  clearLiveItem(d) {
    const it = S.plan.days[S.di].items.find(i => i.uid === d.uid);
    if (!it) return;
    pushUndo();
    delete it.arrAct;
    delete it.leave;
    dirty();
    render();
    toast('이 장소에 맞춘 시각을 지웠어요.', true);
  }
});
