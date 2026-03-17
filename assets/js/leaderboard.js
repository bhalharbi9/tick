let leaderboardRows = [];

document.addEventListener("DOMContentLoaded", async () => {
  setQrImage("boardQr");
  $("refreshBoardBtn").addEventListener("click", loadLeaderboard);
  $("downloadCsvBtn").addEventListener("click", exportLeaderboardCsv);

  await loadLeaderboard();
  setInterval(loadLeaderboard, window.APP_CONFIG.AUTO_REFRESH_MS || 15000);
});

async function loadLeaderboard() {
  try {
    clearAlert("boardAlert");
    const { data, error } = await db
      .from("leaderboard")
      .select("*")
      .order("rank_order", { ascending: true });

    if (error) throw error;
    leaderboardRows = data || [];

    renderBoardStats();
    renderTop5();
    renderTable();
  } catch (error) {
    showAlert("boardAlert", "danger", "تعذر تحميل الترتيب المباشر.");
    console.error(error);
  }
}

function renderBoardStats() {
  $("participantsCount").textContent = leaderboardRows.length;
  $("leaderName").textContent = leaderboardRows[0]?.full_name || "—";
  $("leaderPoints").textContent = leaderboardRows[0]?.total_points ?? "—";
}

function renderTop5() {
  const container = $("top5Cards");
  if (!leaderboardRows.length) {
    container.innerHTML = `<div class="empty-state w-100"><div class="empty-title">لا يوجد مشاركون بعد</div></div>`;
    return;
  }

  container.innerHTML = leaderboardRows.slice(0, 5).map((row, index) => {
    const rank = index + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : "rank-other";
    return `
      <article class="top-card">
        <div class="top-rank ${rankClass}">${rank}</div>
        <div class="top-main">
          <div class="top-name">${escapeHtml(row.full_name)}</div>
          <div class="top-points">${row.total_points} نقطة • ${row.predictions_count} توقع</div>
        </div>
        <div class="reward-badge">${rewardText(rank)}</div>
      </article>
    `;
  }).join("");
}

function renderTable() {
  const tbody = $("leaderboardTableBody");
  tbody.innerHTML = leaderboardRows.map((row, index) => {
    const rank = index + 1;
    const badgeClass = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";
    return `
      <tr>
        <td><span class="rank-badge ${badgeClass}">${rank}</span></td>
        <td>${escapeHtml(row.full_name)}</td>
        <td>${row.total_points}</td>
        <td>${row.predictions_count}</td>
        <td>${row.exact_scores_count}</td>
        <td>${rewardText(rank)}</td>
      </tr>
    `;
  }).join("");
}

function exportLeaderboardCsv() {
  const rows = [
    ["المركز", "الاسم", "النقاط", "عدد التوقعات", "النتائج الدقيقة", "الجائزة"]
  ];

  leaderboardRows.forEach((row, index) => {
    rows.push([
      index + 1,
      row.full_name,
      row.total_points,
      row.predictions_count,
      row.exact_scores_count,
      rewardText(index + 1)
    ]);
  });

  csvDownload("ucl-leaderboard.csv", rows);
}
