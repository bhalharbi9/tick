window.APP = { rewards:{1:"30 ريال",2:"20 ريال",3:"10 ريال"} };
const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
function alertBox(type,msg){ return `<div class="alert alert-${type}">${esc(msg)}</div>`; }
function dt(v){ if(!v) return "—"; const d=new Date(v); return isNaN(d)?v:new Intl.DateTimeFormat("ar-SA",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(d); }
function locked(f){ const k=new Date(f.kickoff_at).getTime(); return Date.now() >= (k - Number(f.lock_minutes_before||10)*60000); }
function outcome(h,a){ return h>a?"H":h<a?"A":"D"; }
function points(ph,pa,rh,ra,pe,re,pp,rp,pw,rw){ if([ph,pa,rh,ra].some(v=>v===null||v===undefined||v==="")) return 0; ph=+ph;pa=+pa;rh=+rh;ra=+ra; let p=0;
 if(ph===rh && pa===ra) p=10; else { const po=outcome(ph,pa), ro=outcome(rh,ra), pd=ph-pa, rd=rh-ra; if(po===ro&&pd===rd)p=7; else if(po===ro)p=5; if(ph===rh||pa===ra)p+=3; const dist=Math.abs(ph-rh)+Math.abs(pa-ra); if(dist===1)p+=2; else if(dist===2)p+=1; }
 if(Boolean(pe)===Boolean(re)) p+=2; if(Boolean(pp)===Boolean(rp)) p+=2; if(Boolean(rp)&&pw&&rw&&pw===rw) p+=3; return p; }
function reward(rank){ return window.APP.rewards[rank] || "—"; }
function csv(filename, rows){ const s=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n"); const b=new Blob(["\uFEFF"+s],{type:"text/csv;charset=utf-8;"}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); }
function setQR(id){ const el=$(id); if(!el) return; const url=location.origin + location.pathname.replace(/[^/]+$/,"index.html"); el.src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="+encodeURIComponent(url); }
function setName(v){ localStorage.setItem("ucl_participant_name", v); }
function getName(){ return localStorage.getItem("ucl_participant_name") || ""; }
