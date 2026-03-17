const sb2 = window.supabaseClient;
const H2 = window.appHelpers;
const body = document.getElementById('leaderboardBody');
const top5Cards = document.getElementById('top5Cards');
const rewardsList = document.getElementById('rewardsList');
const lastRefresh = document.getElementById('lastRefresh');

document.getElementById('printBtn')?.addEventListener('click', () => window.print());
document.getElementById('exportCsvBtn')?.addEventListener('click', exportCsv);

document.addEventListener('DOMContentLoaded', async () => {
  H2.generateQr('leaderQr', new URL('index.html', window.location.href).href);
  await Promise.all([loadLeaderboard(), loadRewards()]);
  setInterval(loadLeaderboard, 15000);
});

async function loadLeaderboard() {
  try {
    const { data, error } = await sb2
      .from('leaderboard_view')
      .select('*')
      .order('total_points', { ascending: false })
      .order('exact_scores_count', { ascending: false })
      .order('close_hits_count', { ascending: false })
      .order('total_distance', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) throw error;
    renderLeaderboard(data || []);
    renderTop5(data || []);
    lastRefresh.textContent = H2.formatDateTime(new Date().toISOString());
  } catch (error) {
    console.error(error);
    body.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">تعذر تحميل الترتيب.</td></tr>`;
  }
}

async function loadRewards() {
  try {
    const { data, error } = await sb2
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('rank_no', { ascending: true });

    if (error) throw error;
    rewardsList.innerHTML = (data || []).map(r => `
      <div class="d-flex justify-content-between align-items-center border rounded-4 p-2">
        <div>
          <div class="fw-semibold">${H2.escapeHtml(r.reward_text)}</div>
          <div class="small text-secondary">المركز ${r.rank_no}</div>
        </div>
        <span class="badge text-bg-warning fs-6">${Number(r.amount).toFixed(0)} ريال</span>
      </div>
    `).join('') || '<div class="text-secondary small">لا توجد جوائز</div>';
  } catch (error) {
    console.error(error);
  }
}

function renderLeaderboard(rows) {
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4">لا يوجد مشاركون حتى الآن.</td></tr>`;
    return;
  }

  body.innerHTML = rows.map((row, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="${i === 0 ? 'fw-bold text-primary' : ''}">${H2.escapeHtml(row.full_name)}</td>
      <td><span class="badge text-bg-primary">${row.total_points}</span></td>
      <td>${row.exact_scores_count}</td>
      <td>${row.close_hits_count}</td>
      <td>${row.total_distance}</td>
    </tr>
  `).join('');
}

function renderTop5(rows) {
  const top = rows.slice(0, 5);
  if (!top.length) {
    top5Cards.innerHTML = `<div class="col-12"><div class="alert alert-light border">لا توجد بيانات لعرضها.</div></div>`;
    return;
  }

  top5Cards.innerHTML = top.map((row, i) => `
    <div class="col-md-6 col-xl-4">
      <div class="card top-card rank-${i + 1}">
        <div class="card-body">
          <div class="small text-secondary mb-1">المركز ${i + 1}</div>
          <div class="h5 mb-2">${H2.escapeHtml(row.full_name)}</div>
          <div class="d-flex flex-wrap gap-2">
            <span class="badge text-bg-primary">${row.total_points} نقطة</span>
            <span class="badge text-bg-success">${row.exact_scores_count} دقيقة</span>
            <span class="badge text-bg-secondary">${row.close_hits_count} قريبة</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

async function exportCsv() {
  try {
    const { data, error } = await sb2
      .from('leaderboard_view')
      .select('*')
      .order('total_points', { ascending: false })
      .order('exact_scores_count', { ascending: false })
      .order('close_hits_count', { ascending: false })
      .order('total_distance', { ascending: true })
      .order('full_name', { ascending: true });

    if (error) throw error;

    const rows = [
      ['الترتيب', 'المشارك', 'النقاط', 'النتائج الدقيقة', 'التوقعات القريبة', 'مسافة الخطأ'],
      ...(data || []).map((row, i) => [i + 1, row.full_name, row.total_points, row.exact_scores_count, row.close_hits_count, row.total_distance])
    ];
    H2.downloadCsv('leaderboard.csv', rows);
  } catch (error) {
    console.error(error);
  }
}