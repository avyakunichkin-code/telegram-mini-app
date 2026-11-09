// Lab proposal mirrors adapter.precision; not an application financial calculator.
window.PrecisionModel = (() => {
 const keys=['incomes','expenses','savings','liabilities']
 function analyze(data) {
  let total=0,exact=0
  const contributions=keys.map(key=>{
   let weight=0,uncertain=0
   for(const row of data[key]||[]){
    const amount=key==='liabilities'?Number(row.monthly_payment):Number(row.max)
    const precise=key==='liabilities'?!row.estimated:Number(row.min)>0&&amount/Number(row.min)<=1.1
    if(!Number.isFinite(amount)||amount<=0)continue
    weight+=amount;if(!precise)uncertain+=amount
   }
   total+=weight;exact+=weight-uncertain
   return {key,weight,uncertain}
  })
  const share=total>0?exact/total:0
  const candidate=contributions.reduce((best,row)=>row.uncertain>(best?.uncertain||0)?row:best,null)
  return {share,level:total===0?'empty':share>=.85?'refined':share>=.5?'approximate':'draft',candidate,contributions,total}
 }
 function broad(min,max){return Number.isFinite(min)&&Number.isFinite(max)&&min>=0&&max>=min&&max>0&&(min===0||max/min>3)}
 return {analyze,broad}
})()
