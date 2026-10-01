const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const timeEl = document.querySelector('#time');
const bestEl = document.querySelector('#best');
const lapEl = document.querySelector('#lap');
const countdownEl = document.querySelector('#countdown');
const resultEl = document.querySelector('#result');
const finalEl = document.querySelector('#finalTime');
let W, H, dpr, keys = {}, player, start, last, elapsed, lap, running, boost, particles;
const totalLaps = 3;
const best = localStorage.getItem('trackmaria-best');
bestEl.textContent = best || '--:--.---';
window.addEventListener('resize', resize);
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.code === 'Space') e.preventDefault(); if(e.key.toLowerCase()==='r') reset(); });
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
document.querySelector('#restart').onclick = reset;
function resize(){ dpr=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight; canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
function fmt(ms){ const m=Math.floor(ms/60000), s=Math.floor(ms/1000)%60, x=Math.floor(ms%1000); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(x).padStart(3,'0')}`; }
function reset(){ player={x:0, speed:0, distance:0}; elapsed=0; lap=1; running=false; boost=0; particles=[]; resultEl.hidden=true; countdownEl.hidden=false; countdownEl.textContent='3'; let n=3; const t=setInterval(()=>{ n--; countdownEl.textContent=n>0?n:'GO!'; if(n<0){clearInterval(t); countdownEl.hidden=true; running=true; start=performance.now(); last=start;} },600); }
function roadY(){ return H*.60; }
function drawRoad(t){
  const horizon=H*.34, base=roadY(), roadW=Math.min(W*.72,900); ctx.fillStyle='#11152d'; ctx.fillRect(0,0,W,H);
  // sky glow
  const sky=ctx.createLinearGradient(0,0,0,horizon); sky.addColorStop(0,'#141a48'); sky.addColorStop(1,'#ef4a9a'); ctx.fillStyle=sky; ctx.fillRect(0,0,W,horizon+5);
  ctx.fillStyle='#ffe66d'; ctx.beginPath(); ctx.arc(W*.72,horizon*.65,38,0,Math.PI*2); ctx.fill();
  // distant mountains
  ctx.fillStyle='#171331'; ctx.beginPath(); ctx.moveTo(0,horizon); for(let x=0;x<=W;x+=100) ctx.lineTo(x,horizon-35-Math.sin(x*.018)*35); ctx.lineTo(W,horizon); ctx.fill();
  ctx.fillStyle='#24203d'; ctx.beginPath(); ctx.moveTo(0,horizon); ctx.lineTo(W*.2,horizon-85);ctx.lineTo(W*.35,horizon);ctx.lineTo(W*.58,horizon-105);ctx.lineTo(W*.85,horizon-30);ctx.lineTo(W,horizon);ctx.fill();
  ctx.fillStyle='#1b1b31'; ctx.beginPath();ctx.moveTo(W/2-roadW*.1,horizon);ctx.lineTo(W/2+roadW*.1,horizon);ctx.lineTo(W/2+roadW/2,base);ctx.lineTo(W/2-roadW/2,base);ctx.fill();
  // road segments scrolling toward player
  for(let i=0;i<28;i++){ let z=(i/28 + (elapsed*.00012)%1); let y=horizon+(base-horizon)*z*z; let next=horizon+(base-horizon)*(z+.035)**2; let half=roadW*z/2, nh=roadW*(z+.035)/2; ctx.fillStyle=i%2?'#272642':'#302c50';ctx.beginPath();ctx.moveTo(W/2-half,y);ctx.lineTo(W/2+half,y);ctx.lineTo(W/2+nh,next);ctx.lineTo(W/2-nh,next);ctx.fill(); if(i%2===0){ctx.strokeStyle='#54f6ff';ctx.lineWidth=Math.max(1,z*5);ctx.beginPath();ctx.moveTo(W/2-half,y);ctx.lineTo(W/2-nh,next);ctx.moveTo(W/2+half,y);ctx.lineTo(W/2+nh,next);ctx.stroke();} }
  // finish gate
  const gateY=horizon+(base-horizon)*.78; const gateH=45; ctx.strokeStyle='#ff3eb5';ctx.lineWidth=8;ctx.strokeRect(W/2-roadW*.3,gateY-gateH,roadW*.6,gateH);ctx.fillStyle='#fff';ctx.font='bold 13px Orbitron';ctx.textAlign='center';ctx.fillText('FINISH',W/2,gateY-20);
}
function drawCar(){ const x=W/2+player.x, y=H*.76; ctx.save();ctx.translate(x,y);ctx.rotate(player.x*.0008); ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(0,25,44,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff3eb5';ctx.shadowColor='#ff3eb5';ctx.shadowBlur=20;ctx.beginPath();ctx.roundRect(-27,-35,54,66,10);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#54f6ff';ctx.beginPath();ctx.moveTo(-18,-28);ctx.lineTo(18,-28);ctx.lineTo(12,-5);ctx.lineTo(-12,-5);ctx.closePath();ctx.fill();ctx.fillStyle='#11152d';ctx.fillRect(-33,-12,9,22);ctx.fillRect(24,-12,9,22);ctx.fillStyle='#ffe66d';ctx.fillRect(-20,24,11,4);ctx.fillRect(9,24,11,4);ctx.restore(); }
function update(dt){ if(!running)return; const steer=(keys.arrowleft||keys.a?-1:0)+(keys.arrowright||keys.d?1:0); const turbo=keys[' ']||keys.space; player.speed += (turbo?1.1:.55)*dt; player.speed*=Math.pow(.985,dt*60); player.speed=Math.min(player.speed,turbo?2.2:1.45); player.x+=steer*player.speed*dt*170; player.x*=Math.pow(.88,dt*60); player.distance+=player.speed*dt; elapsed=performance.now()-start; if(player.distance>1050){player.distance=0;lap++;lapEl.textContent=`${Math.min(lap,totalLaps)} / ${totalLaps}`; if(lap>totalLaps) finish();} timeEl.textContent=fmt(elapsed); }
function finish(){running=false;const value=fmt(elapsed);finalEl.textContent=value;resultEl.hidden=false;if(!best||elapsed<parseTime(best)){localStorage.setItem('trackmaria-best',value);bestEl.textContent=value;}}
function parseTime(s){const [m,rest]=s.split(':');const [sec,ms]=rest.split('.');return +m*60000 + +sec*1000 + +ms;}
function loop(now){const dt=Math.min((now-(last||now))/1000,.04);last=now;update(dt);drawRoad(now);drawCar();requestAnimationFrame(loop);} resize();reset();requestAnimationFrame(loop);
