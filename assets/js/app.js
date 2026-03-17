const sb = window.supabaseClient;
const H = window.appHelpers;
const participantInput = document.getElementById('participantName');
const loadBtn = document.getElementById('loadParticipantBtn');
const saveBtn = document.getElementById('savePredictionsBtn');
const predictionSection = document.getElementById('predictionSection');
const fixturesList = document.getElementById('fixturesList');

let currentParticipant = null;
let fixtures = [];
let predictionMap = new Map();

document.addEventListener('DOMContentLoaded', () => {
  const savedName = localStorage.getItem('ucl_participant_name');
  if (savedName) participantInput.value = savedName;
  H.generateQr('entryQr', window.location.href);
});

loadBtn?.addEventListener('click', loadParticipantAndFixtures);
saveBtn?.addEventListener('click', savePredictions);

async function loadParticipantAndFixtures() {
  H.clearAlert('alertWrap');

  const fullName = participantInput.value.trim();
  if (!fullName) {
    H.showAlert('alertWrap', 'يرجى إدخال اسم المشارك.', 'danger');
    return;
  }

  try {
    loadBtn.disabled = true;
    loadBtn.textContent = 'جاري التحميل...';

    currentParticipant = await getOrCreateParticipant(fullName);
    localStorage.setItem('ucl_participant_name', fullName);

    const [{ data: fixturesData, error: fixturesError }, { data: predictionsData, error: predictionsError }] = await Promise.all([
      sb.from('fixtures')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('kickoff', { ascending: true }),
      sb.from('predictions')
        .select('*')
        .eq('participant_id', currentParticipant.id)
    ]);

    if (fixturesError) throw fixturesError;
    if (predictionsError) throw predictionsError;

    fixtures = fixturesData || [];
    predictionMap = new Map((predictionsData || []).map(p => [p.fixture_id, p]));

    renderFixtures();
    predictionSection.classList.remove('d-none');
  } catch (error) {
    console.error(error);
    H.showAlert('alertWrap', 'تعذر تحميل البيانات. تأكد من إعدادات Supabase ثم حاول مرة أخرى.', 'danger');
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = 'بدء التوقع / استعادة التوقعات';
  }
}

async function getOrCreateParticipant(fullName) {
  const { data: existing, error: selectError } = await sb
    .from('participants')
    .select('*')
    .eq('full_name', fullName)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data, error } = await sb
    .from('participants')
    .insert({ full_name: fullName })
    .select()
    .single();

  if (error) throw error;
  return data;
}

