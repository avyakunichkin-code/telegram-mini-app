const stage=document.querySelector('#dashboard'),state=document.querySelector('#state');
state.insertAdjacentHTML('beforeend','<option value="low">Низкие потребности · компактно</option>');
function draw(){stage.innerHTML=window.POCKET_REFERENCE[state.value];}
state.addEventListener('change',draw);
stage.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.matches('[data-onboarding-anchor="salary"]')){state.value='paid';draw();}else if(b.getAttribute('aria-label')==='Закрыть подсказку о зарплате'){b.closest('.mqx-pocket-reminder').setAttribute('data-hidden','true');}});
if(new URLSearchParams(location.search).get('embed')==='1')document.documentElement.dataset.embed='1';draw();
