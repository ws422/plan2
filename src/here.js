// =====================================================================
// here.js — 지금 위치(GPS)에서 다음 장소까지 길 안내
// 길을 잃었을 때: 휴대폰 위치를 받아서, 계획의 다음 장소(또는 고른 장소)까지
// 길안내 탭과 같은 방식(어느 역에서 무엇을 타고, 어디서 내리는지)으로 알려 줘요.
//   - 길안내 탭 맨 위 「지금 위치에서 길찾기」, 일정 카드의 「지금 위치에서 가는 길」
//   - 오늘 날짜의 일정이 있으면 그날 기준, 지금 시각 이후의 첫 장소가 기본 목적지
//   - 위치는 저장하지 않아요 (화면을 닫으면 잊어요)
// =====================================================================

const HERE = { pos: null, at: 0, acc: 0, err: '', busy: false };

// 오늘 날짜의 일정 번호 (없으면 지금 보고 있는 날)
function hereDay(p) {
  const t = ymd(new Date()),
    i = p.days.findIndex(d => d.date === t);
  return { di: i >= 0 ? i : S.di, today: i >= 0 };
}
// 목적지 후보: 그날 장소들 + 마지막 숙소 (legPoints 의 번호를 그대로 써요 → 일본어 카드와 맞아요)
function hereTargets(p, di) {
  const { c, pts } = legPoints(p, di);
  const list = c.rows.map((r, k) => ({ i: k + 1, pt: pts[k + 1], arr: r.arr, uid: r.it.uid }));
  list.push({ i: pts.length - 1, pt: pts[pts.length - 1], arr: c.endArr, uid: 'end' });
  return list;
}
// 기본 목적지: 오늘이면 지금 시각 10분 전 이후에 도착하는 첫 장소, 아니면 첫 장소
function hereDefault(list, today) {
  if (!today) return list[0];
  const d = new Date(),
    now = d.getHours() * 60 + d.getMinutes();
  return list.find(x => x.arr >= now - 10) || list[list.length - 1];
}
// 지금 위치 → 앱의 지점 모양 { lat, lng, z, name }
function herePt() {
  const a = nearestArea(HERE.pos);
  return {
    lat: HERE.pos.lat,
    lng: HERE.pos.lng,
    z: a.z,
    name: L('지금 위치', '現在地'),
    n: L('지금 위치', '現在地'),
    near: a,
    far: km(HERE.pos, a)
  };
}

// fresh: 「다시 찾기」처럼 저장된 위치 말고 새로 받기
function hereLocate(then, fresh) {
  if (!navigator.geolocation) {
    HERE.err = 'none';
    then();
    return;
  }
  if (HERE.pos && Date.now() - HERE.at < 60000) {
    then();
    return;
  }
  HERE.busy = true;
  HERE.err = '';
  navigator.geolocation.getCurrentPosition(
    p => {
      HERE.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
      HERE.acc = Math.round(p.coords.accuracy || 0);
      HERE.at = Date.now();
      HERE.busy = false;
      then();
    },
    e => {
      HERE.err = e.code === 1 ? 'denied' : 'fail';
      HERE.busy = false;
      then();
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: fresh ? 0 : 30000 }
  );
}

// 길안내 탭 맨 위 카드
function hereCardV() {
  return `<button class="card here-c" data-act="gpsGo">${ic('pin')}<span><b>${L('길을 잃었나요? 지금 위치에서 길찾기', '迷ったら? 現在地から道案内')}</b><small>${L('휴대폰 위치로 다음 장소까지 가는 법을 알려 드려요', 'スマホの位置から次の場所までの行き方を案内します')}</small></span>${ic('next', 'chev')}</button>`;
}

