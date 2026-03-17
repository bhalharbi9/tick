const sb3 = window.supabaseClient;
const H3 = window.appHelpers;

const authCard = document.getElementById('authCard');
const adminSection = document.getElementById('adminSection');
const adminFixturesList = document.getElementById('adminFixturesList');

document.getElementById('adminLoginBtn')?.addEventListener('click', adminLogin);
document.getElementById('adminLogoutBtn')?.addEventListener('click', adminLogout);
document.getElementById('refreshAdminBtn')?.addEventListener('click', loadAdminFixtures);
document.getElementById('addFixtureBtn')?.addEventListener('click', addFixture);

document.addEventListener('DOMContentLoaded', async () => {
  const { data } = await sb3.auth.getSession();
  if (data.session) {
    showAdmin();
    loadAdminFixtures();
  }
});

async function adminLogin() {
  H3.clearAlert('adminAlertWrap');
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();

  if (!email || !password) {
    H3.showAlert('adminAlertWrap', 'أدخل البريد وكلمة المرور.', 'danger');
    return;
  }

  try {
    const { error } = await sb3.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showAdmin();
    loadAdminFixtures();
  } catch (error) {
    console.error(error);
    H3.showAlert('adminAlertWrap', 'فشل تسجيل الدخول كمشرف.', 'danger');
  }
}

async function adminLogout() {
  await sb3.auth.signOut();
  authCard.classList.remove('d-none');
  adminSection.classList.add('d-none');
}

function showAdmin() {
  authCard.classList.add('d-none');
  adminSection.classList.remove('d-none');
}

async function addFixture() {
  H3.clearAlert('adminAlertWrap');
  const payload = {
    team_home: document.getElementById('teamHome').value.trim(),
    team_away: document.getElementById('teamAway').value.trim(),
    kickoff: document.getElementById('kickoff').value,
    first_leg_home_goals: parseNullableNumber(document.getElementById('firstLegHome').value),
    first_leg_away_goals: parseNullableNumber(document.getElementById('firstLegAway').value),
    lock_minutes_before: Number(document.getElementById('lockMinutes').value || 10),
    match_url: document.getElementById('matchUrl').value.trim() || null,
    probable_home_lineup: document.getElementById('lineupHome').value.trim() || null,
    probable_away_lineup: document.getElementById('lineupAway').value.trim() || null,
    home_last5: H3.parseLast5(document.getElementById('last5Home').value),
    away_last5: H3.parseLast5(document.getElementById('last5Away').value),
    is_active: true
  };

  if (!payload.team_home || !payload.team_away || !payload.kickoff) {
    H3.showAlert('adminAlertWrap', 'املأ الحقول الأساسية للمباراة.', 'danger');
    return;
  }

  try {
    const { error } = await sb3.from('fixtures').insert(payload);
    if (error) throw error;
    H3.showAlert('adminAlertWrap', 'تمت إضافة المباراة.', 'success');
    clearFixtureForm();
    loadAdminFixtures();
  } catch (error) {
    console.error(error);
    H3.showAlert('adminAlertWrap', 'تعذر إضافة المباراة.', 'danger');
  }
}

