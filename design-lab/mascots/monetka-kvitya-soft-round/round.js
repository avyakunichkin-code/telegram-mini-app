(function labRound(){
 const states=window.MASCOT_STATES;
 const COINS=[
  {caption:'НОВЫЙ ХОД',pose:'welcome',title:'Начало хода',copy:'Новый ход начался. Давай посмотрим, что изменилось.'},
  {caption:'ДЕНЬ ЗАРПЛАТЫ',pose:'welcome',title:'Приветствие',copy:'Зарплата доступна. Можно забрать её до конца хода.'},
  {caption:'ЖМИ ЗАРПЛАТУ',pose:'wink',title:'Поддержка',copy:'Не забудь забрать зарплату до завершения хода.'},
  {caption:'СОБЫТИЕ!',pose:'surprised',title:'Удивление',copy:'Появилось событие. Сначала посмотри на варианты и их последствия.'},
  {caption:'ИНТЕРЕСНО…',pose:'think',title:'Размышление',copy:'Давай спокойно разберём, что меняет это решение.'},
  {caption:'ПОДУШКА РАСТЁТ',pose:'joy',title:'Радость',copy:'Подушка стала больше. Ещё один шаг к запасу спокойствия.'},
  {caption:'ДОЛГ РАСТЁТ',pose:'worried',title:'Внимание к риску',copy:'Долг увеличился. Стоит проверить платежи и расходы следующего хода.'},
  {caption:'ПОБЕДА',pose:'victory',title:'Победа',copy:'Цель достигнута! Посмотри, какой путь ты прошёл.'}
 ];
 const RECEIPTS={
  default:{label:'Обычные итоги',description:'Все изменения — в одном чеке',alt:'Квитя улыбается'},
  joy:{label:'Итог в плюс',description:'Ход завершён с положительным итогом',alt:'Квитя радуется'},
  think:{label:'Сверить строки',description:'Проверим, из чего сложился результат',alt:'Квитя сверяет строки'}
 };
 function coinMarkup(pose,id,caption){
  const m=states.coins[pose];
  if(!m)return '<p class="asset-error">Состояние ещё не подготовлено</p>';
  return `<img src="./assets/${m.file}" alt="Монетка: ${caption}">`;
 }
 function renderCoin(){
  const item=COINS.find(s=>s.caption===document.getElementById('caption').value)||COINS[0];
  document.getElementById('coin-live').innerHTML=coinMarkup(item.pose,'live',item.caption);
  document.getElementById('coin-live').dataset.pose=item.pose;
  document.getElementById('coin-copy').textContent=item.copy;
  const avatar=`./assets/coin-state-${item.pose}-avatar.webp`;
  document.getElementById('coin-guide').src=avatar;
  document.querySelectorAll('[data-coin-size]').forEach(el=>el.src=avatar);
 }
 function renderReceipt(){
  const key=document.getElementById('receipt-state').value;
  const item=RECEIPTS[key],art=states.receipts[key];
  const img=document.getElementById('kvitya-face');
  img.src=`./assets/${art.face}`;img.alt=item.alt;
  document.querySelector('.receipt-paper').dataset.receiptState=key;
  document.getElementById('receipt-copy').textContent=item.description;
 }
 document.getElementById('coin-states').innerHTML=COINS.map((item,i)=>`<figure class="emotion-card"><div class="coin-mini">${coinMarkup(item.pose,`card-${i}`,item.caption)}</div><figcaption><b>${item.title}</b><span>${item.caption}</span></figcaption></figure>`).join('');
 document.getElementById('receipt-states').innerHTML=Object.entries(RECEIPTS).map(([key,item])=>`<figure class="emotion-card"><img class="receipt-pose" src="./assets/${states.receipts[key]?.file||'kvitya-a.webp'}" alt="${item.alt}"><figcaption><b>${item.label}</b><span>${item.description}</span></figcaption></figure>`).join('');
 document.getElementById('caption').addEventListener('change',renderCoin);
 document.getElementById('receipt-state').addEventListener('change',renderReceipt);
 document.getElementById('theme-toggle').addEventListener('click',e=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';e.currentTarget.setAttribute('aria-pressed',String(dark));e.currentTarget.textContent=dark?'Светлая тема':'Тёмная тема'});
 renderCoin();renderReceipt();
})();
