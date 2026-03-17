let fixturesCache = [];
let participantRecord = null;
let participantPredictionsMap = new Map();

document.addEventListener("DOMContentLoaded", async () => {
  setQrImage("homeQr");
  $("participantName").value = getStoredName();

  $("savePredictionsBtn").addEventListener("click", savePredictions);
  $("loadMyPredictionsBtn").addEventListener("click", loadMyPredictions);

  await loadFixtures();
  if ($("participantName").value.trim()) {
    await loadMyPredictions();
  }
});

async function loadFixtures() {
  try {
    clearAlert("appAlert");
    $("loadingState").classList.remove("d-none");
    $("matchesGrid").classList.add("d-none");
    $("emptyState").classList.add("d-none");

    const { data, error } = await db
      .from("fixtures")
      .select("*")
      .order("display_order", { ascending: true })
      .order("kickoff_at", { ascending: true });

    if (error) throw error;
    fixturesCache = data || [];
    renderStats(fixturesCache);
    renderMatches();
  } catch (error) {
    showAlert("appAlert", "danger", "تعذر تحميل المباريات. تأكد من config.js وتهيئة Supabase.");
    console.error(error);
  } finally {
    $("loadingState").classList.add("d-none");
  }
}

function renderStats(fixtures) {
  const openCount = fixtures.filter(f => !isFixtureLocked(f)).length;
  $("matchesCount").textContent = fixtures.length;
  $("openCount").textContent = openCount;
  $("lockedCount").textContent = fixtures.length - openCount;
}

function renderMatches() {
  const grid = $("matchesGrid");
  if (!fixturesCache.length) {
    $("emptyState").classList.remove("d-none");
    grid.classList.add("d-none");
    return;
  }

  grid.innerHTML = fixturesCache.map(fixture => {
    const locked = isFixtureLocked(fixture);
    const pred = participantPredictionsMap.get(fixture.id) || {};
    const actualReady = fixture.actual_home_goals !== null && fixture.actual_away_goals !== null;
    const points = actualReady && pred.pred_home_goals !== undefined
      ? calcPoints(
          Number(pred.pred_home_goals),
          Number(pred.pred_away_goals),
          Number(fixture.actual_home_goals),
          Number(fixture.actual_away_goals)
        )
      : null;

    return `
      <article class="match-card">
        <div class="match-head">
          <div>
            <div class="match-date">${escapeHtml(formatDateTime(fixture.kickoff_at))}</div>
            <div class="mini-note">الإغلاق قبل ${escapeHtml(fixture.lock_minutes_before)} دقائق من بداية المباراة</div>
          </div>
          <div class="status-pill ${locked ? "pill-locked" : "pill-open"}">
            ${locked ? "🔒 مغلق" : "🟢 مفتوح"}
          </div>
        </div>

        <div class="teams-row">
          <div class="team-box">
            <div class="team-name">${escapeHtml(fixture.home_team)}</div>
          </div>
          <div class="vs-chip">VS</div>
          <div class="team-box">
            <div class="team-name">${escapeHtml(fixture.away_team)}</div>
          </div>
        </div>

        <div class="meta-row">
          <div class="meta-box">
            <div class="meta-label">نتيجة الذهاب</div>
            <div class="meta-value">${escapeHtml(fixture.first_leg_home_goals)} - ${escapeHtml(fixture.first_leg_away_goals)}</div>
          </div>
          <div class="meta-box">
            <div class="meta-label">مجموع مباراتي الذهاب والإياب</div>
            <div class="meta-value">يُحتسب فقط بعد إدخال نتيجة الإياب</div>
          </div>
        </div>

        <div class="score-grid">
          <div class="score-input-wrap">
            <label>توقع ${escapeHtml(fixture.home_team)}</label>
            <input class="score-input" type="number" min="0" max="20"
              id="pred-home-${fixture.id}" value="${pred.pred_home_goals ?? ""}" ${locked ? "disabled" : ""}>
          </div>
          <div class="score-input-wrap">
            <label>توقع ${escapeHtml(fixture.away_team)}</label>
            <input class="score-input" type="number" min="0" max="20"
              id="pred-away-${fixture.id}" value="${pred.pred_away_goals ?? ""}" ${locked ? "disabled" : ""}>
          </div>
        </div>

        ${actualReady ? `
          <div class="result-preview">
            النتيجة الفعلية: ${fixture.actual_home_goals} - ${fixture.actual_away_goals}
            ${points !== null ? `| نقاطك على هذه المباراة: ${points}` : ""}
          </div>
        ` : ""}

        <div class="mini-note">نظام النقاط يعتمد على قرب النتيجة، والنتيجة الدقيقة تحصل على 10 نقاط.</div>
      </article>
    `;
  }).join("");

  grid.classList.remove("d-none");
}

async function getOrCreateParticipantByName(name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("يرجى كتابة الاسم أولاً.");

  const { data: existing, error: fetchError } = await db
    .from("participants")
    .select("*")
    .eq("full_name", trimmed)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return existing;

  const { data: created, error: insertError } = await db
    .from("participants")
    .insert([{ full_name: trimmed }])
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

async function loadMyPredictions() {
  try {
    clearAlert("appAlert");
    const name = $("participantName").value.trim();
    if (!name) {
      showAlert("appAlert", "warning", "اكتب اسمك أولاً ثم اضغط استرجاع توقّعاتي.");
      return;
    }

    setStoredName(name);
    const { data: participant, error: partError } = await db
      .from("participants")
      .select("*")
      .eq("full_name", name)
      .maybeSingle();

    if (partError) throw partError;
    participantRecord = participant;

    participantPredictionsMap = new Map();
    if (participant) {
      const { data: predictions, error: predError } = await db
        .from("predictions")
        .select("*")
        .eq("participant_id", participant.id);

      if (predError) throw predError;
      (predictions || []).forEach(item => participantPredictionsMap.set(item.fixture_id, item));
      showAlert("appAlert", "success", "تم استرجاع توقّعاتك بنجاح.");
    } else {
      showAlert("appAlert", "info", "هذا الاسم جديد. بعد الحفظ سيتم إنشاء مشاركتك.");
    }

    renderMatches();
  } catch (error) {
    showAlert("appAlert", "danger", "تعذر استرجاع التوقعات.");
    console.error(error);
  }
}

async function savePredictions() {
  try {
    clearAlert("appAlert");
    const name = $("participantName").value.trim();
    if (!name) {
      showAlert("appAlert", "warning", "يرجى كتابة الاسم أولاً.");
      return;
    }

    setStoredName(name);
    const participant = await getOrCreateParticipantByName(name);
    participantRecord = participant;

    const payload = [];
    for (const fixture of fixturesCache) {
      if (isFixtureLocked(fixture)) continue;

      const homeValue = $(`pred-home-${fixture.id}`).value;
      const awayValue = $(`pred-away-${fixture.id}`).value;

      if (homeValue === "" || awayValue === "") continue;

      payload.push({
        participant_id: participant.id,
        fixture_id: fixture.id,
        pred_home_goals: Number(homeValue),
        pred_away_goals: Number(awayValue)
      });
    }

    if (!payload.length) {
      showAlert("appAlert", "warning", "لا توجد توقعات قابلة للحفظ حالياً.");
      return;
    }

    const { error } = await db
      .from("predictions")
      .upsert(payload, { onConflict: "participant_id,fixture_id" });

    if (error) throw error;

    showAlert("appAlert", "success", "تم حفظ التوقعات بنجاح.");
    await loadMyPredictions();
  } catch (error) {
    showAlert("appAlert", "danger", error.message || "تعذر حفظ التوقعات.");
    console.error(error);
  }
}
