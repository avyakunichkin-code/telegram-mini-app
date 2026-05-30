(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function n(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(i){if(i.ep)return;i.ep=!0;const s=n(i);fetch(i.href,s)}})();const h="mq-landing-lang",u=["ru","en"],L="/telegram-mini-app/landing/";let m={},q="ru";function b(e,t){return t.split(".").reduce((n,r)=>n==null?void 0:n[r],e)}function E(){return q}async function w(e){const t=u.includes(e)?e:"ru",n=await fetch(`${L}locales/${t}.json`);if(!n.ok)throw new Error(`Locale ${t} not found`);m=await n.json(),q=t,document.documentElement.lang=t;try{localStorage.setItem(h,t)}catch{}return m}function _(){try{const t=localStorage.getItem(h);if(t&&u.includes(t))return t}catch{}const e=(navigator.language||"ru").slice(0,2).toLowerCase();return u.includes(e)?e:"ru"}function o(e){const t=b(m,e);return t??e}function I(e=document){e.querySelectorAll("[data-i18n]").forEach(t=>{const n=t.getAttribute("data-i18n"),r=o(n);typeof r=="string"&&(t.textContent=r)}),e.querySelectorAll("[data-i18n-attr]").forEach(t=>{t.getAttribute("data-i18n-attr").split(";").forEach(r=>{const[i,s]=r.split(":").map(l=>l.trim());if(!i||!s)return;const c=o(s);typeof c=="string"&&t.setAttribute(i,c)})})}function S(e){document.querySelectorAll("[data-lang]").forEach(t=>{t.classList.toggle("is-active",t.getAttribute("data-lang")===e)})}const d="/telegram-mini-app/landing/";function M(e,t){return`${d.endsWith("/")?d:`${d}/`}screens/${e}-${t}.png`}const B={"dashboard.period":{id:"dashboard",y:"6%",ratio:"1.55",fit:"cover"},"dashboard.cash":{id:"dashboard",y:"18%",ratio:"1.6",fit:"cover"},"dashboard.goal":{id:"dashboard",y:"38%",ratio:"1.65",fit:"cover"},"capital.summary":{id:"capital",y:"8%",ratio:"1.58",fit:"cover"},"capital.invest":{id:"capital",y:"46%",ratio:"1.55",fit:"cover"},"events.card":{id:"events",y:"50%",ratio:"1.35",fit:"cover"}};function p(e){return"light"}function f(e,t,{alt:n="",className:r="",loading:i="lazy"}={}){const s=B[e];if(!s)return"";const c=M(s.id,t),l=s.fit||"cover",A=s.ratio||"1.6",$=s.y||"50%";return`
    <figure class="${["mq-ui-crop",l==="contain"?"mq-ui-crop--contain":"",r].filter(Boolean).join(" ")}" style="--ui-ratio:${A};--ui-y:${$}">
      <img src="${c}" alt="${H(n)}" loading="${i}" decoding="async" />
    </figure>`}function H(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const T="hello@tvoyhod.app",j="https://avyakunichkin-code.github.io/telegram-mini-app/#/";function P(){const e=document.getElementById("how-steps");if(!e)return;const t=o("how.steps");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <li class="mq-step mq-reveal" style="--mq-delay:${r*80}ms">
      <span class="mq-step__num" aria-hidden="true">${r+1}</span>
      <div>
        <h3>${a(n.title)}</h3>
        <p>${a(n.text)}</p>
      </div>
    </li>`).join(""))}function C(){const e=document.getElementById("audience-cards");if(!e)return;const t=o("audience.cards");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <article class="mq-audience-card mq-reveal" style="--mq-delay:${r*70}ms">
      <h3>${a(n.title)}</h3>
      <p>${a(n.text)}</p>
    </article>`).join(""))}function O(){const e=document.getElementById("learn-cards");if(!e)return;const t=o("learn.cards");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <article class="mq-card mq-reveal" style="--mq-delay:${r*60}ms">
      <h3>${a(n.title)}</h3>
      <p>${a(n.text)}</p>
    </article>`).join(""))}function y(e){const t=o("peek.screenAlts");return(t==null?void 0:t[e])||""}function k(){const e=document.getElementById("hero-crop-slot");if(!e)return;const t=p();e.innerHTML=f("dashboard.period",t,{alt:y("dashboard.period"),className:"mq-ui-crop--hero",loading:"eager"}),e.removeAttribute("aria-hidden")}function x(){const e=document.getElementById("features-grid");if(!e)return;const t=o("features.showcase");if(!Array.isArray(t))return;const n=p();e.innerHTML=t.map((r,i)=>`
    <article class="mq-showcase__item mq-reveal${i%2===1?" mq-showcase__item--reverse":""}" style="--mq-delay:${i*60}ms">
      <div class="mq-showcase__shot">
        ${f(r.focus,n,{alt:y(r.focus)||r.title,className:"mq-ui-crop--feature"})}
      </div>
      <div class="mq-showcase__copy">
        <h3>${a(r.title)}</h3>
        <p>${a(r.text)}</p>
      </div>
    </article>`).join("")}function N(){const e=document.getElementById("peek-strip");if(!e)return;const t=o("peek.panels");if(!Array.isArray(t))return;const n=p();e.innerHTML=t.map((r,i)=>`
    <article class="mq-screen-card mq-reveal" style="--mq-delay:${i*70}ms">
      ${f(r.focus,n,{alt:y(r.focus)||r.title,className:"mq-ui-crop--strip"})}
      <span class="mq-screen-card__label">${a(r.label)}</span>
      <h3>${a(r.title)}</h3>
      <p>${a(r.text)}</p>
    </article>`).join("")}function F(){const e=document.getElementById("coach-points");if(!e)return;const t=o("coach.points");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`<li class="mq-reveal" style="--mq-delay:${r*60}ms">${a(n)}</li>`).join(""))}function R(){const e=document.getElementById("mode-game-points"),t=document.getElementById("mode-plan-points"),n=o("modes.game.points"),r=o("modes.plan.points");e&&Array.isArray(n)&&(e.innerHTML=n.map(i=>`<li>${a(i)}</li>`).join("")),t&&Array.isArray(r)&&(t.innerHTML=r.map(i=>`<li>${a(i)}</li>`).join(""))}function U(){const e=document.getElementById("victory-points");if(!e)return;const t=o("victory.points");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <li class="mq-victory__item mq-reveal" style="--mq-delay:${r*70}ms">
      <span class="mq-victory__check" aria-hidden="true">✓</span>
      <span>${a(n)}</span>
    </li>`).join(""))}function D(){const e=document.getElementById("partners-points");if(!e)return;const t=o("partners.points");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <article class="mq-partner mq-reveal" style="--mq-delay:${r*70}ms">
      <h3>${a(n.title)}</h3>
      <p>${a(n.text)}</p>
    </article>`).join(""))}function G(){const e=document.getElementById("faq-list");if(!e)return;const t=o("faq.items");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <details class="mq-faq__item mq-reveal" style="--mq-delay:${r*40}ms">
      <summary>${a(n.q)}</summary>
      <p>${a(n.a)}</p>
    </details>`).join(""))}function a(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function K(){const e=document.querySelector("[data-contact-href]");e&&e.setAttribute("href",`mailto:${T}`)}function v(){document.querySelectorAll("[data-play-href]").forEach(e=>{e.setAttribute("href",j),e.setAttribute("target","_blank"),e.setAttribute("rel","noopener noreferrer")})}function z(e){document.querySelectorAll("[data-lang]").forEach(t=>{t.addEventListener("click",()=>{const n=t.getAttribute("data-lang");n&&n!==E()&&e(n)})})}function V(){const e=document.querySelectorAll(".mq-reveal");if(!e.length)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.forEach(r=>r.classList.add("is-visible"));return}const n=new IntersectionObserver(r=>{r.forEach(i=>{i.isIntersecting&&(i.target.classList.add("is-visible"),n.unobserve(i.target))})},{rootMargin:"0px 0px -8% 0px",threshold:.12});e.forEach(r=>n.observe(r))}async function g(e){await w(e),k(),I(),C(),P(),x(),O(),N(),F(),R(),U(),D(),G(),v(),S(e),V()}async function W(){K(),v();const e=_();await g(e),z(g)}W().catch(e=>{console.error("[landing]",e)});
