(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();const h="mq-landing-lang",u=["ru","en"],A="/telegram-mini-app/landing/";let m={},q="ru";function L(e,t){return t.split(".").reduce((n,r)=>n==null?void 0:n[r],e)}function b(){return q}async function E(e){const t=u.includes(e)?e:"ru",n=await fetch(`${A}locales/${t}.json`);if(!n.ok)throw new Error(`Locale ${t} not found`);m=await n.json(),q=t,document.documentElement.lang=t;try{localStorage.setItem(h,t)}catch{}return m}function w(){try{const t=localStorage.getItem(h);if(t&&u.includes(t))return t}catch{}const e=(navigator.language||"ru").slice(0,2).toLowerCase();return u.includes(e)?e:"ru"}function o(e){const t=L(m,e);return t??e}function _(e=document){e.querySelectorAll("[data-i18n]").forEach(t=>{const n=t.getAttribute("data-i18n"),r=o(n);typeof r=="string"&&(t.textContent=r)}),e.querySelectorAll("[data-i18n-attr]").forEach(t=>{t.getAttribute("data-i18n-attr").split(";").forEach(r=>{const[s,i]=r.split(":").map(l=>l.trim());if(!s||!i)return;const c=o(i);typeof c=="string"&&t.setAttribute(s,c)})})}function I(e){document.querySelectorAll("[data-lang]").forEach(t=>{t.classList.toggle("is-active",t.getAttribute("data-lang")===e)})}const d="/telegram-mini-app/landing/";function S(e,t){return`${d.endsWith("/")?d:`${d}/`}screens/${e}-${t}.png`}const B={"dashboard.period":{id:"dashboard",y:"6%",ratio:"1.55",fit:"cover"},"dashboard.cash":{id:"dashboard",y:"18%",ratio:"1.6",fit:"cover"},"dashboard.goal":{id:"dashboard",y:"38%",ratio:"1.65",fit:"cover"},"capital.summary":{id:"capital",y:"8%",ratio:"1.58",fit:"cover"},"capital.invest":{id:"capital",y:"46%",ratio:"1.55",fit:"cover"},"events.card":{id:"events",y:"50%",ratio:"1.35",fit:"cover"}};function p(e){return"light"}function f(e,t,{alt:n="",className:r="",loading:s="lazy"}={}){const i=B[e];if(!i)return"";const c=S(i.id,t),l=i.fit||"cover",v=i.ratio||"1.6",$=i.y||"50%";return`
    <figure class="${["mq-ui-crop",l==="contain"?"mq-ui-crop--contain":"",r].filter(Boolean).join(" ")}" style="--ui-ratio:${v};--ui-y:${$}">
      <img src="${c}" alt="${M(n)}" loading="${s}" decoding="async" />
    </figure>`}function M(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const H="hello@tvoyhod.app";function T(){const e=document.getElementById("how-steps");if(!e)return;const t=o("how.steps");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <li class="mq-step mq-reveal" style="--mq-delay:${r*80}ms">
      <span class="mq-step__num" aria-hidden="true">${r+1}</span>
      <div>
        <h3>${a(n.title)}</h3>
        <p>${a(n.text)}</p>
      </div>
    </li>`).join(""))}function j(){const e=document.getElementById("learn-cards");if(!e)return;const t=o("learn.cards");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <article class="mq-card mq-reveal" style="--mq-delay:${r*60}ms">
      <h3>${a(n.title)}</h3>
      <p>${a(n.text)}</p>
    </article>`).join(""))}function y(e){const t=o("peek.screenAlts");return(t==null?void 0:t[e])||""}function P(){const e=document.getElementById("hero-crop-slot");if(!e)return;const t=p();e.innerHTML=f("dashboard.period",t,{alt:y("dashboard.period"),className:"mq-ui-crop--hero",loading:"eager"}),e.removeAttribute("aria-hidden")}function O(){const e=document.getElementById("features-grid");if(!e)return;const t=o("features.showcase");if(!Array.isArray(t))return;const n=p();e.innerHTML=t.map((r,s)=>`
    <article class="mq-showcase__item mq-reveal${s%2===1?" mq-showcase__item--reverse":""}" style="--mq-delay:${s*60}ms">
      <div class="mq-showcase__shot">
        ${f(r.focus,n,{alt:y(r.focus)||r.title,className:"mq-ui-crop--feature"})}
      </div>
      <div class="mq-showcase__copy">
        <h3>${a(r.title)}</h3>
        <p>${a(r.text)}</p>
      </div>
    </article>`).join("")}function C(){const e=document.getElementById("peek-strip");if(!e)return;const t=o("peek.panels");if(!Array.isArray(t))return;const n=p();e.innerHTML=t.map((r,s)=>`
    <article class="mq-screen-card mq-reveal" style="--mq-delay:${s*70}ms">
      ${f(r.focus,n,{alt:y(r.focus)||r.title,className:"mq-ui-crop--strip"})}
      <span class="mq-screen-card__label">${a(r.label)}</span>
      <h3>${a(r.title)}</h3>
      <p>${a(r.text)}</p>
    </article>`).join("")}function x(){const e=document.getElementById("coach-points");if(!e)return;const t=o("coach.points");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`<li class="mq-reveal" style="--mq-delay:${r*60}ms">${a(n)}</li>`).join(""))}function N(){const e=document.getElementById("mode-game-points"),t=document.getElementById("mode-plan-points"),n=o("modes.game.points"),r=o("modes.plan.points");e&&Array.isArray(n)&&(e.innerHTML=n.map(s=>`<li>${a(s)}</li>`).join("")),t&&Array.isArray(r)&&(t.innerHTML=r.map(s=>`<li>${a(s)}</li>`).join(""))}function k(){const e=document.getElementById("victory-points");if(!e)return;const t=o("victory.points");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <li class="mq-victory__item mq-reveal" style="--mq-delay:${r*70}ms">
      <span class="mq-victory__check" aria-hidden="true">✓</span>
      <span>${a(n)}</span>
    </li>`).join(""))}function F(){const e=document.getElementById("partners-points");if(!e)return;const t=o("partners.points");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <article class="mq-partner mq-reveal" style="--mq-delay:${r*70}ms">
      <h3>${a(n.title)}</h3>
      <p>${a(n.text)}</p>
    </article>`).join(""))}function R(){const e=document.getElementById("faq-list");if(!e)return;const t=o("faq.items");Array.isArray(t)&&(e.innerHTML=t.map((n,r)=>`
    <details class="mq-faq__item mq-reveal" style="--mq-delay:${r*40}ms">
      <summary>${a(n.q)}</summary>
      <p>${a(n.a)}</p>
    </details>`).join(""))}function a(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function U(){const e=document.querySelector("[data-contact-href]");e&&e.setAttribute("href",`mailto:${H}`)}function D(e){document.querySelectorAll("[data-lang]").forEach(t=>{t.addEventListener("click",()=>{const n=t.getAttribute("data-lang");n&&n!==b()&&e(n)})})}function K(){const e=document.querySelectorAll(".mq-reveal");if(!e.length)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.forEach(r=>r.classList.add("is-visible"));return}const n=new IntersectionObserver(r=>{r.forEach(s=>{s.isIntersecting&&(s.target.classList.add("is-visible"),n.unobserve(s.target))})},{rootMargin:"0px 0px -8% 0px",threshold:.12});e.forEach(r=>n.observe(r))}async function g(e){await E(e),P(),_(),T(),O(),j(),C(),x(),N(),k(),F(),R(),I(e),K()}async function z(){U();const e=w();await g(e),D(g)}z().catch(e=>{console.error("[landing]",e)});
