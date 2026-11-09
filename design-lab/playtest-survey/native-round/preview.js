const questions = [
  ['salary', 'Понятно, когда получать зарплату?', ['Да', 'Частично', 'Нет']],
  ['safety', 'Понятна разница между счётом и подушкой?', ['Да', 'Частично', 'Нет']],
  ['close', 'Понятно, сколько спишется при завершении хода?', ['Да', 'Частично', 'Нет']],
  ['blocked', 'Было место, где не смог продолжить?', ['Нет', 'Да']],
  ['continue', 'Хочется сыграть ещё несколько ходов?', ['Да', 'Не уверен', 'Нет']],
];
const stores = {a: {answers:{}, comment:'',step:0,state:'form'}, b:{answers:{},comment:'',step:0,state:'form'}};
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function choices(id,q,large=false) {
  const [key,title,labels]=q;
  return `<fieldset class="question"><legend>${escape(title)}</legend><div class="${large?'step-options':'options'}">${labels.map((label,i)=>`<label class="option"><input type="radio" name="${id}-${key}" value="${i}" data-key="${key}" ${stores[id].answers[key]===i?'checked':''}>${label}</label>`).join('')}</div></fieldset>`;
}
function render(id) {
  const s=stores[id],root=document.querySelector(`#variant-${id}`), complete=questions.every(([key])=>key in s.answers);
  root.innerHTML=`<div class="screen-top">ТВОЙ ХОД <small>Студент · 5 ходов закрыто</small></div>`;
  if(s.state==='invite') {
    root.innerHTML+=`<div class="center"><img src="./assets/monetka.webp" alt=""><p class="eyebrow">ЕСТЬ МИНУТКА?</p><h3>Как тебе первые ходы?</h3><p>Пять коротких вопросов помогут сделать игру понятнее.</p><p class="muted">Добровольно, без награды. Можно ответить позже из меню.</p><button class="primary" data-action="open">Ответить</button><button class="plain" data-action="later">Позже</button></div>`;
  } else if(s.state==='later') {
    root.innerHTML+=`<div class="center"><h3>Продолжаем игру</h3><p>Приглашение больше не появится. Опрос доступен в меню.</p><button class="secondary" data-action="open">Меню → Поделиться впечатлением</button></div>`;
  } else if(s.state==='success') {
    root.innerHTML+=`<div class="center"><img src="./assets/monetka.webp" alt=""><h3 class="thanks" tabindex="-1">Спасибо за ответы!</h3><p>Они помогут сделать следующие ходы понятнее.</p><button class="primary" data-action="later">Вернуться в игру</button></div>`;
  } else if(s.state==='empty') {
    root.innerHTML+=`<div class="center"><h3>Сначала попробуй игру</h3><p>После начала партии здесь можно поделиться впечатлением.</p><button class="primary" disabled>Ответить</button></div>`;
  } else {
    const busy=s.state==='sending',title=id==='a'?'Как тебе игра?':questions[s.step][1];
    root.innerHTML+=`<form class="sheet"><header class="sheet-head"><button class="close" type="button" aria-label="Закрыть опрос" data-action="later" ${busy?'disabled':''}>×</button><h3>${title}</h3><p class="muted">${id==='a'?'Пять коротких вопросов · около минуты':'Вопрос '+(s.step+1)+' из 5'}</p></header><div class="content">${s.state==='error'?'<p class="error" role="alert">Не удалось отправить. Ответы на месте — попробуй ещё раз.</p>':''}${id==='a'?questions.map(q=>choices(id,q)).join(''):`<p class="step-line">${s.step+1} / 5</p>${choices(id,[questions[s.step][0],'Выбери ответ',questions[s.step][2]],true)}`}${id==='a'||s.step===4?`<label class="text-label" for="${id}-comment">Что хотелось бы изменить? <span class="muted">Необязательно</span></label><textarea id="${id}-comment" maxlength="1000" placeholder="Можно рассказать, где застрял">${escape(s.comment)}</textarea><p class="muted">Не указывай личные данные. Ответ увидит команда игры.</p>`:''}</div><footer class="footer">${id==='b'&&s.step>0?`<button class="secondary" type="button" data-action="back" ${busy?'disabled':''}>Назад</button>`:''}<button class="primary" type="submit" ${busy||!(id==='a'?complete:questions[s.step][0] in s.answers)?'disabled':''}>${busy?'Отправляем…':id==='b'&&s.step<4?'Дальше':'Отправить ответы'}</button><p class="muted">${busy?'Подожди немного.':'Опрос добровольный. Можно закрыть в любой момент.'}</p></footer></form>`;
    if(busy) root.querySelectorAll('input,textarea').forEach(el=>el.disabled=true);
  }
  root.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{
    const action=el.dataset.action;
    if(action==='open')s.state='form';else if(action==='back')s.step--;else {s.state='later';s.answers={};s.comment='';s.step=0;}
    render(id);
  }));
  root.querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{
    s.answers[el.dataset.key]=Number(el.value);
    const button=root.querySelector('[type=submit]');
    button.disabled=!(id==='a'?questions.every(([key])=>key in s.answers):questions[s.step][0] in s.answers);
  }));
  root.querySelector('textarea')?.addEventListener('input',e=>s.comment=e.target.value);
  root.querySelector('form')?.addEventListener('submit',e=>{e.preventDefault();if(id==='b'&&s.step<4)s.step++;else s.state='success';render(id);root.querySelector('.thanks')?.focus();});
}
function renderAll(){render('a');render('b');}
document.querySelector('#theme').addEventListener('change',e=>document.documentElement.dataset.theme=e.target.value);
document.querySelector('#state').addEventListener('change',e=>{for(const s of Object.values(stores))s.state=e.target.value;renderAll();});
document.querySelector('#reset').addEventListener('click',()=>{for(const s of Object.values(stores)){s.state='form';s.answers={};s.step=0;s.comment='';}document.querySelector('#state').value='form';renderAll();});
document.querySelector('#menu-open').addEventListener('click',()=>{for(const s of Object.values(stores))s.state='form';document.querySelector('#state').value='form';renderAll();document.querySelector('#variant-a').scrollIntoView({behavior:'auto',block:'center'});document.querySelector('#variant-a input')?.focus();});
renderAll();
