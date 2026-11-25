// ======================================================================
// nav.js · 안드로이드 뒤로가기
// 뒤로가기를 누르면 앱이 닫히지 않고 바로 전 화면(열린 시트 → 이전 단계 → 홈)으로 가요.
// 홈에서 누르면 「한 번 더 누르면 닫혀요」 안내가 나오고, 2초 안에 한 번 더 누르면 앱이 닫혀요.
// 고치는 법: docs/수정가이드.md
// ======================================================================
//
// 어떻게 동작하나요?
// · 화면이 한 단계 안으로 들어갈 때마다 브라우저 기록을 한 칸씩 쌓아요 (홈 = 1칸, 동네 탭 = 2칸, 계획 = 3칸 …).
//   뒤로가기를 누르면 브라우저가 한 칸 내려가고, 앱도 한 단계 뒤로 가요.
// · 기록은 「화면을 직접 누른 뒤」에만 쌓아요. 뒤로가기 직후 손대지 않은 상태에서 기록을 쌓으면
//   크롬이 그 칸들을 「건너뛸 칸」으로 표시해서, 다음 뒤로가기에 앱이 통째로 닫혀 버려요.
//   (예전에 뒤로가기를 연달아 누르면 앱이 꺼지던 이유예요)
// · 버튼으로 홈에 돌아오는 등 화면이 바깥으로 나가면 남은 칸은 history.go(-n) 으로 치워요.
//   칸이 모자라면 앞으로 가기(history.go(+n))로 이미 있던 칸을 되살려요. 둘 다 새 칸을 만들지 않아요.
const NAV = {
  on: IS_APP && !!(window.history && history.pushState),
  d: 0, // 지금 브라우저 기록이 앱 안에서 몇 칸째인지 (처음 연 칸 = 0)
  max: 0, // 앞으로 가기로 되살릴 수 있는 마지막 칸
  expect: null, // 앱이 직접 history.go 로 옮기는 중이면 도착할 칸
  fresh: false, // 마지막 뒤로가기 뒤에 화면을 직접 눌렀는지
  armed: false, // 홈에서 한 번 눌러 「한 번 더 누르면 닫혀요」를 보여 준 상태
  armT: null,
  goT: null
};
if (NAV.on) {
  try {
    history.scrollRestoration = 'manual';
  } catch (e) {}
  const st0 = history.state;
  if (st0 && st0.fkd) NAV.d = NAV.max = st0.fkd; // 새로고침해도 칸 수를 이어 가요
}

// ---- 지금 화면이 몇 단계 안쪽인지 (홈 = 1) ----
function sheetDepth(sh) {
  if (!sh) return 0;
  if (sh.type === 'spot' && sh.back) return 1 + sheetDepth(sh.back); // 동네·추가·대안 시트 → 장소 정보
  if (sh.type === 'hpick' && sh.backSh) return 1 + sheetDepth(sh.backSh); // 추천 장소 → 직접 추가
  if (sh.type === 'hpick' && sh.back) return 2; // 숙소 시트 → 숙소 위치
  return 1;
}
function navDepth() {
  const v = S.view;
  let d = 1;
  if (v === 'home') d += (S.htab || 'home') !== 'home' || S.h3p2 ? 1 : 0;
  else if (v === 'dates') d += 1;
  else if (v === 'how') d += 2;
  else if (v === 'areas' || v === 'wplan') d += 3;
  else if (v === 'plan') d += 2 + (S.tab !== 'sched' ? 1 : 0) + (S.sel ? 1 : 0);
  return d + sheetDepth(S.sheet);
}

