// ---------- Popups (IQA, IET, Corpo D'água, ECI) ----------
(function(){
  function abrirLP(id){
    const ov = document.getElementById(id);
    if(ov) ov.classList.add('open');
  }
  function fecharLP(ov){
    ov.classList.remove('open');
  }
  document.querySelectorAll('[data-modal]').forEach(btn=>{
    btn.addEventListener('click', ()=>abrirLP(btn.getAttribute('data-modal')));
  });
  document.querySelectorAll('.lp-overlay').forEach(ov=>{
    ov.querySelector('[data-close]').addEventListener('click', ()=>fecharLP(ov));
    ov.addEventListener('click', (e)=>{ if(e.target === ov) fecharLP(ov); });
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key !== 'Escape') return;
    document.querySelectorAll('.lp-overlay.open').forEach(ov=>fecharLP(ov));
  });
  window.abrirLP = abrirLP;
})();

// ---------- Curvas de Qualidade NSF (OD e Fósforo) — fórmulas de SAIQA/js/app.js ----------
(function(){
  function curva_od(x){
    return Math.max(0, Math.min(100, 100.8 * Math.exp(Math.pow(x-106,2)/(-3745))));
  }
  function curva_fos(x){
    if(x<=0) return 100;
    return Math.max(2, Math.min(100, 213.7 * Math.exp(-1.68 * Math.pow(x, 0.3325))));
  }
  function gerarPontos(fn, xmin, xmax, n){
    const pts=[];
    for(let i=0;i<=n;i++){
      const x = xmin + (xmax-xmin)*(i/n);
      pts.push({x: Math.round(x*100)/100, y: Math.round(Math.max(0,Math.min(100,fn(x)))*10)/10});
    }
    return pts;
  }

  let chOd = null, chFos = null;
  function initCurvas(){
    if(typeof Chart === 'undefined') return;
    if(chOd){ chOd.destroy(); chOd=null; }
    if(chFos){ chFos.destroy(); chFos=null; }
    const base = {
      type:'line',
      options:{
        responsive:true,
        animations:{
          x:{type:'number', easing:'easeOutQuart', duration:1400, from:0, delay(ctx){ return ctx.dataIndex*8; }},
          y:{easing:'easeOutQuart', duration:1400, delay(ctx){ return ctx.dataIndex*8; }}
        },
        scales:{
          x:{type:'linear', ticks:{color:'#a8dce8', font:{size:9}}, grid:{color:'rgba(255,255,255,.06)'}},
          y:{min:0, max:100, ticks:{color:'#a8dce8', font:{size:9}}, grid:{color:'rgba(255,255,255,.06)'}}
        },
        plugins:{legend:{display:false}}
      }
    };
    chOd = new Chart(document.getElementById('curve-od'), Object.assign({}, base, {
      data:{datasets:[{data:gerarPontos(curva_od,0,200,80), borderColor:'#41b8d5', backgroundColor:'rgba(65,184,213,.15)', fill:true, pointRadius:0, tension:.3, borderWidth:2}]}
    }));
    chFos = new Chart(document.getElementById('curve-fos'), Object.assign({}, base, {
      data:{datasets:[{data:gerarPontos(curva_fos,0.01,10,80), borderColor:'#f59523', backgroundColor:'rgba(245,149,35,.15)', fill:true, pointRadius:0, tension:.3, borderWidth:2}]}
    }));
  }
  document.querySelectorAll('[data-modal="iqa-overlay"]').forEach(btn=>{
    btn.addEventListener('click', initCurvas);
  });
  document.querySelectorAll('.curve-box').forEach(box=>{
    box.style.cursor = 'pointer';
    box.addEventListener('click', initCurvas);
  });
})();

// ---------- Botão Voltar ao Topo ----------
window.addEventListener('scroll', function(){
  const btn = document.getElementById('backToTop');
  if(btn) btn.classList.toggle('visible', window.scrollY > 300);
});

// ---------- Marca d'água fixa (a partir de "A história") ----------
(function(){
  const wm = document.getElementById('pageWatermark');
  const origem = document.querySelector('.origem');
  const footer = document.querySelector('footer');
  if(!wm || !origem || !footer) return;
  function toggle(){
    const chegouNaHistoria = window.scrollY >= origem.offsetTop - 200;
    const footerTop = footer.getBoundingClientRect().top + window.scrollY;
    const chegouNoRodape = (window.scrollY + window.innerHeight) >= footerTop;
    wm.classList.toggle('visible', chegouNaHistoria && !chegouNoRodape);
  }
  window.addEventListener('scroll', toggle);
  toggle();
})();

// ---------- Crédito automático ao copiar texto de conteúdo ----------
document.addEventListener('copy', function(e){
  const selection = window.getSelection();
  if(!selection || selection.toString().trim().length < 30) return;
  const anchor = selection.anchorNode;
  const el = anchor.nodeType === 1 ? anchor : anchor.parentElement;
  if(!el || !el.closest('p, li, h2, h3, span')) return;
  if(el.closest('a, .contato-links, .contato-footer, .autora-links, footer')) return;
  const texto = selection.toString();
  e.clipboardData.setData('text/plain', texto + '\n\nFonte: SAIQA (saiqa.online), por Andrezza Rosa.');
  e.preventDefault();
});

// ---------- Reveal on scroll ----------
(function(){
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
  },{threshold:.15});
  els.forEach(el=>obs.observe(el));
})();

