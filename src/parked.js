// ======================================================================
// parked.js · 보류함에서 다시 넣기 (문 여는 시간 확인)
// 보류함의 「N일차에 넣기」를 누르면, 그날 문 닫은 뒤에 도착하지 않는 자리를 찾아 넣어요.
// 그런 자리가 없으면 이유를 보여 주고, 시간이 맞는 다른 날을 골라 넣을 수 있게 해요.
// 장소 추가·다른 날로 옮기기도 같은 방식으로 자리를 찾고, 시간이 안 맞으면 알려 줘요.
// 고치는 법: docs/수정가이드.md
// ======================================================================

// 장소 이름 (일본어 화면이면 일본어 이름)
function slotName(p, it) {
  return LANG === 'ja' && it.sid ? SPOT[it.sid].j : itemName(p, it);
}
// 자리 문제를 한 문장으로 (한국어·일본어)
function slotWhyT(p, di, it, b) {
  const s = it.sid && SPOT[it.sid],
    wd = weekday(p.days[di].date);
  if (b.why.includes('closed')) return L(`${WD[wd]}요일은 쉬는 날이에요`, `${WD[wd]}曜日は定休日です`);
  if (b.why.includes('late'))
    return L(
      `${fmt(b.arr)}에 도착해서 ${s.to}쯤 문 닫기 전에 다 못 봐요`,
      `${fmt(b.arr)}着で、${s.to}ごろの閉店までに回りきれません`
    );
  if (b.why.includes('early'))
    return L(`${fmt(b.arr)}에 도착하는데 ${s.from}에 문을 열어요`, `${fmt(b.arr)}着ですが、開店は${s.from}です`);
  if (b.why.includes('push')) {
    const n = b.pushed.map(x => slotName(p, x)).join(', ');
    return L(`넣으면 ${n}이(가) 문 닫은 뒤에 도착해요`, `入れると「${n}」が閉まった後の到着になります`);
  }
  return '';
}
// 시간이 맞는 다른 날 (가장 덜 늘어나는 순)
function slotOtherDays(p, it, skip) {
  return p.days
    .map((d, j) => (j === skip ? null : { j, b: bestSlot(p, j, it) }))
    .filter(o => o && o.b.ok)
    .sort((a, b) => a.b.score - b.b.score);
}
// 넣은 뒤 알림: 시간이 안 맞으면 이유 + 맞는 날
function slotToast(p, di, it, b) {
  if (b.ok)
    return L(
      `${di + 1}일차 ${b.k + 1}번째에 넣었어요 · ${fmt(b.arr)} 도착`,
      `${di + 1}日目の${b.k + 1}番目に入れました · ${fmt(b.arr)}着`
    );
  const alt = slotOtherDays(p, it, di)[0];
  return (
    L(
      `${di + 1}일차에 넣었지만 ${slotWhyT(p, di, it, b)}.`,
      `${di + 1}日目に入れましたが、${slotWhyT(p, di, it, b)}。`
    ) + (alt ? L(` ${alt.j + 1}일차가 시간이 맞아요.`, ` ${alt.j + 1}日目なら時間が合います。`) : '')
  );
}
// 보류함 칸 → 일정 칸
function parkedToItem(x) {
  const { reason, fromDay, ...it } = x;
  it.src = 'user';
  return it;
}
// 보류함에서 꺼내 di일차에 넣기 (자리는 그날 가장 좋은 곳)
function doUnpark(uid, di) {
  const p = S.plan,
    k = p.parked.findIndex(x => x.uid === uid);
  if (k < 0) return;
  pushUndo();
  const [x] = p.parked.splice(k, 1),
    it = parkedToItem(x);
  const b = insertSlot(p, di, it);
  S.di = di;
  S.openParked = true;
  S.sheet = null;
  dirty();
  render();
  toast(slotToast(p, di, it, b), true);
}
// 시트: 이 날엔 시간이 안 맞아요 → 다른 날 고르기
function unparkSheetV(sh) {
  const p = S.plan,
    x = p && p.parked.find(y => y.uid === sh.uid);
  if (!x)
    return (
      shHead(L('보류함', '保留'), '') +
      `<p class="note">${ic('alert')}<span>${L('이 장소를 찾을 수 없어요.', 'この場所が見つかりません。')}</span></p>`
    );
  const it = parkedToItem(x),
    here = bestSlot(p, S.di, it),
    others = slotOtherDays(p, it, S.di),
    name = esc(slotName(p, it));
  const list = others.length
    ? `<h3 class="sec"><span>${L('시간이 맞는 날', '時間が合う日')}</span></h3><ul class="up-days">${others
        .map(
          o =>
            `<li><button class="up-day" data-act="unparkTo" data-uid="${x.uid}" data-di="${o.j}"><b>${L(`${o.j + 1}일차`, `${o.j + 1}日目`)}</b><span>${mds(p.days[o.j].date)}</span><small>${L(`${fmt(o.b.arr)} 도착 · ${o.b.k + 1}번째`, `${fmt(o.b.arr)}着 · ${o.b.k + 1}番目`)}</small>${ic('next', 'chev')}</button></li>`
        )
        .join('')}</ul>`
    : `<p class="note">${ic('clock')}<span>${L('어느 날에도 문 여는 시간 안에 넣을 자리가 없어요. 그날 다른 장소를 빼거나 하루 마무리 시간을 늦춰 보세요.', 'どの日も営業時間内に入れられる場所がありません。その日のほかの場所を外すか、1日の終了時間を遅らせてみてください。')}</span></p>`;
  return (
    shHead(
      L(`${name} 다시 넣기`, `${name}を戻す`),
      L(`${S.di + 1}일차엔 시간이 안 맞아요.`, `${S.di + 1}日目は時間が合いません。`)
    ) +
    `<p class="note warn">${ic('alert')}<span>${esc(slotWhyT(p, S.di, it, here))}</span></p>` +
    list +
    `<div class="sh-foot col"><button class="btn soft" data-act="unparkTo" data-uid="${x.uid}" data-di="${S.di}">${L(`그래도 ${S.di + 1}일차에 넣기`, `それでも${S.di + 1}日目に入れる`)}</button><button class="btn soft" data-act="closeSheet">${L('보류함에 그대로 두기', '保留のままにする')}</button></div>`
  );
}
SHEETS.unpark = unparkSheetV;
SHEET_LABEL.unpark = '보류함';
Object.assign(A, {
  // 보류함의 「N일차에 넣기」: 시간이 맞으면 바로 넣고, 안 맞으면 시트로
  unpark(d) {
    const p = S.plan,
      x = p.parked.find(y => y.uid === d.uid);
    if (!x) return;
    const b = bestSlot(p, S.di, parkedToItem(x));
    if (b.ok) doUnpark(d.uid, S.di);
    else {
      S.sheet = { type: 'unpark', uid: d.uid };
      render();
    }
  },
  unparkTo(d) {
    doUnpark(d.uid, Number(d.di));
  }
});