// 시트: 지금 위치에서 길찾기
function hereSheetV(sh) {
  const p = S.plan;
  if (!p) return '';
  const di = Math.min(sh.di ?? S.di, p.days.length - 1),
    today = p.days[di].date === ymd(new Date());
  const head = shHead(
    L('지금 위치에서 길찾기', '現在地から道案内'),
    today
      ? L(`오늘(${di + 1}일차) 일정 기준`, `今日(${di + 1}日目)の予定から`)
      : L(`${di + 1}일차 일정 기준`, `${di + 1}日目の予定から`)
  );
  if (HERE.busy)
    return (
      head + `<div class="here-wait">${ic('pin')}<p>${L('위치를 찾는 중이에요…', '位置を確認しています…')}</p></div>`
    );
  if (!HERE.pos) {
    const msg =
      HERE.err === 'denied'
        ? L(
            '위치 사용이 꺼져 있어요. 브라우저 주소창 왼쪽의 자물쇠(또는 ⓘ)를 눌러 「위치」를 허용한 뒤 다시 눌러 주세요. 홈 화면 앱이면 휴대폰 설정 → 앱 → 크롬 → 권한 → 위치에서 켜요.',
            '位置情報がオフです。アドレスバー左の鍵マークから「位置情報」を許可して、もう一度押してください。'
          )
        : HERE.err === 'none'
          ? L('이 브라우저는 위치를 쓸 수 없어요.', 'このブラウザでは位置情報が使えません。')
          : L(
              '위치를 찾지 못했어요. 밖으로 나오거나 잠시 뒤 다시 해 보세요.',
              '位置がわかりませんでした。屋外に出るか、少ししてから試してください。'
            );
    return (
      head +
      `<p class="note warn">${ic('alert')}<span>${msg}</span></p><div class="sh-foot"><button class="btn soft" data-act="closeSheet">${L('닫기', '閉じる')}</button><button class="btn pri" data-act="hereRetry">${L('다시 찾기', 'もう一度')}</button></div>`
    );
  }
  const A = herePt(),
    list = hereTargets(p, di),
    cur = list.find(x => x.uid === sh.to) || hereDefault(list, today),
    B = cur.pt;
  const near = nearStations(A, 1.5)[0];
  const loc = `<div class="here-loc">${ic('pin')}<span><b>${L('지금 위치', '現在地')}</b><small>${L(`정확도 약 ${HERE.acc}m`, `精度 約${HERE.acc}m`)}${near ? ` · ${L('가까운 역', '近くの駅')} ${esc(near.s.n)} <span lang="ja">${esc(near.s.j)}</span> ${dist(near.d)}` : ''}</small></span><button class="ib sm" data-act="hereRetry" aria-label="${L('위치 다시 찾기', '位置を再取得')}">${ic('flip')}</button></div>`;
  const pick = `<label class="fld here-to"><span>${L('어디로 갈까요?', 'どこへ行きますか?')}</span><select data-change="hereDest">${list
    .map(
      x =>
        `<option value="${x.uid}"${x === cur ? ' selected' : ''}>${x.uid === 'end' ? L('숙소로 돌아가기', '宿に戻る') : `${fmt(x.arr)} ${esc(x.pt.name)}`}${x === hereDefault(list, today) && today ? L(' · 다음 일정', ' · 次の予定') : ''}</option>`
    )
    .join('')}</select></label>`;
  // 후쿠오카에서 너무 멀면 (한국 집 등) 앱 안내 대신 구글 지도만
  if (A.far > 40)
    return (
      head +
      loc +
      pick +
      `<p class="note warn">${ic('alert')}<span>${L(`지금 위치가 후쿠오카 쪽에서 약 ${Math.round(A.far)}km 떨어져 있어요. 여행지에 도착하면 이 화면에서 역·노선까지 알려 드려요.`, `現在地は福岡から約${Math.round(A.far)}km離れています。現地に着いたら駅・路線まで案内します。`)}</span></p>
      <div class="sh-foot"><button class="btn soft" data-act="closeSheet">${L('닫기', '閉じる')}</button><a class="btn pri" href="${mapsUrl(A, B, 'subway')}" target="_blank" rel="noopener">${L('구글 지도로 길찾기', 'Googleマップで道案内')}</a></div>`
    );
  const opts = legOptions(A, B).filter(o => o.mode !== 'none');
  const o = opts.find(x => x.id === sh.mode) || bestOpt(A, B);
  if (!o || o.mode === 'none')
    return (
      head +
      loc +
      pick +
      `<p class="note">${ic('check')}<span>${L('이미 거의 도착했어요!', 'もうすぐ到着です!')}</span></p><div class="sh-foot"><button class="btn soft" data-act="closeSheet">${L('닫기', '閉じる')}</button></div>`
    );
  const ft = fareTxt(o.fare);
  const chips = `<div class="here-opts">${opts
    .map(
      x =>
        `<button class="${x.id === o.id ? 'on' : ''}" data-act="hereMode" data-m="${x.id}" aria-pressed="${x.id === o.id}">${modeIc(x.mode, 'xs')}<span>${MODE[x.mode].n} ${x.min}${L('분', '分')}</span></button>`
    )
    .join('')}</div>`;
  const steps = guideFor(o, A, B);
  const d0 = new Date(),
    t0 = d0.getHours() * 60 + d0.getMinutes();
  return (
    head +
    loc +
    pick +
    chips +
    `<article class="gcard here-g"><header class="g-h"><span class="g-t">${L('지금 출발하면', '今出発すると')} ${fmt(t0 + o.min)} ${L('도착', '着')}</span><div class="g-r"><b>${L('지금 위치', '現在地')}</b>${ic('next')}<b>${esc(B.name)}</b></div>
      <div class="g-m">${modeIc(o.mode, 'xs')}<span>${MODE[o.mode].n} ${o.min}${L('분', '分')} · ${dist(km(A, B))}${ft ? ` · ${ft}` : ''}</span></div></header>
      <ol class="gsteps">${steps.map(stepHTML).join('')}</ol></article>
    <div class="sh-foot"><a class="btn soft" href="${mapsUrl(A, B, o.mode)}" target="_blank" rel="noopener">${ic('map')}${L('구글 지도', 'Googleマップ')}</a><button class="btn pri" data-act="showJa" data-i="${cur.i}">${ic('taxi')}${L('일본어로 보여주기', '日本語で見せる')}</button></div>`
  );
}
SHEETS.here = hereSheetV;
SHEET_LABEL.here = '지금 위치에서 길찾기';

Object.assign(A, {
  // 길찾기 시작 (data-uid 가 있으면 그 장소로)
  gpsGo(d) {
    const p = S.plan;
    if (!p) return;
    // 일정 카드에서 누른 장소는 그날, 아니면 오늘 날짜의 일정(없으면 보고 있는 날)
    const at = d && d.uid ? p.days.findIndex(x => x.items.some(it => it.uid === d.uid)) : -1;
    const di = at >= 0 ? at : hereDay(p).di;
    S.di = di; // 「일본어로 보여주기」가 같은 날을 보도록
    S.sheet = { type: 'here', di, to: d && d.uid, mode: null };
    render();
    hereLocate(() => S.sheet && S.sheet.type === 'here' && render());
  },
  hereRetry() {
    HERE.at = 0;
    S.keepSheetScroll = true;
    hereLocate(() => S.sheet && S.sheet.type === 'here' && render(), true);
    render();
  },
  hereMode(d) {
    S.sheet = { ...S.sheet, mode: d.m };
    S.keepSheetScroll = true;
    render();
  }
});
// 목적지 바꾸기
$app.addEventListener('change', e => {
  if (e.target.dataset.change !== 'hereDest' || !S.sheet || S.sheet.type !== 'here') return;
  S.sheet = { ...S.sheet, to: e.target.value, mode: null };
  render();
});
