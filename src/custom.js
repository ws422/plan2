// =====================================================================
// custom.js — 목록에 없는 일정 직접 넣기 + 그 위치 정하기
// 플래너 목록에 없는 곳은 앱이 위치를 몰라요. 「어디쯤이에요?」에서 고른 곳을
// 그 칸의 위치로 써야 지도 핀·이동 시간·길안내가 맞아요.
//   - 마지막 장소 근처: 바로 앞 칸과 같은 자리 (예전 방식). 맨 뒤에 넣어요
//   - 숙소: 그날 숙소 (숙소를 바꾸면 따라 바뀌어요)
//   - 동네: 그 동네 가운데 (몇백 m 오차)
//   - 구글 지도 좌표: 「33.5905, 130.3976」 이나 구글 지도 주소를 붙여 넣기
// 일정 칸에 남는 값: wh ('near' · 'hotel' · 'a:동네id' · 'pin'), whn (near 일 때 옆 장소 이름)
// =====================================================================

// 그날 숙소가 몇 번째 밤 숙소인지 (engine.js 의 dayHotel 과 같은 기준)
function hotelNi(plan, di) {
  return Math.min(di, Math.max(0, plan.days.length - 2));
}
// 붙여 넣은 글자에서 좌표 꺼내기. 못 찾으면 null, 후쿠오카·규슈 북부 밖이면 { far: true }
function parseLatLng(text) {
  const t = String(text || '').trim();
  const m =
    t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || t.match(/(-?\d{1,2}\.\d{2,})\s*(?:[,，]\s*|\s+)(-?\d{2,3}\.\d{2,})/);
  if (!m) return null;
  const lat = Number(m[1]),
    lng = Number(m[2]);
  if (!(lat > 30.9 && lat < 34.6 && lng > 129.3 && lng < 132.2)) return { far: true };
  return { lat, lng };
}
// 가장 가까운 동네 (좌표만 있을 때 구역 z 를 정하려고)
function nearestArea(pt) {
  return AREAS.slice().sort((a, b) => km(a, pt) - km(b, pt))[0];
}
// 일정 칸 위치 한 줄 설명 (카드에 보여요). 예전에 넣은 칸은 빈 글자
function whereLabel(it) {
  if (!it.custom) return '';
  if (it.place === 'hotel') return L('숙소', '宿');
  if (it.wh && it.wh.startsWith('a:')) {
    const id = it.wh.slice(2);
    return AREA[id] ? L(`${AREA[id].n} 근처`, `${AREA_JA[id] || AREA[id].n}周辺`) : '';
  }
  if (it.wh === 'pin') return L('구글 지도 좌표', 'Googleマップの座標');
  if (it.wh === 'near' && it.whn) return L(`${it.whn} 근처`, `${trText(it.whn)}の近く`);
  return '';
}
// 지금 칸의 위치가 고르기 칸의 어느 값인지
function whereValue(it) {
  if (it.place === 'hotel') return 'hotel';
  if (it.wh && (it.wh.startsWith('a:') || it.wh === 'pin')) return it.wh;
  return 'near';
}

