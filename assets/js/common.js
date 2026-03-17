window.APP = {
  rewards: {
    1: "30 ريال",
    2: "20 ريال",
    3: "10 ريال"
  }
};

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showAlert(containerId, type, message) {
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-${type} shadow-sm">${escapeHtml(message)}</div>
  `;
}

function clearAlert(containerId) {
  const container = $(containerId);
  if (container) container.innerHTML = "";
}

function formatDateTime(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function isFixtureLocked(fixture) {
  const kickoff = new Date(fixture.kickoff_at).getTime();
  const minutes = Number(fixture.lock_minutes_before || 10);
  const lockTime = kickoff - minutes * 60 * 1000;
  return Date.now() >= lockTime;
}

function getMatchOutcome(home, away) {
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}

function calcPoints(predHome, predAway, realHome, realAway) {
  if (
    predHome === null || predAway === null ||
    realHome === null || realAway === null
  ) return 0;

  if (predHome === realHome && predAway === realAway) {
    return 10;
  }

  let points = 0;
  const predOutcome = getMatchOutcome(predHome, predAway);
  const realOutcome = getMatchOutcome(realHome, realAway);
  const predDiff = predHome - predAway;
  const realDiff = realHome - realAway;

  if (predOutcome === realOutcome && predDiff === realDiff) {
    points = 7;
  } else if (predOutcome === realOutcome) {
    points = 5;
  }

  if (predHome === realHome || predAway === realAway) {
    points += 3;
  }

  const distance = Math.abs(predHome - realHome) + Math.abs(predAway - realAway);
  if (distance === 1) points += 2;
  else if (distance === 2) points += 1;

  return Math.min(points, 9);
}

function rewardText(rank) {
  return window.APP.rewards[rank] || "—";
}

function csvDownload(filename, rows) {
  const csvContent = rows.map(row =>
    row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")
  ).join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setQrImage(imgId) {
  const el = $(imgId);
  if (!el) return;
  const pageUrl = window.location.origin + window.location.pathname.replace(/[^/]+$/, "index.html");
  el.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(pageUrl);
}

function setStoredName(name) {
  localStorage.setItem("ucl_participant_name", name);
}
function getStoredName() {
  return localStorage.getItem("ucl_participant_name") || "";
}
