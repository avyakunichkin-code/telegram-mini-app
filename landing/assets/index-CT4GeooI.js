(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function r(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(s){if(s.ep)return;s.ep=!0;const i=r(s);fetch(s.href,i)}})();const h="mq-landing-lang",u=["ru","en"],E="/telegram-mini-app/landing/";let m={},q="ru";function _(e,t){return t.split(".").reduce((r,n)=>r==null?void 0:r[n],e)}function w(){return q}async function I(e){const t=u.includes(e)?e:"ru",r=await fetch(`${E}locales/${t}.json`);if(!r.ok)throw new Error(`Locale ${t} not found`);m=await r.json(),q=t,document.documentElement.lang=t;try{localStorage.setItem(h,t)}catch{}return m}function S(){try{const t=localStorage.getItem(h);if(t&&u.includes(t))return t}catch{}const e=(navigator.language||"ru").slice(0,2).toLowerCase();return u.includes(e)?e:"ru"}function o(e){const t=_(m,e);return t??e}function M(e=document){e.querySelectorAll("[data-i18n]").forEach(t=>{const r=t.getAttribute("data-i18n"),n=o(r);typeof n=="string"&&(t.textContent=n)}),e.querySelectorAll("[data-i18n-attr]").forEach(t=>{t.getAttribute("data-i18n-attr").split(";").forEach(n=>{const[s,i]=n.split(":").map(l=>l.trim());if(!s||!i)return;const c=o(i);typeof c=="string"&&t.setAttribute(s,c)})})}function B(e){document.querySelectorAll("[data-lang]").forEach(t=>{t.classList.toggle("is-active",t.getAttribute("data-lang")===e)})}const d="/telegram-mini-app/landing/";function T(e,t){return`${d.endsWith("/")?d:`${d}/`}screens/${e}-${t}.png`}const j={"dashboard.period":{id:"dashboard",y:"6%",ratio:"1.55",fit:"cover"},"dashboard.cash":{id:"dashboard",y:"18%",ratio:"1.6",fit:"cover"},"dashboard.goal":{id:"dashboard",y:"38%",ratio:"1.65",fit:"cover"},"capital.summary":{id:"capital",y:"8%",ratio:"1.58",fit:"cover"},"capital.invest":{id:"capital",y:"46%",ratio:"1.55",fit:"cover"},"events.card":{id:"events",y:"50%",ratio:"1.35",fit:"cover"}};function p(e){return"light"}function f(e,t,{alt:r="",className:n="",loading:s="lazy"}={}){const i=j[e];if(!i)return"";const c=T(i.id,t),l=i.fit||"cover",L=i.ratio||"1.6",b=i.y||"50%";return`
    <figure class="${["mq-ui-crop",l==="contain"?"mq-ui-crop--contain":"",n].filter(Boolean).join(" ")}" style="--ui-ratio:${L};--ui-y:${b}">
      <img src="${c}" alt="${H(r)}" loading="${s}" decoding="async" />
    </figure>`}function H(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const v="hello@tvoyhod.app",P="https://avyakunichkin-code.github.io/telegram-mini-app/#/",C="ТВОЙ ХОД — запрос разбора с финансовым советником";function k(){const e=document.getElementById("how-steps");if(!e)return;const t=o("how.steps");Array.isArray(t)&&(e.innerHTML=t.map((r,n)=>`
    <li class="mq-step mq-reveal" style="--mq-delay:${n*80}ms">
      <span class="mq-step__num" aria-hidden="true">${n+1}</span>
      <div>
        <h3>${a(r.title)}</h3>
        <p>${a(r.text)}</p>
      </div>
    </li>`).join(""))}function O(){const e=document.getElementById("audience-cards");if(!e)return;const t=o("audience.cards");Array.isArray(t)&&(e.innerHTML=t.map((r,n)=>`
    <article class="mq-audience-card mq-reveal" style="--mq-delay:${n*70}ms">
      <h3>${a(r.title)}</h3>
      <p>${a(r.text)}</p>
    </article>`).join(""))}function x(){const e=document.getElementById("learn-cards");if(!e)return;const t=o("learn.cards");Array.isArray(t)&&(e.innerHTML=t.map((r,n)=>`
    <article class="mq-card mq-reveal" style="--mq-delay:${n*60}ms">
      <h3>${a(r.title)}</h3>
      <p>${a(r.text)}</p>
    </article>`).join(""))}function y(e){const t=o("peek.screenAlts");return(t==null?void 0:t[e])||""}function N(){const e=document.getElementById("hero-crop-slot");if(!e)return;const t=p();e.innerHTML=f("dashboard.period",t,{alt:y("dashboard.period"),className:"mq-ui-crop--hero",loading:"eager"}),e.removeAttribute("aria-hidden")}function R(){const e=document.getElementById("features-grid");if(!e)return;const t=o("features.showcase");if(!Array.isArray(t))return;const r=p();e.innerHTML=t.map((n,s)=>`
    <article class="mq-showcase__item mq-reveal${s%2===1?" mq-showcase__item--reverse":""}" style="--mq-delay:${s*60}ms">
      <div class="mq-showcase__shot">
        ${f(n.focus,r,{alt:y(n.focus)||n.title,className:"mq-ui-crop--feature"})}
      </div>
      <div class="mq-showcase__copy">
        <h3>${a(n.title)}</h3>
        <p>${a(n.text)}</p>
      </div>
    </article>`).join("")}function U(){const e=document.getElementById("peek-strip");if(!e)return;const t=o("peek.panels");if(!Array.isArray(t))return;const r=p();e.innerHTML=t.map((n,s)=>`
    <article class="mq-screen-card mq-reveal" style="--mq-delay:${s*70}ms">
      ${f(n.focus,r,{alt:y(n.focus)||n.title,className:"mq-ui-crop--strip"})}
      <span class="mq-screen-card__label">${a(n.label)}</span>
      <h3>${a(n.title)}</h3>
      <p>${a(n.text)}</p>
    </article>`).join("")}function F(){const e=document.getElementById("coach-points");if(!e)return;const t=o("coach.points");Array.isArray(t)&&(e.innerHTML=t.map((r,n)=>`<li class="mq-reveal" style="--mq-delay:${n*60}ms">${a(r)}</li>`).join(""))}function D(){const e=document.getElementById("mode-game-points"),t=document.getElementById("mode-plan-points"),r=o("modes.game.points"),n=o("modes.plan.points");e&&Array.isArray(r)&&(e.innerHTML=r.map(s=>`<li>${a(s)}</li>`).join("")),t&&Array.isArray(n)&&(t.innerHTML=n.map(s=>`<li>${a(s)}</li>`).join(""))}function G(){const e=document.getElementById("victory-points");if(!e)return;const t=o("victory.points");Array.isArray(t)&&(e.innerHTML=t.map((r,n)=>`
    <li class="mq-victory__item mq-reveal" style="--mq-delay:${n*70}ms">
      <span class="mq-victory__check" aria-hidden="true">✓</span>
      <span>${a(r)}</span>
    </li>`).join(""))}function K(){const e=document.getElementById("advisor-packages");if(!e)return;const t=o("advisor.packages");Array.isArray(t)&&(e.innerHTML=t.map((r,n)=>`
    <article class="mq-advisor-card mq-reveal" style="--mq-delay:${n*80}ms">
      <span class="mq-advisor-card__badge">${a(r.badge)}</span>
      <h3>${a(r.title)}</h3>
      <p class="mq-advisor-card__price">${a(r.price)}</p>
      <p>${a(r.text)}</p>
    </article>`).join(""))}function V(){const e=document.getElementById("partners-points");if(!e)return;const t=o("partners.points");Array.isArray(t)&&(e.innerHTML=t.map((r,n)=>`
    <article class="mq-partner mq-reveal" style="--mq-delay:${n*70}ms">
      <h3>${a(r.title)}</h3>
      <p>${a(r.text)}</p>
    </article>`).join(""))}function z(){const e=document.getElementById("faq-list");if(!e)return;const t=o("faq.items");Array.isArray(t)&&(e.innerHTML=t.map((r,n)=>`
    <details class="mq-faq__item mq-reveal" style="--mq-delay:${n*40}ms">
      <summary>${a(r.q)}</summary>
      <p>${a(r.a)}</p>
    </details>`).join(""))}function a(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function J(){const e=document.querySelector("[data-contact-href]");e&&e.setAttribute("href",`mailto:${v}`)}function A(){document.querySelectorAll("[data-play-href]").forEach(e=>{e.setAttribute("href",P),e.setAttribute("target","_blank"),e.setAttribute("rel","noopener noreferrer")})}function $(){const e=encodeURIComponent(C),t=`mailto:${v}?subject=${e}`;document.querySelectorAll("[data-advisor-href]").forEach(r=>{r.setAttribute("href",t)})}function W(e){document.querySelectorAll("[data-lang]").forEach(t=>{t.addEventListener("click",()=>{const r=t.getAttribute("data-lang");r&&r!==w()&&e(r)})})}function Y(){const e=document.querySelectorAll(".mq-reveal");if(!e.length)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.forEach(n=>n.classList.add("is-visible"));return}const r=new IntersectionObserver(n=>{n.forEach(s=>{s.isIntersecting&&(s.target.classList.add("is-visible"),r.unobserve(s.target))})},{rootMargin:"0px 0px -8% 0px",threshold:.12});e.forEach(n=>r.observe(n))}async function g(e){await I(e),N(),M(),O(),k(),R(),x(),U(),F(),D(),G(),K(),V(),z(),A(),$(),B(e),Y()}async function Q(){J(),A(),$();const e=S();await g(e),W(g)}Q().catch(e=>{console.error("[landing]",e)});
