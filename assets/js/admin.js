let adminUnlocked = false;
let adminFixtures = [];

document.addEventListener("DOMContentLoaded", () => {
  $("unlockAdminBtn").addEventListener("click", unlockAdmin);
  $("seedNoticeBtn").addEventListener("click", () => {
    showAlert("adminAlert", "info", "نفّذ schema.sql أولاً ثم seed.sql داخل Supabase، وبعدها عدّل config.js.");
  });
  $("saveResultsBtn").addEventListener("click", saveResults);
  $("refreshAdminBtn").addEventListener("click", refreshAdminData);
});

async function unlockAdmin() {
  clearAlert("adminAlert");
  const pass = $("adminPass").value;
  if (pass !== window.APP_CONFIG.ADMIN_PASS) {
    showAlert("adminAlert", "danger", "كلمة المرور غير صحيحة.");
    return;
  }

  adminUnlocked = true;
  $("adminContent").classList.remove("d-none");
  showAlert("adminAlert", "success", "تم فتح لوحة المشرف.");
  await refreshAdminData();
}

async function refreshAdminData() {
  if (!adminUnlocked) return;

  try {
    const [{ data: fixtures, error: fixturesError }, { data: participants, error: participantsError }, { data: predictions, error: predictionsError }] = await Promise.all([
      db.from("fixtures").select("*").order("display_order", { ascending: true }).order("kickoff_at", { ascending: true }),
      db.from("participants").select("*").order("created_at", { ascending: false }),
      db.from("predictions").select("*")
    ]);

    if (fixturesError) throw fixturesError;
    if (participantsError) throw participantsError;
    if (predictionsError) throw predictionsError;

    adminFixtures = fixtures || [];
    renderAdminStats(participants || []);
    renderAdminMatches();
    renderAdminParticipants(participants || [], predictions || []);
  } catch (error) {
    showAlert("adminAlert", "danger", "تعذر تحميل بيانات الإدارة.");
    console.error(error);
  }
}

function renderAdminStats(participants) {
  const resultsCount = adminFixtures.filter(f => f.actual_home_goals !== null && f.actual_away_goals !== null).length;
  $("adminMatchesCount").textContent = adminFixtures.length;
  $("adminResultsCount").textContent = resultsCount;
  $("adminParticipantsCount").textContent = participants.length;
  $("adminLastUpdate").textContent = formatDateTime(new Date().toISOString());
}

function renderAdminMatches() {
  const list = $("adminMatchesList");
  if (!adminFixtures.length) {
    list.innerHTML = `<div class="notice-box">لا توجد مباريات. نفّذ ملف seed.sql أولاً.</div>`;
    return;
  }

  list.innerHTML = adminFixtures.map(fixture => `
    <article class="admin-item">
      <div class="match-head">
        <div>
          <div class="team-name">${escapeHtml(fixture.home_team)} × ${escapeHtml(fixture.away_team)}</div>
          <div class="mini-note">${escapeHtml(formatDateTime(fixture.kickoff_at))}</div>
        </div>
        <div class="status-pill ${isFixtureLocked(fixture) ? "pill-locked" : "pill-open"}">
          ${isFixtureLocked(fixture) ? "🔒 مغلق" : "🟢 مفتوح"}
        </div>
      </div>

      <div class="admin-grid">
        <div class="meta-box">
          <div class="meta-label">نتيجة الذهاب</div>
          <div class="score-box">
            <input id="first-home-${fixture.id}" class="score-input" type="number" min="0" max="20" value="${fixture.first_leg_home_goals ?? 0}">
            <input id="first-away-${fixture.id}" class="score-input" type="number" min="0" max="20" value="${fixture.first_leg_away_goals ?? 0}">
          </div>
        </div>

        <div class="meta-box">
          <div class="meta-label">نتيجة الإياب الفعلية</div>
          <div class="score-box">
            <input id="actual-home-${fixture.id}" class="score-input" type="number" min="0" max="20" value="${fixture.actual_home_goals ?? ""}">
            <input id="actual-away-${fixture.id}" class="score-input" type="number" min="0" max="20" value="${fixture.actual_away_goals ?? ""}">
          </div>
        </div>

        <div class="meta-box">
          <div class="meta-label">وقت المباراة</div>
          <input id="kickoff-${fixture.id}" class="form-control app-input" type="datetime-local" value="${toDateTimeLocalValue(fixture.kickoff_at)}">
        </div>

        <div class="meta-box">
          <div class="meta-label">الإغلاق قبل المباراة (دقائق)</div>
          <input id="lock-${fixture.id}" class="score-input" type="number" min="0" max="180" value="${fixture.lock_minutes_before ?? 10}">
        </div>
      </div>
    </article>
  `).join("");
}

function renderAdminParticipants(participants, predictions) {
  const tbody = $("adminParticipantsBody");
  tbody.innerHTML = participants.map(participant => {
    const count = predictions.filter(p => p.participant_id === participant.id).length;
    return `
      <tr>
        <td>${escapeHtml(participant.full_name)}</td>
        <td>${escapeHtml(formatDateTime(participant.created_at))}</td>
        <td>${count}</td>
      </tr>
    `;
  }).join("");
}

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function saveResults() {
  if (!adminUnlocked) return;

  try {
    const updates = adminFixtures.map(fixture => ({
      id: fixture.id,
      first_leg_home_goals: Number($(`first-home-${fixture.id}`).value || 0),
      first_leg_away_goals: Number($(`first-away-${fixture.id}`).value || 0),
      actual_home_goals: $(`actual-home-${fixture.id}`).value === "" ? null : Number($(`actual-home-${fixture.id}`).value),
      actual_away_goals: $(`actual-away-${fixture.id}`).value === "" ? null : Number($(`actual-away-${fixture.id}`).value),
      kickoff_at: new Date($(`kickoff-${fixture.id}`).value).toISOString(),
      lock_minutes_before: Number($(`lock-${fixture.id}`).value || 10)
    }));

    const { error } = await db
      .from("fixtures")
      .upsert(updates, { onConflict: "id" });

    if (error) throw error;

    showAlert("adminAlert", "success", "تم حفظ نتائج المباريات وبياناتها بنجاح.");
    await refreshAdminData();
  } catch (error) {
    showAlert("adminAlert", "danger", "تعذر حفظ النتائج. تأكد من صلاحيات جدول fixtures.");
    console.error(error);
  }
}
