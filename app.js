(() => {
  'use strict';
  const source = window.SALES100_DATA;
  if (!source) throw new Error('Sales100 data file was not loaded.');

  const stored = JSON.parse(localStorage.getItem('sales100-opportunities') || 'null');
  const state = {view:'dashboard', month:source.months[0].id, rep:'all', opportunities:Array.isArray(stored)?stored:source.opportunities.slice()};
  const $ = s => document.querySelector(s);
  const appView = $('#appView');
  const pageTitle = $('#pageTitle');
  const pageSubtitle = $('#pageSubtitle');
  const money = n => new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(n);
  const num = n => new Intl.NumberFormat('ar-SA').format(n);
  const pct = n => `${Math.round(n)}%`;
  const repById = id => source.reps.find(r=>r.id===id);
  const filteredReps = () => state.rep==='all' ? source.reps : source.reps.filter(r=>r.id===state.rep);
  const filteredCustomers = () => state.rep==='all' ? source.customers : source.customers.filter(c=>c.repId===state.rep);
  const filteredOpps = () => state.rep==='all' ? state.opportunities : state.opportunities.filter(o=>o.repId===state.rep);

  function initFilters(){
    $('#monthFilter').innerHTML=source.months.map(m=>`<option value="${m.id}">${m.label}</option>`).join('');
    $('#repFilter').insertAdjacentHTML('beforeend',source.reps.map(r=>`<option value="${r.id}">${r.name}</option>`).join(''));
    $('#modalRep').innerHTML=source.reps.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');
    const d=new Date(); d.setDate(d.getDate()+14); document.querySelector('[name="closeDate"]').value=d.toISOString().slice(0,10);
  }
  function totals(){
    const reps=filteredReps();
    const target=reps.reduce((s,r)=>s+r.target,0), achieved=reps.reduce((s,r)=>s+r.achieved,0);
    const month=source.months.find(m=>m.id===state.month);
    const runRate=achieved/Math.max(1,month.elapsedDays), forecast=runRate*month.workDays;
    return {target,achieved,gap:Math.max(0,target-achieved),achievement:target?achieved/target*100:0,forecast,runRate,month};
  }
  function kpis(){
    const t=totals(), opps=filteredOpps();
    return `<div class="kpi-grid">
      <article class="card kpi"><div class="kpi-label">المستهدف الشهري</div><div class="kpi-value">${money(t.target)}</div><div class="kpi-sub">${num(t.month.workDays)} يوم عمل</div></article>
      <article class="card kpi"><div class="kpi-label">المحقق حتى اليوم</div><div class="kpi-value">${money(t.achieved)}</div><div class="kpi-sub positive">نسبة الإنجاز ${pct(t.achievement)}</div></article>
      <article class="card kpi"><div class="kpi-label">الفجوة المتبقية</div><div class="kpi-value">${money(t.gap)}</div><div class="kpi-sub ${t.gap?'negative':'positive'}">المطلوب للإقفال</div></article>
      <article class="card kpi"><div class="kpi-label">التوقع لنهاية الشهر</div><div class="kpi-value">${money(t.forecast)}</div><div class="kpi-sub ${t.forecast>=t.target?'positive':'negative'}">${t.forecast>=t.target?'يتجاوز المستهدف':'أقل من المستهدف'}</div></article>
    </div>`;
  }
  function dailyChart(){
    const vals=source.daily, max=Math.max(...vals,1);
    return `<div class="chart">${vals.map((v,i)=>`<div class="bar-group" title="اليوم ${i+1}: ${money(v)}"><div class="bar" style="height:${v?Math.max(4,v/max*100):2}%"></div></div>`).join('')}</div>
    <div class="chart-labels">${vals.map((_,i)=>`<span>${i%3===0?i+1:''}</span>`).join('')}</div>`;
  }
  function dashboard(){
    const t=totals(); const ranked=filteredReps().slice().sort((a,b)=>b.achieved/b.target-a.achieved/a.target);
    const needed=Math.max(0,(t.target-t.achieved)/Math.max(1,t.month.workDays-t.month.elapsedDays));
    appView.innerHTML=`<div class="filter-note"><span>آخر تحديث: الآن</span><span>${state.rep==='all'?'عرض شامل للفريق':repById(state.rep).name}</span></div>${kpis()}
      <div class="dashboard-grid">
        <article class="card"><div class="card-header"><h3>المبيعات اليومية</h3><span class="badge blue">${money(t.runRate)} متوسط يومي</span></div><div class="card-body">${dailyChart()}</div></article>
        <article class="card"><div class="card-header"><h3>تنبيهات ذكية</h3><span class="badge amber">3 توصيات</span></div><div class="card-body">
          <div class="insight"><strong>المعدل اليومي المطلوب</strong><span>يلزم تحقيق ${money(needed)} يوميًا خلال الأيام المتبقية.</span></div>
          <div class="insight"><strong>أفضل أداء</strong><span>${ranked[0]?.name||'-'} يحقق ${pct((ranked[0]?.achieved/ranked[0]?.target)*100||0)} من مستهدفه.</span></div>
          <div class="insight"><strong>فرص قريبة من الإغلاق</strong><span>${filteredOpps().filter(o=>o.probability>=70).length} فرص باحتمال إغلاق 70% أو أكثر.</span></div>
        </div></article>
      </div>
      <article class="card table-card"><div class="card-header"><h3>ترتيب فريق المبيعات</h3><button class="btn" data-go="team">عرض التفاصيل</button></div><div class="table-wrap"><table><thead><tr><th>الترتيب</th><th>المندوب</th><th>المنطقة</th><th>المستهدف</th><th>المحقق</th><th>الإنجاز</th><th>الفجوة</th></tr></thead><tbody>${ranked.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${r.name}</strong></td><td>${r.region}</td><td>${money(r.target)}</td><td>${money(r.achieved)}</td><td><span class="badge ${(r.achieved/r.target)>=.8?'green':(r.achieved/r.target)>=.65?'amber':'red'}">${pct(r.achieved/r.target*100)}</span></td><td>${money(Math.max(0,r.target-r.achieved))}</td></tr>`).join('')}</tbody></table></div></article>`;
  }
  function sales(){
    const t=totals();
    appView.innerHTML=`${kpis()}<article class="card table-card"><div class="card-header"><h3>سجل المبيعات اليومية</h3><span class="badge blue">${t.month.label}</span></div><div class="table-wrap"><table><thead><tr><th>اليوم</th><th>المبيعات</th><th>المستهدف اليومي</th><th>الفرق</th><th>الحالة</th></tr></thead><tbody>${source.daily.map((v,i)=>{const daily=t.target/t.month.workDays,d=v-daily;return `<tr><td>${i+1}</td><td>${money(v)}</td><td>${money(daily)}</td><td class="${d>=0?'positive':'negative'}">${money(d)}</td><td><span class="badge ${v===0?'blue':d>=0?'green':'red'}">${v===0?'قادم':d>=0?'محقق':'أقل من المطلوب'}</span></td></tr>`}).join('')}</tbody></table></div></article>`;
  }
  function team(){
    appView.innerHTML=`<div class="metric-list"><div class="card metric-box"><strong>${filteredReps().length}</strong><span>عدد المندوبين</span></div><div class="card metric-box"><strong>${money(totals().achieved)}</strong><span>إجمالي المحقق</span></div><div class="card metric-box"><strong>${pct(totals().achievement)}</strong><span>إنجاز الفريق</span></div></div><article class="card table-card"><div class="card-header"><h3>أداء المندوبين</h3></div><div class="table-wrap"><table><thead><tr><th>المندوب</th><th>المنطقة</th><th>العملاء</th><th>الفرص</th><th>المستهدف</th><th>المحقق</th><th>نسبة الإنجاز</th></tr></thead><tbody>${filteredReps().map(r=>`<tr><td><strong>${r.name}</strong></td><td>${r.region}</td><td>${r.customers}</td><td>${r.opportunities}</td><td>${money(r.target)}</td><td>${money(r.achieved)}</td><td><div class="progress-row"><div class="progress-top"><span>${pct(r.achieved/r.target*100)}</span></div><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100,r.achieved/r.target*100)}%"></div></div></div></td></tr>`).join('')}</tbody></table></div></article>`;
  }
  function customers(){
    appView.innerHTML=`<div class="toolbar"><input class="search" id="customerSearch" placeholder="ابحث باسم العميل أو رقمه"><span class="badge blue">${filteredCustomers().length} عميل</span></div><article class="card"><div class="table-wrap"><table><thead><tr><th>الرقم</th><th>العميل</th><th>المندوب</th><th>المستهدف</th><th>المحقق</th><th>آخر طلب</th><th>الحالة</th></tr></thead><tbody id="customerRows">${filteredCustomers().map(c=>`<tr><td>${c.id}</td><td><strong>${c.name}</strong></td><td>${repById(c.repId)?.name||'-'}</td><td>${money(c.target)}</td><td>${money(c.achieved)}</td><td>${c.lastOrder}</td><td><span class="badge ${c.status==='Active'?'green':c.status==='At Risk'?'red':'amber'}">${c.status}</span></td></tr>`).join('')}</tbody></table></div></article>`;
    $('#customerSearch').addEventListener('input',e=>document.querySelectorAll('#customerRows tr').forEach(r=>r.hidden=!r.innerText.includes(e.target.value)));
  }
  function pipeline(){
    const stages=['Lead','Qualified','Proposal','Negotiation'];
    appView.innerHTML=`<div class="toolbar"><span>إجمالي قيمة الفرص: <strong>${money(filteredOpps().reduce((s,o)=>s+o.value,0))}</strong></span><button class="btn btn-primary" id="inlineAdd">+ فرصة جديدة</button></div><div class="pipeline-grid">${stages.map(s=>{const arr=filteredOpps().filter(o=>o.stage===s);return `<section class="stage"><div class="stage-head"><strong>${s}</strong><span class="badge blue">${arr.length}</span></div>${arr.map(o=>`<article class="opp-card"><strong>${o.customer}</strong><p>${repById(o.repId)?.name||'-'}</p><p>${money(o.value)} • احتمال ${o.probability}%</p><p>الإغلاق: ${o.closeDate}</p></article>`).join('')||'<p style="color:var(--muted);font-size:12px">لا توجد فرص</p>'}</section>`}).join('')}</div>`;
    $('#inlineAdd').addEventListener('click',openModal);
  }
  function reports(){
    const t=totals(), weighted=filteredOpps().reduce((s,o)=>s+o.value*(o.probability/100),0);
    appView.innerHTML=`<div class="metric-list"><div class="card metric-box"><strong>${money(weighted)}</strong><span>قيمة الفرص المرجحة</span></div><div class="card metric-box"><strong>${filteredCustomers().filter(c=>c.status==='At Risk').length}</strong><span>عملاء معرضون للخطر</span></div><div class="card metric-box"><strong>${money(t.forecast-t.target)}</strong><span>انحراف التوقع عن المستهدف</span></div></div><article class="card table-card"><div class="card-header"><h3>ملخص تنفيذي</h3><button class="btn" id="printReport">طباعة التقرير</button></div><div class="card-body"><div class="insight"><strong>نسبة الإنجاز الكلية</strong><span>${pct(t.achievement)} من المستهدف الشهري.</span></div><div class="insight"><strong>التوقع</strong><span>التوقع الحالي لنهاية الشهر ${money(t.forecast)}.</span></div><div class="insight"><strong>المخاطر</strong><span>${filteredCustomers().filter(c=>c.status!=='Active').length} عميل يحتاج إلى متابعة.</span></div></div></article>`;
    $('#printReport').addEventListener('click',()=>window.print());
  }
  const views={dashboard,sales,team,customers,pipeline,reports};
  const meta={dashboard:['لوحة التحكم','متابعة الأداء اليومي والشهري للمبيعات'],sales:['المبيعات اليومية','تحليل الأداء مقابل المستهدف اليومي'],team:['فريق المبيعات','ترتيب ومقارنة أداء المندوبين'],customers:['العملاء','متابعة 100 عميل وحالتهم البيعية'],pipeline:['مسار الفرص','إدارة الفرص حسب المرحلة واحتمال الإغلاق'],reports:['التقارير التنفيذية','مؤشرات وملخصات للإدارة العليا']};
  function render(){
    pageTitle.textContent=meta[state.view][0]; pageSubtitle.textContent=meta[state.view][1];
    views[state.view]();
    document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.go)));
  }
  function setView(v){state.view=v;document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('#sidebar').classList.remove('open');render()}
  function openModal(){ $('#opportunityModal').classList.remove('hidden'); }
  function closeModal(){ $('#opportunityModal').classList.add('hidden'); }
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
  document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('#monthFilter').addEventListener('change',e=>{state.month=e.target.value;render()});
  $('#repFilter').addEventListener('change',e=>{state.rep=e.target.value;render()});
  $('#addOpportunityBtn').addEventListener('click',openModal); $('#closeModal').addEventListener('click',closeModal); $('#cancelModal').addEventListener('click',closeModal);
  $('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#opportunityModal').addEventListener('click',e=>{if(e.target.id==='opportunityModal')closeModal()});
  $('#opportunityForm').addEventListener('submit',e=>{
    e.preventDefault(); const f=new FormData(e.currentTarget);
    state.opportunities.unshift({id:`OP-${Date.now().toString().slice(-6)}`,customer:f.get('customer').trim(),repId:f.get('rep'),value:Number(f.get('value')),stage:f.get('stage'),probability:Number(f.get('probability')),closeDate:f.get('closeDate')});
    localStorage.setItem('sales100-opportunities',JSON.stringify(state.opportunities)); closeModal(); e.currentTarget.reset(); toast('تمت إضافة الفرصة بنجاح'); if(state.view==='pipeline')render();
  });
  initFilters(); render();
})();
