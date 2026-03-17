window.APP = {
  rewards: {1:"30 ريال",2:"20 ريال",3:"10 ريال"},
  teamAssets: {
    "ريال مدريد": {logo:"https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg", colors:["#d9b370","#1a2c5b"]},
    "مانشستر سيتي": {logo:"https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg", colors:["#6cabdd","#1c2c5b"]},
    "برشلونة": {logo:"https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg", colors:["#a50044","#004d98"]},
    "ليفربول": {logo:"https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg", colors:["#c8102e","#00b2a9"]},
    "تشيلسي": {logo:"https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg", colors:["#034694","#dba111"]},
    "أرسنال": {logo:"https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg", colors:["#db0007","#9c824a"]},
    "بايرن ميونخ": {logo:"https://upload.wikimedia.org/wikipedia/en/1/1f/FC_Bayern_Munich_logo_%282017%29.svg", colors:["#dc052d","#0066b2"]},
    "أتلتيكو مدريد": {logo:"https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg", colors:["#d71920","#21468b"]}
  }
};

function getAsset(teamName){
  return window.APP.teamAssets[teamName] || {
    logo: "",
    colors: ["#1f6feb","#114fb8"]
  };
}

function coverStyle(home, away){
  const a = getAsset(home).colors;
  const b = getAsset(away).colors;

  return `background: linear-gradient(135deg,
    ${a[0]} 0%,
    ${a[1]} 45%,
    ${b[0]} 55%,
    ${b[1]} 100%
  );`;
}