// 홈 첫 화면인지 (시트·다른 탭·아래 페이지 없음)
function navAtRoot() {
  return navDepth() <= 1;
}
// ---- 기록 칸 맞추기 (화면이 바뀔 때마다 render() 끝에서 불러요) ----
function navCanPush() {
  const ua = navigator.userActivation;
  return NAV.fresh && !(ua && !ua.isActive);
}
function navGo(to) {
  if (to === NAV.d) return;
  NAV.expect = to;
  clearTimeout(NAV.goT);
  // 브라우저가 움직이지 않으면(칸이 없으면) 0.8초 뒤 지금 칸으로 다시 맞춰요
  NAV.goT = setTimeout(() => {
    if (NAV.expect !== to) return;
    NAV.expect = null;
    NAV.d = (history.state && history.state.fkd) || 0;
  }, 800);
  history.go(to - NAV.d);
}
function navSync() {
  if (!NAV.on || NAV.expect !== null) return;
  const want = navDepth();
  if (NAV.armed) {
    if (!NAV.fresh || want <= 1) return; // 「한 번 더 누르면 닫혀요」 기다리는 중
    navDisarm();
  }
  try {
    if (want > NAV.d) {
      if (navCanPush()) {
        while (NAV.d < want) history.pushState({ fkd: ++NAV.d }, '');
        NAV.max = NAV.d;
      } else if (NAV.max > NAV.d) navGo(Math.min(want, NAV.max));
    } else if (want < NAV.d) navGo(want);
  } catch (e) {
    NAV.on = false;
  }
}

// ---- 홈에서 뒤로가기: 한 번 더 누르면 닫혀요 ----
function navArm() {
  NAV.armed = true;
  toast(L('뒤로가기를 한 번 더 누르면 앱이 닫혀요', 'もう一度「戻る」を押すとアプリを閉じます'));
  clearTimeout(NAV.armT);
  NAV.armT = setTimeout(() => {
    NAV.armed = false;
    if (NAV.expect === null && NAV.d === 0 && NAV.max >= 1 && navDepth() <= 1) navGo(1);
  }, 2000);
}
function navDisarm() {
  NAV.armed = false;
  clearTimeout(NAV.armT);
}

// ---- 앱 안에서 한 단계 뒤로 ----
function navBack() {
  if (typeof DRAG !== 'undefined' && DRAG) {
    dragEnd(false);
    return;
  }
  const sh = S.sheet;
  if (sh) {
    if (sh.type === 'spot' && sh.back) A.spotBack();
    else if (sh.type === 'hpick' && (sh.backSh || sh.back)) {
      S.sheet = sh.backSh ? { ...sh.backSh } : { type: sh.back };
      S.keepSheetScroll = !!sh.backSh;
      render();
    } else A.closeSheet();
    return;
  }
  if (S.view === 'home' && (S.htab || 'home') === 'home' && S.h3p2) {
    S.h3p2 = false;
    h3GoPage(0);
    return;
  }
  if (S.view === 'home' && S.htab && S.htab !== 'home') {
    A.htab({ t: 'home' });
    return;
  }
  if (S.view === 'plan') {
    if (S.sel) {
      S.sel = null;
      render();
      return;
    }
    if (S.tab !== 'sched') {
      A.tab({ t: 'sched' });
      return;
    }
    A.goHome();
    return;
  }
  if (S.view === 'areas' || S.view === 'wplan') {
    A.toHow();
    return;
  }
  if (S.view === 'how') {
    A.toDates();
    return;
  }
  if (S.view === 'dates') {
    A.goHome();
    return;
  }
}

if (NAV.on) {
  // 화면을 직접 누르면(클릭·키·선택 바꾸기) 그때부터 기록을 쌓아도 돼요. 처음 누를 때 홈 칸도 만들어요
  ['click', 'keydown', 'change'].forEach(t =>
    document.addEventListener(
      t,
      () => {
        NAV.fresh = true;
        queueMicrotask(navSync);
      },
      true
    )
  );
  window.addEventListener('popstate', e => {
    const nd = (e.state && e.state.fkd) || 0;
    NAV.fresh = false;
    if (NAV.expect !== null) {
      // 앱이 직접 옮긴 것
      NAV.expect = null;
      clearTimeout(NAV.goT);
      NAV.d = nd;
      navSync();
      return;
    }
    const steps = NAV.d - nd;
    NAV.d = nd;
    if (steps <= 0) {
      navSync(); // 앞으로 가기는 화면을 그대로 두고 칸만 맞춰요
      return;
    }
    if (navDepth() <= 1) {
      navArm(); // 홈에서 뒤로가기
      return;
    }
    for (let i = 0; i < steps && navDepth() > 1; i++) navBack();
    navSync();
  });
}