function renderFixtures() {
  if (!fixtures.length) {
    fixturesList.innerHTML = `<div class="col-12"><div class="alert alert-warning mb-0">لا توجد مباريات مضافة حالياً.</div></div>`;
    return;
  }

  fixturesList.innerHTML = fixtures.map(fixture => {
    const pred = predictionMap.get(fixture.id);
    const locked = H.isLocked(fixture);
    const firstLeg = fixture.first_leg_home_goals != null && fixture.first_leg_away_goals != null
      ? `${fixture.first_leg_home_goals} - ${fixture.first_leg_away_goals}`
      : 'غير مضافة';

    return `
      <div class="col-12">
        <div class="card fixture-card">
          <div class="card-body">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <div class="team-title">${H.escapeHtml(fixture.team_home)} <span class="text-secondary">vs</span> ${H.escapeHtml(fixture.team_away)}</div>
                <div class="text-secondary small">موعد المباراة: ${H.formatDateTime(fixture.kickoff)}</div>
              </div>
              <div class="d-flex flex-wrap gap-2 align-items-center">
                <span class="first-leg-badge">نتيجة الذهاب: ${H.escapeHtml(firstLeg)}</span>
                <span class="fixture-status ${locked ? 'status-locked' : 'status-open'}">${locked ? 'مغلق' : 'مفتوح'}</span>
              </div>
            </div>

            <div class="row g-3 align-items-start">
              <div class="col-lg-4">
                <label class="form-label">توقع ${H.escapeHtml(fixture.team_home)}</label>
                <input type="number" class="form-control score-input prediction-input" min="0" max="20"
                  data-fixture-id="${fixture.id}" data-team="home" value="${pred?.pred_home_goals ?? ''}" ${locked ? 'disabled' : ''}>
              </div>
              <div class="col-lg-4">
                <label class="form-label">توقع ${H.escapeHtml(fixture.team_away)}</label>
                <input type="number" class="form-control score-input prediction-input" min="0" max="20"
                  data-fixture-id="${fixture.id}" data-team="away" value="${pred?.pred_away_goals ?? ''}" ${locked ? 'disabled' : ''}>
              </div>
              <div class="col-lg-4">
                <div class="small text-secondary mb-1">نقاطك الحالية</div>
                <div class="fw-bold">${pred ? pred.points : 0}</div>
              </div>
            </div>

            <div class="row g-3 mt-1">
              <div class="col-lg-6">
                <div class="lineup-box">
                  <div class="fw-semibold mb-2">التشكيلة المتوقعة — ${H.escapeHtml(fixture.team_home)}</div>
                  ${H.renderLineup(fixture.probable_home_lineup || '')}
                </div>
              </div>
              <div class="col-lg-6">
                <div class="lineup-box">
                  <div class="fw-semibold mb-2">التشكيلة المتوقعة — ${H.escapeHtml(fixture.team_away)}</div>
                  ${H.renderLineup(fixture.probable_away_lineup || '')}
                </div>
              </div>
              <div class="col-lg-6">
                <div class="last5-box">
                  <div class="fw-semibold mb-2">آخر 5 مباريات — ${H.escapeHtml(fixture.team_home)}</div>
                  <div class="d-flex flex-wrap gap-2">${H.renderLast5(fixture.home_last5 || [])}</div>
                </div>
              </div>
              <div class="col-lg-6">
                <div class="last5-box">
                  <div class="fw-semibold mb-2">آخر 5 مباريات — ${H.escapeHtml(fixture.team_away)}</div>
                  <div class="d-flex flex-wrap gap-2">${H.renderLast5(fixture.away_last5 || [])}</div>
                </div>
              </div>
            </div>

            ${fixture.match_url ? `
              <div class="mt-3">
                <a href="${H.escapeHtml(fixture.match_url)}" class="btn btn-sm btn-outline-secondary" target="_blank" rel="noopener">فتح رابط المباراة</a>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function savePredictions() {
  H.clearAlert('alertWrap');

  if (!currentParticipant) {
    H.showAlert('alertWrap', 'ابدأ أولاً بتحميل بيانات المشارك.', 'danger');
    return;
  }

  const rows = [];
  for (const fixture of fixtures) {
    if (H.isLocked(fixture)) continue;
    const homeInput = document.querySelector(`input[data-fixture-id="${fixture.id}"][data-team="home"]`);
    const awayInput = document.querySelector(`input[data-fixture-id="${fixture.id}"][data-team="away"]`);
    if (!homeInput || !awayInput) continue;
    if (homeInput.value === '' || awayInput.value === '') continue;

    rows.push({
      participant_id: currentParticipant.id,
      fixture_id: fixture.id,
      pred_home_goals: Number(homeInput.value),
      pred_away_goals: Number(awayInput.value)
    });
  }

  if (!rows.length) {
    H.showAlert('alertWrap', 'لا توجد توقعات مفتوحة للحفظ أو لم تُدخل أي أرقام.', 'warning');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'جاري الحفظ...';

    const { error } = await sb
      .from('predictions')
      .upsert(rows, { onConflict: 'participant_id,fixture_id' });

    if (error) throw error;

    H.showAlert('alertWrap', 'تم حفظ التوقعات بنجاح.', 'success');
    await loadParticipantAndFixtures();
  } catch (error) {
    console.error(error);
    H.showAlert('alertWrap', 'تعذر حفظ التوقعات.', 'danger');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'حفظ التوقعات';
  }
}