function clearFixtureForm() {
  ['teamHome','teamAway','kickoff','firstLegHome','firstLegAway','matchUrl','lineupHome','lineupAway','last5Home','last5Away'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('lockMinutes').value = 10;
}

async function loadAdminFixtures() {
  try {
    const { data, error } = await sb3
      .from('fixtures')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('kickoff', { ascending: true });

    if (error) throw error;
    renderAdminFixtures(data || []);
  } catch (error) {
    console.error(error);
    adminFixturesList.innerHTML = `<div class="alert alert-danger mb-0">تعذر تحميل المباريات.</div>`;
  }
}

function renderAdminFixtures(rows) {
  if (!rows.length) {
    adminFixturesList.innerHTML = `<div class="alert alert-light border mb-0">لا توجد مباريات حتى الآن.</div>`;
    return;
  }

  adminFixturesList.innerHTML = rows.map(f => `
    <div class="card admin-fixture-card">
      <div class="card-body">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <div class="fw-bold">${H3.escapeHtml(f.team_home)} vs ${H3.escapeHtml(f.team_away)}</div>
            <div class="small text-secondary">${H3.formatDateTime(f.kickoff)}</div>
          </div>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteFixture('${f.id}')">حذف</button>
        </div>

        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">نتيجة الذهاب</label>
            <div class="input-group">
              <input id="flh-${f.id}" class="form-control" type="number" min="0" max="20" value="${f.first_leg_home_goals ?? ''}">
              <span class="input-group-text">-</span>
              <input id="fla-${f.id}" class="form-control" type="number" min="0" max="20" value="${f.first_leg_away_goals ?? ''}">
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">النتيجة الفعلية للإياب</label>
            <div class="input-group">
              <input id="ah-${f.id}" class="form-control" type="number" min="0" max="20" value="${f.actual_home_goals ?? ''}">
              <span class="input-group-text">-</span>
              <input id="aa-${f.id}" class="form-control" type="number" min="0" max="20" value="${f.actual_away_goals ?? ''}">
            </div>
          </div>
          <div class="col-md-3">
            <label class="form-label">إغلاق قبل المباراة</label>
            <input id="lm-${f.id}" class="form-control" type="number" min="0" value="${f.lock_minutes_before ?? 10}">
          </div>
          <div class="col-md-3">
            <label class="form-label">رابط المباراة</label>
            <input id="mu-${f.id}" class="form-control" value="${H3.escapeHtml(f.match_url || '')}">
          </div>

          <div class="col-md-6">
            <label class="form-label">تشكيلة ${H3.escapeHtml(f.team_home)}</label>
            <textarea id="lh-${f.id}" class="form-control" rows="4">${H3.escapeHtml(f.probable_home_lineup || '')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">تشكيلة ${H3.escapeHtml(f.team_away)}</label>
            <textarea id="la-${f.id}" class="form-control" rows="4">${H3.escapeHtml(f.probable_away_lineup || '')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">آخر 5 مباريات — ${H3.escapeHtml(f.team_home)}</label>
            <textarea id="h5-${f.id}" class="form-control" rows="2">${Array.isArray(f.home_last5) ? JSON.stringify(f.home_last5) : '[]'}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">آخر 5 مباريات — ${H3.escapeHtml(f.team_away)}</label>
            <textarea id="a5-${f.id}" class="form-control" rows="2">${Array.isArray(f.away_last5) ? JSON.stringify(f.away_last5) : '[]'}</textarea>
          </div>

          <div class="col-12 d-flex flex-wrap gap-2">
            <button class="btn btn-primary" onclick="saveFixture('${f.id}')">حفظ بيانات المباراة</button>
            <button class="btn btn-success" onclick="recalculateFixturePredictions('${f.id}')">إعادة احتساب النقاط</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function parseNullableNumber(value) {
  return value === '' || value == null ? null : Number(value);
}

window.saveFixture = async function (fixtureId) {
  H3.clearAlert('adminAlertWrap');
  const payload = {
    first_leg_home_goals: parseNullableNumber(document.getElementById(`flh-${fixtureId}`).value),
    first_leg_away_goals: parseNullableNumber(document.getElementById(`fla-${fixtureId}`).value),
    actual_home_goals: parseNullableNumber(document.getElementById(`ah-${fixtureId}`).value),
    actual_away_goals: parseNullableNumber(document.getElementById(`aa-${fixtureId}`).value),
    lock_minutes_before: Number(document.getElementById(`lm-${fixtureId}`).value || 10),
    match_url: document.getElementById(`mu-${fixtureId}`).value.trim() || null,
    probable_home_lineup: document.getElementById(`lh-${fixtureId}`).value.trim() || null,
    probable_away_lineup: document.getElementById(`la-${fixtureId}`).value.trim() || null,
    home_last5: H3.parseLast5(document.getElementById(`h5-${fixtureId}`).value),
    away_last5: H3.parseLast5(document.getElementById(`a5-${fixtureId}`).value)
  };

  try {
    const { error } = await sb3.from('fixtures').update(payload).eq('id', fixtureId);
    if (error) throw error;
    H3.showAlert('adminAlertWrap', 'تم حفظ بيانات المباراة.', 'success');
    await recalculateFixturePredictions(fixtureId, false);
    await loadAdminFixtures();
  } catch (error) {
    console.error(error);
    H3.showAlert('adminAlertWrap', 'تعذر حفظ المباراة.', 'danger');
  }
}

window.recalculateFixturePredictions = async function (fixtureId, showSuccess = true) {
  try {
    const { data: fixture, error: fixtureError } = await sb3
      .from('fixtures')
      .select('*')
      .eq('id', fixtureId)
      .single();

    if (fixtureError) throw fixtureError;

    if (fixture.actual_home_goals == null || fixture.actual_away_goals == null) {
      if (showSuccess) H3.showAlert('adminAlertWrap', 'أدخل النتيجة الفعلية أولاً ثم أعد الاحتساب.', 'warning');
      return;
    }

    const { data: predictions, error: predictionsError } = await sb3
      .from('predictions')
      .select('*')
      .eq('fixture_id', fixtureId);

    if (predictionsError) throw predictionsError;
    if (!predictions?.length) {
      if (showSuccess) H3.showAlert('adminAlertWrap', 'لا توجد توقعات لهذه المباراة حالياً.', 'info');
      return;
    }

    const updates = predictions.map(pred => {
      const points = H3.calcPoints(pred.pred_home_goals, pred.pred_away_goals, fixture.actual_home_goals, fixture.actual_away_goals);
      const distance = H3.calcDistance(pred.pred_home_goals, pred.pred_away_goals, fixture.actual_home_goals, fixture.actual_away_goals);
      const exact_hit = pred.pred_home_goals === fixture.actual_home_goals && pred.pred_away_goals === fixture.actual_away_goals;
      const close_hit = H3.isCloseHit(pred.pred_home_goals, pred.pred_away_goals, fixture.actual_home_goals, fixture.actual_away_goals);
      return {
        id: pred.id,
        points,
        distance,
        exact_hit,
        close_hit
      };
    });

    const { error: upsertError } = await sb3.from('predictions').upsert(updates, { onConflict: 'id' });
    if (upsertError) throw upsertError;

    if (showSuccess) H3.showAlert('adminAlertWrap', 'تمت إعادة احتساب النقاط.', 'success');
  } catch (error) {
    console.error(error);
    H3.showAlert('adminAlertWrap', 'تعذر إعادة احتساب النقاط.', 'danger');
  }
}

window.deleteFixture = async function (fixtureId) {
  if (!confirm('هل تريد حذف هذه المباراة؟')) return;
  try {
    const { error } = await sb3.from('fixtures').delete().eq('id', fixtureId);
    if (error) throw error;
    H3.showAlert('adminAlertWrap', 'تم حذف المباراة.', 'success');
    loadAdminFixtures();
  } catch (error) {
    console.error(error);
    H3.showAlert('adminAlertWrap', 'تعذر حذف المباراة.', 'danger');
  }
}