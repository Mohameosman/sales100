(() => {
  const state={mode:"sales",search:"",region:"الكل",rep:"الكل",client:"الكل",collapsed:new Set()};
  const $=s=>document.querySelector(s);
  const els={
    region:$("#regionFilter"),rep:$("#repFilter"),client:$("#clientFilter"),search:$("#searchInput"),
    head:$("#matrixHead"),body:$("#matrixBody"),foot:$("#matrixFoot"),kpis:$("#kpiCards"),
    topClients:$("#topClients"),topReps:$("#topReps"),meta:$("#matrixMeta"),badge:$("#alertBadge"),
    month:$("#monthPicker"),dialog:$("#cellDialog"),dialogTitle:$("#dialogTitle"),dialogBody:$("#dialogBody")
  };
  const fmt=n=>new Intl.NumberFormat("en-US").format(Math.round(n));
  const short=n=>n>=1e6?(n/1e6).toFixed(2)+"M":n>=1e3?Math.round(n/1e3)+"K":fmt(n);
  const valueLabel=()=>state.mode==="sales"?"ريال سعودي":"حجز";
  const sum=(a,fn)=>a.reduce((s,x)=>s+fn(x),0);
  const clientTotal=c=>sum(c.days,d=>d[state.mode]);
  const salesTotal=c=>sum(c.days,d=>d.sales);

  function initFilters(){
    const regions=["الكل",...new Set(Sales100Data.reps.map(r=>r.region))];
    els.region.innerHTML=regions.map(x=>`<option>${x}</option>`).join("");
    els.rep.innerHTML=["الكل",...Sales100Data.reps.map(r=>r.name)].map(x=>`<option>${x}</option>`).join("");
    els.client.innerHTML=["الكل",...Sales100Data.reps.flatMap(r=>r.clients.map(c=>c.name))].map(x=>`<option>${x}</option>`).join("");
  }
  function filteredReps(){
    const q=state.search.trim();
    return Sales100Data.reps.filter(r=>(state.region==="الكل"||r.region===state.region)&&(state.rep==="الكل"||r.name===state.rep))
      .map(r=>({...r,clients:r.clients.filter(c=>(state.client==="الكل"||c.name===state.client)&&(!q||r.name.includes(q)||c.name.includes(q)))}))
      .filter(r=>r.clients.length);
  }
  function classify(value,targetDaily){
    if(value===0)return"zero"; const ratio=value/targetDaily;
    if(ratio>=1)return"good"; if(ratio>=.7)return"near"; return"low";
  }
  function renderHead(){
    const days=Array.from({length:30},(_,i)=>`<th>${i+1}</th>`).join("");
    els.head.innerHTML=`<tr><th class="name-col">المندوب / العميل</th>${days}<th class="summary-col">الإجمالي</th><th class="summary-col">المستهدف</th><th class="summary-col">الإنجاز</th><th class="summary-col">الفجوة</th><th class="summary-col">التوقع</th></tr>`;
  }
  function rowHtml(type,r,c=null){
    const clients=c?[c]:r.clients;
    const days=Array.from({length:30},(_,di)=>{
      const v=sum(clients,x=>x.days[di][state.mode]);
      const targetDaily=state.mode==="sales"?sum(clients,x=>x.target/24):Math.max(1,sum(clients,x=>x.target/24/14000));
      const cls=classify(v,targetDaily);
      const attrs=c?`data-rep="${r.name}" data-client="${c.name}" data-day="${di+1}" data-value="${v}"`:"";
      return `<td class="cell ${cls}" ${attrs}>${short(v)}</td>`;
    }).join("");
    const total=sum(clients,clientTotal);
    const salesT=sum(clients,salesTotal);
    const targetSales=sum(clients,x=>x.target);
    const target=state.mode==="sales"?targetSales:Math.round(targetSales/14000);
    const achievement=target?total/target*100:0;
    const gap=Math.max(0,target-total);
    const elapsed=18, forecast=Math.round(total/elapsed*30);
    const achCls=achievement>=100?"good-text":achievement>=80?"warn-text":"bad-text";
    const name=type==="rep"?`<span class="toggle-arrow">${state.collapsed.has(r.id)?"›":"⌄"}</span>♟ ${r.name}`:c.name;
    return `<tr class="${type==="rep"?"rep-row":"client-row"}" ${type==="rep"?`data-repid="${r.id}"`:""}>
      <td class="name-col">${name}</td>${days}
      <td class="summary-col">${short(total)}</td>
      <td class="summary-col">${short(target)}</td>
      <td class="summary-col achievement ${achCls}">${achievement.toFixed(0)}%</td>
      <td class="summary-col gap">${short(gap)}</td>
      <td class="summary-col">${short(forecast)}</td>
    </tr>`;
  }
  function renderTable(){
    const reps=filteredReps(); let html="";
    reps.forEach(r=>{html+=rowHtml("rep",r); if(!state.collapsed.has(r.id))r.clients.forEach(c=>html+=rowHtml("client",r,c));});
    els.body.innerHTML=html||`<tr><td colspan="36">لا توجد نتائج مطابقة.</td></tr>`;
    const clients=reps.flatMap(r=>r.clients);
    const days=Array.from({length:30},(_,di)=>`<td>${short(sum(clients,c=>c.days[di][state.mode]))}</td>`).join("");
    const total=sum(clients,clientTotal), targetSales=sum(clients,c=>c.target), target=state.mode==="sales"?targetSales:Math.round(targetSales/14000);
    const ach=target?total/target*100:0,gap=Math.max(0,target-total),forecast=Math.round(total/18*30);
    els.foot.innerHTML=`<tr class="total-row"><td class="name-col">إجمالي النتائج</td>${days}<td>${short(total)}</td><td>${short(target)}</td><td>${ach.toFixed(0)}%</td><td>${short(gap)}</td><td>${short(forecast)}</td></tr>`;
    els.meta.textContent=`${reps.length} مندوبي مبيعات • ${clients.length} عميل • عرض ${state.mode==="sales"?"قيمة المبيعات":"عدد الحجوزات"}`;
    bindRows();
  }
  function renderKpis(){
    const clients=filteredReps().flatMap(r=>r.clients), totalSales=sum(clients,salesTotal),target=sum(clients,c=>c.target),ach=target?totalSales/target*100:0;
    const gap=Math.max(0,target-totalSales),forecast=Math.round(totalSales/18*30),active=clients.filter(c=>c.days.slice(0,18).some(d=>d.sales>0)).length;
    const cards=[
      ["إجمالي المبيعات",fmt(totalSales),"ريال سعودي","محقق حتى اليوم"],
      ["المستهدف الشهري",fmt(target),"ريال سعودي","هدف الشهر"],
      ["نسبة الإنجاز",ach.toFixed(1)+"%","","مقارنة بالمستهدف"],
      ["الفجوة",fmt(gap),"ريال سعودي","المتبقي للمستهدف"],
      ["توقع نهاية الشهر",fmt(forecast),"ريال سعودي",forecast>=target?"متوقع تجاوز الهدف":"يحتاج تسريع الأداء"],
      ["العملاء النشطون",fmt(active),`من أصل ${clients.length}`,"نشاط خلال الشهر"]
    ];
    els.kpis.innerHTML=cards.map((c,i)=>`<article class="kpi"><div class="label">${c[0]}</div><div class="value">${c[1]}</div><div class="unit">${c[2]}</div><div class="note ${i===0||i===5?"positive":i===3?"negative":""}">${c[3]}</div></article>`).join("");
    const alerts=clients.filter(c=>c.days.slice(11,18).every(d=>d.sales===0)).length; els.badge.textContent=alerts;
  }
  function renderRanks(){
    const reps=filteredReps();
    const clients=reps.flatMap(r=>r.clients.map(c=>({name:c.name,value:salesTotal(c)}))).sort((a,b)=>b.value-a.value).slice(0,5);
    const repRank=reps.map(r=>({name:r.name,value:sum(r.clients,salesTotal)})).sort((a,b)=>b.value-a.value).slice(0,5);
    els.topClients.innerHTML=clients.map(x=>`<li>${x.name}<span>${short(x.value)}</span></li>`).join("");
    els.topReps.innerHTML=repRank.map(x=>`<li>${x.name}<span>${short(x.value)}</span></li>`).join("");
  }
  function render(){renderKpis();renderTable();renderRanks();}
  function bindRows(){
    document.querySelectorAll(".rep-row").forEach(tr=>tr.onclick=()=>{const id=tr.dataset.repid;state.collapsed.has(id)?state.collapsed.delete(id):state.collapsed.add(id);renderTable();});
    document.querySelectorAll(".client-row .cell[data-day]").forEach(td=>td.onclick=()=>{
      const rep=td.dataset.rep,client=td.dataset.client,day=td.dataset.day,value=Number(td.dataset.value);
      els.dialogTitle.textContent=`${client} — اليوم ${day}`;
      els.dialogBody.innerHTML=`<div class="detail-grid">
        <div class="detail-item"><small>المندوب</small><strong>${rep}</strong></div>
        <div class="detail-item"><small>العميل</small><strong>${client}</strong></div>
        <div class="detail-item"><small>${state.mode==="sales"?"قيمة المبيعات":"عدد الحجوزات"}</small><strong>${fmt(value)} ${valueLabel()}</strong></div>
        <div class="detail-item"><small>حالة اليوم</small><strong>${value>0?"نشط":"لا توجد عمليات"}</strong></div>
      </div>`; els.dialog.showModal();
    });
  }
  function exportCSV(){
    const reps=filteredReps(), rows=[["المندوب","العميل",...Array.from({length:30},(_,i)=>`اليوم ${i+1}`),"الإجمالي","المستهدف","الإنجاز","الفجوة"]];
    reps.forEach(r=>r.clients.forEach(c=>{
      const total=clientTotal(c),target=state.mode==="sales"?c.target:Math.round(c.target/14000),ach=target?total/target*100:0;
      rows.push([r.name,c.name,...c.days.map(d=>d[state.mode]),total,target,ach.toFixed(1)+"%",Math.max(0,target-total)]);
    }));
    const csv="\ufeff"+rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="Sales100-Monthly-Matrix.csv";a.click();URL.revokeObjectURL(a.href);
  }
  initFilters();renderHead();render();
  els.region.onchange=e=>{state.region=e.target.value;render()};els.rep.onchange=e=>{state.rep=e.target.value;render()};els.client.onchange=e=>{state.client=e.target.value;render()};
  els.search.oninput=e=>{state.search=e.target.value;render()};
  $("#salesModeBtn").onclick=()=>{state.mode="sales";$("#salesModeBtn").classList.add("active");$("#bookingsModeBtn").classList.remove("active");render()};
  $("#bookingsModeBtn").onclick=()=>{state.mode="bookings";$("#bookingsModeBtn").classList.add("active");$("#salesModeBtn").classList.remove("active");render()};
  $("#resetFiltersBtn").onclick=()=>{state.region=state.rep=state.client="الكل";state.search="";els.region.value=els.rep.value=els.client.value="الكل";els.search.value="";render()};
  $("#expandAllBtn").onclick=()=>{state.collapsed.clear();renderTable()};$("#collapseAllBtn").onclick=()=>{Sales100Data.reps.forEach(r=>state.collapsed.add(r.id));renderTable()};
  $("#exportBtn").onclick=exportCSV;$("#printBtn").onclick=()=>window.print();$("#dialogClose").onclick=()=>els.dialog.close();
  $("#prevMonth").onclick=()=>{const d=new Date(els.month.value+"-01");d.setMonth(d.getMonth()-1);els.month.value=d.toISOString().slice(0,7)};
  $("#nextMonth").onclick=()=>{const d=new Date(els.month.value+"-01");d.setMonth(d.getMonth()+1);els.month.value=d.toISOString().slice(0,7)};
})();