// ---------- Contador Validação ----------
(function(){
  const el = document.getElementById('val-counter');
  const obs = new IntersectionObserver((entries)=>{
    if(!entries[0].isIntersecting) return;
    obs.disconnect();
    let v = 0;
    const t0 = performance.now(), dur = 1400;
    function step(now){
      const p = Math.min(1,(now-t0)/dur);
      v = Math.round(100 * (1-Math.pow(1-p,3)));
      el.textContent = v + '%';
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  },{threshold:.6});
  obs.observe(el);
})();

// ---------- Escala ECI interativa ----------
(function(){
  const DESC = {
    'Crítico':'Situação de comprometimento crítico da qualidade da água, seja pelo IQA ou pelo IET. Indica a necessidade urgente de atenção e monitoramento do corpo hídrico.',
    'Desfavorável':'A combinação dos índices aponta para um cenário de qualidade comprometida, com sinais de poluição ou eutrofização que merecem acompanhamento.',
    'Moderado':'Condição intermediária: a água apresenta qualidade satisfatória em um dos índices, mas há sinais de enriquecimento por nutrientes ou impacto moderado a considerar.',
    'Favorável':'Cenário positivo, com boa qualidade da água e baixo grau de trofia. Indica um corpo hídrico bem conservado.',
    'Equilibrado':'A melhor combinação possível entre os dois índices: água de ótima qualidade e baixíssima concentração de nutrientes — o equilíbrio ambiental ideal.'
  };

  const angGauge={'Crítico':-162,'Desfavorável':-126,'Moderado':-90,'Favorável':-54,'Equilibrado':-18};
  const segGauge={'Equilibrado':'ig-equ','Favorável':'ig-fav','Moderado':'ig-mod','Desfavorável':'ig-des','Crítico':'ig-cri'};
  const colorGauge={'Crítico':'#330066','Desfavorável':'#ED4D65','Moderado':'#FF9900','Favorável':'#00796B','Equilibrado':'#0097A7'};

  const pointer = document.getElementById('eci-pointer');
  const clsLabel = document.getElementById('eci-cls-label');
  const descEl = document.getElementById('eci-popup-desc');
  const segIds = ['ig-cri','ig-des','ig-mod','ig-fav','ig-equ'];

  let currentAngle = -180;
  let animGen = 0;

  function tweenAngle(from, to, dur, myGen, onDone){
    const t0 = performance.now();
    function ease(t){ return 1-Math.pow(1-t,3); }
    function frame(now){
      if(myGen !== animGen) return; // uma seleção mais nova assumiu o controle
      const p = Math.min(1,(now-t0)/dur);
      const ang = from + (to-from)*ease(p);
      pointer.setAttribute('transform', `rotate(${ang},1517,1517)`);
      if(p<1) requestAnimationFrame(frame); else { currentAngle = to; if(onDone) onDone(); }
    }
    requestAnimationFrame(frame);
  }
  // Sobe até o fim da escala, pausa, depois assenta no valor final — mesmo padrão dos gauges do laudo real
  function animatePointer(to, onDone){
    const myGen = ++animGen; // invalida qualquer animação anterior ainda em andamento
    tweenAngle(currentAngle, 0, 1000, myGen, ()=>{
      setTimeout(()=>{
        if(myGen !== animGen) return;
        tweenAngle(0, to, 1500, myGen, onDone);
      }, 100);
    });
    return myGen;
  }

  let segTimers = [];
  // Cascata dos segmentos tipo roleta, desacelerando até parar no alvo — mesmo efeito do gauge real
  function cascataSegmentos(targetIdx){
    segTimers.forEach(t=>clearTimeout(t));
    segTimers = [];
    const nSeg = segIds.length;
    let cum = 0;
    for(let i=0;i<14;i++){
      const delay = 50 + 260*Math.pow(i/13,2);
      const idx = i===13 ? targetIdx : (((targetIdx-(13-i))%nSeg)+nSeg*10)%nSeg;
      segTimers.push(setTimeout(()=>{
        segIds.forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.remove('active'); });
        const el = document.getElementById(segIds[idx]);
        if(el) el.classList.add('active');
      }, cum));
      cum += delay;
    }
  }

  function selecionar(cls){
    const alvo = angGauge[cls];
    const targetIdx = segIds.indexOf(segGauge[cls]);

    if(window.dataLayer) window.dataLayer.push({ event: 'eci_demo_interacao', event_category: 'demo', event_label: cls });

    animGen++;
    currentAngle = -180;
    pointer.setAttribute('transform', `rotate(-180,1517,1517)`);
    segIds.forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.remove('active'); });

    document.querySelectorAll('.eci-legend-btn.active').forEach(b=>b.classList.remove('active'));

    clsLabel.classList.remove('eci-hint-text');
    clsLabel.style.color = '';
    clsLabel.textContent = '…';
    descEl.textContent = '';

    requestAnimationFrame(()=>{
      animatePointer(alvo, ()=>{
        const btn = document.querySelector(`.eci-legend-btn[data-cls="${cls}"]`);
        if(btn) btn.classList.add('active');
        clsLabel.style.color = colorGauge[cls];
        clsLabel.textContent = cls;
        descEl.textContent = DESC[cls];
      });
      cascataSegmentos(targetIdx);
    });
  }

  document.querySelectorAll('.eci-legend-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> selecionar(btn.dataset.cls));
  });

  const clsList = Object.keys(angGauge);
  document.querySelector('.eci-gauge-wrap').addEventListener('click', ()=>{
    selecionar(clsList[Math.floor(Math.random()*clsList.length)]);
  });
})();
