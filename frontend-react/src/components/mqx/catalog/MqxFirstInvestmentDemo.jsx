import { useState } from 'react';
import { MqxFirstInvestmentSheet } from '../layout/MqxFirstInvestmentSheet';

export function MqxFirstInvestmentDemo() {
  const [product,setProduct]=useState(null);
  const [amount,setAmount]=useState(0);
  const [fail,setFail]=useState(false);
  return <>
    <p>Утверждённый A: компактное окно снизу. Синтетические 80 000 ₽, расходы 37 500 ₽; API не вызывается.</p>
    <div className="mqx-first-investment-empty__actions">
      <button type="button" className="mqx-bg-btn mqx-first-investment__submit" onClick={()=>{setAmount(0);setProduct('deposit');}}>Открыть вклад</button>
      <button type="button" className="mqx-bg-btn mqx-first-investment-empty__bond" onClick={()=>{setAmount(0);setProduct('bond');}}>Купить облигации</button>
    </div>
    <label><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/>Ошибка операции</label>
    {product?<MqxFirstInvestmentSheet key={product} product={product} amount={amount} maxCash={80000} expenses={37500}
      annualRatePercent={product==='deposit'?14:16} onAmountChange={setAmount} onClose={()=>setProduct(null)}
      onSubmit={async()=>{if(fail)throw new Error('Synthetic');setProduct(null);}}/>:null}
  </>;
}
