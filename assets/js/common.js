window.APP = {
  rewards: {
    1: "30 ريال",
    2: "20 ريال",
    3: "10 ريال"
  },
  teamAssets: {
    "سبورتنج لشبونة": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/Portugal%20-%20Liga%20Portugal/Sporting%20CP.png",
      colors: ["#006e53", "#0fa36b"]
    },
    "بودو جليمت": {
      logo: "https://assets.football-logos.cc/logos/norway/700x700/bodo-glimt.e3727ba0.png",
      colors: ["#111111", "#f7de00"]
    },
    "مانشستر سيتي": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/England%20-%20Premier%20League/Manchester%20City.png",
      colors: ["#6cabdd", "#1c2c5b"]
    },
    "ريال مدريد": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/Spain%20-%20LaLiga/Real%20Madrid.png",
      colors: ["#d9b370", "#1a2c5b"]
    },
    "تشيلسي": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/England%20-%20Premier%20League/Chelsea%20FC.png",
      colors: ["#034694", "#dba111"]
    },
    "باريس سان جيرمان": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/France%20-%20Ligue%201/Paris%20Saint-Germain.png",
      colors: ["#004170", "#da291c"]
    },
    "أرسنال": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/England%20-%20Premier%20League/Arsenal%20FC.png",
      colors: ["#db0007", "#9c824a"]
    },
    "باير ليفركوزن": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/Germany%20-%20Bundesliga/Bayer%2004%20Leverkusen.png",
      colors: ["#d4001c", "#111111"]
    },
    "برشلونة": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/Spain%20-%20LaLiga/FC%20Barcelona.png",
      colors: ["#a50044", "#004d98"]
    },
    "نيوكاسل يونايتد": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/England%20-%20Premier%20League/Newcastle%20United.png",
      colors: ["#241f20", "#ffffff"]
    },
    "ليفربول": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/England%20-%20Premier%20League/Liverpool%20FC.png",
      colors: ["#c8102e", "#00b2a9"]
    },
    "غلطة سراي": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/T%C3%BCrkiye%20-%20S%C3%BCper%20Lig/Galatasaray.png",
      colors: ["#a6192e", "#ffb81c"]
    },
    "توتنهام هوتسبر": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/England%20-%20Premier%20League/Tottenham%20Hotspur.png",
      colors: ["#132257", "#ffffff"]
    },
    "أتلتيكو مدريد": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/Spain%20-%20LaLiga/Atl%C3%A9tico%20de%20Madrid.png",
      colors: ["#d71920", "#21468b"]
    },
    "بايرن ميونخ": {
      logo: "https://raw.githubusercontent.com/luukhopman/football-logos/master/logos/Germany%20-%20Bundesliga/Bayern%20Munich.png",
      colors: ["#dc052d", "#0066b2"]
    },
    "أتالانتا": {
      logo: "https://assets.football-logos.cc/logos/italy/700x700/atalanta.e73bf71e.png",
      colors: ["#1b75bc", "#111111"]
    }
  }
};

const $ = id => document.getElementById(id);

function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function alertBox(type, msg) {
  return `<div class="alert alert-${type}">${esc(msg)}</div>`;
}

function dt(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d)
    ? v
    : new Intl.DateTimeFormat("ar-SA", {
        timeZone: "Asia/Riyadh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).format(d);
}

function locked(f) {
  const k = new Date(f.kickoff_at).getTime();
  return Date.now() >= (k - Number(f.lock_minutes_before || 10) * 60000);
}

function outcome(h, a) {
  return h > a ? "H" : h < a ? "A" : "D";
}

function points(ph, pa, rh, ra, pe, re, pp, rp, pw, rw) {
  if ([ph, pa, rh, ra].some(v => v === null || v === undefined || v === "")) return 0;

  ph = +ph;
  pa = +pa;
  rh = +rh;
  ra = +ra;

  let p = 0;

  if (ph === rh && pa === ra) {
    p = 10;
  } else {
    const po = outcome(ph, pa);
    const ro = outcome(rh, ra);
    const pd = ph - pa;
    const rd = rh - ra;

    if (po === ro && pd === rd) p = 7;
    else if (po === ro) p = 5;

    if (ph === rh || pa === ra) p += 3;

    const dist = Math.abs(ph - rh) + Math.abs(pa - ra);
    if (dist === 1) p += 2;
    else if (dist === 2) p += 1;
  }

  if (Boolean(pe) === Boolean(re)) p += 2;
  if (Boolean(pp) === Boolean(rp)) p += 2;
  if (Boolean(rp) && pw && rw && pw === rw) p += 3;

  return p;
}

function csv(filename, rows) {
  const s = rows
    .map(r => r.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\\n");

  const b = new Blob(["\\uFEFF" + s], { type: "text/csv;charset=utf-8;" });
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(u);
}

function setQR(id) {
  const el = $(id);
  if (!el) return;
  const url = location.origin + location.pathname.replace(/[^/]+$/, "index.html");
  el.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(url);
}

function setName(v) {
  localStorage.setItem("ucl_participant_name", v);
}

function getName() {
  return localStorage.getItem("ucl_participant_name") || "";
}

function getAsset(teamName) {
  return window.APP.teamAssets[teamName] || {
    logo: "",
    colors: ["#1f6feb", "#114fb8"]
  };
}

function coverStyle(home, away) {
  const a = getAsset(home).colors;
  const b = getAsset(away).colors;
  return `background: linear-gradient(135deg, ${a[0]} 0%, ${a[1]} 45%, ${b[0]} 55%, ${b[1]} 100%);`;
}
