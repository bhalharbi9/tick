async function loadLeaderboard(){
const {data} = await supabase.from('leaderboard').select('*');

let html="";
data.forEach((p,i)=>{
html+=`<div class="card">${i+1} - ${p.full_name} (${p.total_points})</div>`;
});

document.getElementById("table").innerHTML=html;
renderTop5(data);
}

function renderTop5(data){
let html="";
data.slice(0,5).forEach(p=>{
html+=`<div class="card">${p.full_name}<br>${p.total_points}</div>`;
});
document.getElementById("top5").innerHTML=html;
}

loadLeaderboard();
setInterval(loadLeaderboard,10000);
