window.appHelpers = (function () {
  function escapeHtml(str = '') {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function showAlert(targetId, message, type = 'success') {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = `<div class="alert alert-${type}" role="alert">${escapeHtml(message)}</div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearAlert(targetId) {
    const target = document.getElementById(targetId);
    if (target) target.innerHTML = '';
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    return new Intl.DateTimeFormat('ar-SA', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function getOutcome(home, away) {
    if (home > away) return 'H';
    if (home < away) return 'A';
    return 'D';
  }

  function calcPoints(predHome, predAway, realHome, realAway) {
    if (predHome === realHome && predAway === realAway) return 10;

    let points = 0;
    const predOutcome = getOutcome(predHome, predAway);
    const realOutcome = getOutcome(realHome, realAway);
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

  function calcDistance(predHome, predAway, realHome, realAway) {
    return Math.abs(predHome - realHome) + Math.abs(predAway - realAway);
  }

  function isCloseHit(predHome, predAway, realHome, realAway) {
    return calcDistance(predHome, predAway, realHome, realAway) <= 1;
  }

  function isLocked(fixture) {
    const kickoff = new Date(fixture.kickoff).getTime();
    const lockMinutes = Number(fixture.lock_minutes_before || 10);
    const lockTs = kickoff - (lockMinutes * 60 * 1000);
    return Date.now() >= lockTs;
  }

  function parseLast5(text) {
    if (!text || !text.trim()) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return text.split(',').map(v => v.trim()).filter(Boolean);
    }
  }

  function renderLast5(list = []) {
    if (!Array.isArray(list) || list.length === 0) {
      return '<div class="text-secondary small">لا توجد بيانات</div>';
    }
    return list.map(item => `<span class="last5-badge">${escapeHtml(item)}</span>`).join(' ');
  }

  function renderLineup(text = '') {
    if (!text.trim()) return '<div class="text-secondary small">لا توجد تشكيلة حالياً</div>';
    const lines = text.split('\n').map(v => v.trim()).filter(Boolean);
    return `<ul class="mb-0 ps-3">${lines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`;
  }

  function generateQr(targetId, text) {
    const box = document.getElementById(targetId);
    if (!box || !window.QRCode) return;
    box.innerHTML = '';
    window.QRCode.toCanvas(text, { width: 140, margin: 1 }, function (error, canvas) {
      if (!error) box.appendChild(canvas);
    });
  }

  function downloadCsv(filename, rows) {
    const csv = rows.map(row => row.map(cell => {
      const safe = String(cell ?? '').replaceAll('"', '""');
      return `"${safe}"`;
    }).join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    escapeHtml, showAlert, clearAlert, formatDateTime,
    calcPoints, calcDistance, isCloseHit, isLocked,
    parseLast5, renderLast5, renderLineup, generateQr, downloadCsv
  };
})();