// 「어디쯤이에요?」 고르기 칸. pre: 입력칸 id 앞글자 (c 추가 · w 위치 바꾸기)
// o: { cur: 고른 값, nearName: 「○○ 근처」에 쓸 이름, pin: 좌표 칸에 미리 넣을 글자 }
function wherePickV(pre, o) {
  const p = S.plan,
    di = S.di,
    today = new Set(p.days[di].areas || []);
  const aName = a => L(a.n, AREA_JA[a.id] || a.n);
  const opt = (v, t) => `<option value="${v}"${o.cur === v ? ' selected' : ''}>${esc(t)}</option>`;
  const mine = AREAS.filter(a => today.has(a.id)),
    rest = AREAS.filter(a => !today.has(a.id));
  return `<label class="fld wh-f"><span>${L('어디쯤이에요?', 'どのあたりですか?')}</span>
      <select id="${pre}Where" data-change="wherePick" data-pre="${pre}">
        ${opt('near', o.nearName ? L(`${o.nearName} 근처`, `${trText(o.nearName)}の近く`) : L('바로 앞 장소 근처', 'ひとつ前の場所の近く'))}
        ${opt('hotel', L(`숙소 · ${hotelLabel(dayHotel(p, di))}`, `宿 · ${hotelLabelT(dayHotel(p, di))}`))}
        ${mine.length ? `<optgroup label="${esc(L('오늘 가는 동네', '今日行くエリア'))}">${mine.map(a => opt('a:' + a.id, aName(a))).join('')}</optgroup>` : ''}
        <optgroup label="${esc(L('다른 동네', 'ほかのエリア'))}">${rest.map(a => opt('a:' + a.id, aName(a))).join('')}</optgroup>
        ${opt('pin', L('구글 지도 좌표로 정확하게', 'Googleマップの座標で正確に'))}
      </select></label>
    <div class="wh-pin" id="${pre}PinBox"${o.cur === 'pin' ? '' : ' hidden'}>
      <input id="${pre}Pin" inputmode="decimal" autocomplete="off" value="${esc(o.pin || '')}" placeholder="${esc(L('예: 33.5905, 130.3976', '例: 33.5905, 130.3976'))}" aria-label="${esc(L('구글 지도 좌표', 'Googleマップの座標'))}">
      <small>${L('구글 지도에서 그 장소를 길게 누르면 맨 위에 나오는 숫자를 복사해서 붙여 넣어요. 구글 지도 주소를 붙여 넣어도 돼요.', 'Googleマップでその場所を長押しすると上に出る数字をコピーして貼り付けます。GoogleマップのURLでもOKです。')}</small>
    </div>
    <p class="wh-hint">${ic('pin')}<span>${L('어디인지 알려 주면 지도 핀과 이동 시간이 맞아요.', '場所を選ぶと地図のピンと移動時間が合います。')}</span></p>`;
}
// 고른 값 → 일정 칸에 넣을 위치 값. 좌표가 틀리면 { err }
function whereResolve(pre, di, near) {
  const sel = document.getElementById(pre + 'Where'),
    v = sel ? sel.value : 'near';
  if (v === 'hotel') return { place: 'hotel', ni: hotelNi(S.plan, di) };
  if (v.startsWith('a:') && AREA[v.slice(2)]) {
    const a = AREA[v.slice(2)];
    return { lat: a.lat, lng: a.lng, z: a.z, wh: v };
  }
  if (v === 'pin') {
    const g = parseLatLng((document.getElementById(pre + 'Pin') || {}).value);
    if (!g)
      return {
        err: L(
          '좌표를 못 찾았어요. 「33.5905, 130.3976」처럼 숫자 두 개를 붙여 넣어 주세요.',
          '座標が見つかりません。「33.5905, 130.3976」のように数字を2つ貼り付けてください。'
        )
      };
    if (g.far)
      return {
        err: L(
          '후쿠오카에서 너무 먼 좌표예요. 숫자를 다시 확인해 주세요.',
          '福岡から遠すぎる座標です。数字を確認してください。'
        )
      };
    return { lat: g.lat, lng: g.lng, z: nearestArea(g).z, wh: 'pin' };
  }
  return { lat: near.lat, lng: near.lng, z: near.z, wh: 'near', whn: near.name };
}
// 일정 칸의 위치 값을 새로 바꾸기
function whereApply(it, loc) {
  ['place', 'ni', 'lat', 'lng', 'z', 'wh', 'whn'].forEach(k => delete it[k]);
  Object.assign(it, loc);
}
// 추가 시트에서 「○○ 근처」의 기준 (그날 마지막 칸, 없으면 출발지)
function addNearPt(p, di) {
  const c = computeDay(p, di);
  if (c.rows.length) {
    const r = c.rows[c.rows.length - 1];
    return { ...r.p, name: itemName(p, r.it) };
  }
  return { ...c.startPt, name: c.day.start.kind === 'airport' ? '공항' : '숙소' };
}
// 장소 추가 시트 안의 「목록에 없는 일정 직접 넣기」
function customFormV() {
  const near = addNearPt(S.plan, S.di);
  return `<details class="card custom"><summary>${ic('pin')}목록에 없는 일정 직접 넣기${ic('down', 'chev')}</summary>
      <div class="grid2"><label class="fld"><span>이름</span><input id="cName" maxlength="30" placeholder="예: 호텔에서 쉬기"></label>
      <label class="fld"><span>시간</span><select id="cStay">${[15, 30, 45, 60, 90, 120, 180].map(m => `<option value="${m}"${m === 60 ? ' selected' : ''}>${dur(m)}</option>`).join('')}</select></label></div>
      ${wherePickV('c', { cur: 'near', nearName: near.name })}
      <button class="btn pri" data-act="addCustom">${ic('plus')}${L('넣기', '追加する')}</button>
    </details>`;
}

