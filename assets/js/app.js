async function loadMatches(){
const {data} = await supabase.from('fixtures').select('*');
const el = document.getElementById('matches');
el.innerHTML='';

data.forEach(m=>{
el.innerHTML += `
<div class="card match-card">
<div><strong>${m.team_home} vs ${m.team_away}</strong>
<div>الذهاب: ${m.first_leg_score}</div></div>

<div class="score-row">
<input class="score-input" id="h${m.id}">
<input class="score-input" id="a${m.id}">
</div>
</div>`;
});
}

async function savePredictions(){
const name = document.getElementById('username').value;

const {data:matches} = await supabase.from('fixtures').select('*');

for(const m of matches){
const h = document.getElementById('h'+m.id).value;
const a = document.getElementById('a'+m.id).value;

await supabase.from('predictions').insert({
full_name:name,
fixture_id:m.id,
pred_home:h,
pred_away:a
});
}

alert("تم الحفظ");
}

loadMatches();
