window.SALES100_DATA = {
  months: [
    {id:'2026-07',label:'يوليو 2026',workDays:27,elapsedDays:18},
    {id:'2026-06',label:'يونيو 2026',workDays:26,elapsedDays:26}
  ],
  reps: [
    {id:'r1',name:'أحمد العتيبي',region:'الغربية',target:850000,achieved:692000,customers:12,opportunities:8},
    {id:'r2',name:'خالد الشهري',region:'الوسطى',target:780000,achieved:641000,customers:11,opportunities:7},
    {id:'r3',name:'محمد الغامدي',region:'الشرقية',target:720000,achieved:532000,customers:10,opportunities:9},
    {id:'r4',name:'سارة الحربي',region:'الغربية',target:690000,achieved:552000,customers:10,opportunities:6},
    {id:'r5',name:'ناصر القحطاني',region:'الوسطى',target:650000,achieved:448000,customers:10,opportunities:5},
    {id:'r6',name:'ريم الزهراني',region:'الشرقية',target:620000,achieved:477000,customers:9,opportunities:7},
    {id:'r7',name:'فهد المطيري',region:'الشمالية',target:580000,achieved:385000,customers:10,opportunities:5},
    {id:'r8',name:'نورة السبيعي',region:'الجنوبية',target:560000,achieved:418000,customers:9,opportunities:6},
    {id:'r9',name:'عبدالله الدوسري',region:'الوسطى',target:540000,achieved:366000,customers:10,opportunities:4},
    {id:'r10',name:'يوسف المالكي',region:'الغربية',target:510000,achieved:319000,customers:9,opportunities:5}
  ],
  customers: Array.from({length:100},(_,i)=>({
    id:`C-${String(i+1).padStart(3,'0')}`,
    name:['مجموعة المدار','شركة الأفق','مؤسسة الريادة','الخليج التجارية','الصفوة للصناعات','الوطنية للتوريد','الشرق المتقدمة','المنارة القابضة','الرواد المتحدة','النخبة اللوجستية'][i%10]+' '+(Math.floor(i/10)+1),
    repId:`r${(i%10)+1}`,
    target:40000+(i%7)*9000,
    achieved:22000+(i%9)*7500,
    lastOrder:`2026-07-${String((i%18)+1).padStart(2,'0')}`,
    status:i%8===0?'At Risk':i%5===0?'Inactive':'Active'
  })),
  daily:[120000,154000,132000,188000,176000,211000,198000,243000,219000,267000,254000,288000,276000,301000,292000,327000,310000,342000,0,0,0,0,0,0,0,0,0],
  opportunities:[
    {id:'OP-1001',customer:'مجموعة المدار 1',repId:'r1',value:180000,stage:'Negotiation',probability:80,closeDate:'2026-07-30'},
    {id:'OP-1002',customer:'شركة الأفق 2',repId:'r2',value:140000,stage:'Proposal',probability:60,closeDate:'2026-08-03'},
    {id:'OP-1003',customer:'مؤسسة الريادة 3',repId:'r3',value:220000,stage:'Qualified',probability:45,closeDate:'2026-08-10'},
    {id:'OP-1004',customer:'الخليج التجارية 4',repId:'r4',value:95000,stage:'Lead',probability:25,closeDate:'2026-08-15'},
    {id:'OP-1005',customer:'الصفوة للصناعات 5',repId:'r6',value:165000,stage:'Negotiation',probability:75,closeDate:'2026-07-31'}
  ]
};