// 시트: 직접 넣은 일정의 위치 바꾸기
function whereSheetV(sh) {
  const p = S.plan,
    it = p.days[S.di].items.find(x => x.uid === sh.uid);
  if (!it) return '';
  const k = p.days[S.di].items.indexOf(it),
    prev = k > 0 ? p.days[S.di].items[k - 1] : null;
  const cur = whereValue(it);
  return `<div class="sh-h"><div><h2>${L('위치 바꾸기', '場所を変える')}</h2><p>${L(`「${esc(it.n)}」의 위치를 골라요.`, `「${esc(it.n)}」の場所を選びます。`)}</p></div><button class="ib sm" data-act="closeSheet" aria-label="${L('닫기', '閉じる')}">${ic('close')}</button></div>
    ${wherePickV('w', { cur, nearName: prev ? itemName(p, prev) : '', pin: it.wh === 'pin' ? `${it.lat}, ${it.lng}` : '' })}
    <div class="sh-foot"><button class="btn soft" data-act="closeSheet">${L('취소', 'キャンセル')}</button><button class="btn pri" data-act="whereSet" data-uid="${it.uid}">${L('바꾸기', '変更')}</button></div>`;
}
SHEETS.where = whereSheetV;
SHEET_LABEL.where = '위치 바꾸기';

Object.assign(A, {
  // 직접 넣기: 고른 위치로 칸을 만들고, 가장 덜 돌아가는 자리에 넣어요 (「앞 장소 근처」는 맨 뒤)
  addCustom() {
    const el = document.getElementById('cName'),
      name = (el.value || '').trim();
    if (!name) {
      el.focus();
      toast('이름을 적어 주세요.');
      return;
    }
    const p = S.plan,
      di = S.di,
      loc = whereResolve('c', di, addNearPt(p, di));
    if (loc.err) {
      toast(loc.err);
      const pin = document.getElementById('cPin');
      if (pin) pin.focus();
      return;
    }
    const it = { uid: uid(), n: name, stay: Number(document.getElementById('cStay').value), src: 'user', custom: true };
    whereApply(it, loc);
    pushUndo();
    let msg;
    if (loc.wh === 'near') {
      p.days[di].items.push(it);
      cleanModes(p, di);
      msg = `'${name}'을(를) 마지막에 넣었어요.`;
    } else {
      // 숙소에서 쉬기는 하루 맨 끝(어차피 숙소로 돌아가는 때)이 아닌 낮 사이에 넣어요
      const items = p.days[di].items,
        last = loc.place === 'hotel' && items.length > leadingFixed(p.days[di]) ? items.length - 1 : undefined;
      const b = insertSlot(p, di, it, last);
      msg = L(
        `'${name}'을(를) ${b.k + 1}번째에 넣었어요 · ${fmt(b.arr)} 도착`,
        `「${name}」を${b.k + 1}番目に入れました · ${fmt(b.arr)}着`
      );
    }
    dirty();
    S.sheet = null;
    render();
    toast(msg, true);
  },
  whereSheet(d) {
    S.sheet = { type: 'where', uid: d.uid };
    render();
  },
  whereSet(d) {
    const p = S.plan,
      day = p.days[S.di],
      k = day.items.findIndex(x => x.uid === d.uid);
    if (k < 0) return;
    const it = day.items[k],
      prev = k > 0 ? day.items[k - 1] : null;
    const near = prev ? { ...itemPt(p, prev), name: itemName(p, prev) } : { ...computeDay(p, S.di).startPt, name: '' };
    const loc = whereResolve('w', S.di, near);
    if (loc.err) {
      toast(loc.err);
      const pin = document.getElementById('wPin');
      if (pin) pin.focus();
      return;
    }
    pushUndo();
    whereApply(it, loc);
    if (loc.wh === 'near' && !near.name) delete it.whn;
    cleanModes(p, S.di);
    dirty();
    S.sheet = null;
    render();
    const r = computeDay(p, S.di).rows.find(x => x.it === it);
    toast(
      L(
        `위치를 「${whereLabel(it) || '바로 앞 장소 근처'}」(으)로 바꿨어요${r ? ` · ${fmt(r.arr)} 도착` : ''}`,
        `場所を「${whereLabel(it) || 'ひとつ前の場所の近く'}」にしました${r ? ` · ${fmt(r.arr)}着` : ''}`
      ),
      true
    );
  }
});

// 고르기 칸을 바꾸면 좌표 칸을 보였다 숨겨요
$app.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.change !== 'wherePick') return;
  t.dataset.touched = '1';
  const box = document.getElementById(t.dataset.pre + 'PinBox');
  if (!box) return;
  box.hidden = t.value !== 'pin';
  if (t.value === 'pin') document.getElementById(t.dataset.pre + 'Pin').focus();
});
// 이름에 「호텔·숙소」가 들어가면 위치를 숙소로 먼저 골라 둬요 (직접 고른 뒤에는 건드리지 않아요)
$app.addEventListener('input', e => {
  if (e.target.id !== 'cName') return;
  const sel = document.getElementById('cWhere');
  if (!sel || sel.dataset.touched) return;
  sel.value = /호텔|숙소|ホテル|宿/.test(e.target.value) ? 'hotel' : 'near';
});
