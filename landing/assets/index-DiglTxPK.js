(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function r(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=r(n);fetch(n.href,i)}})();const m="mq-landing-lang",l=["ru","en"],g="/telegram-mini-app/landing/";let d={},f="ru";function h(e,t){return t.split(".").reduce((r,s)=>r==null?void 0:r[s],e)}function q(){return f}async function A(e){const t=l.includes(e)?e:"ru",r=await fetch(`${g}locales/${t}.json`);if(!r.ok)throw new Error(`Locale ${t} not found`);d=await r.json(),f=t,document.documentElement.lang=t;try{localStorage.setItem(m,t)}catch{}return d}function v(){try{const t=localStorage.getItem(m);if(t&&l.includes(t))return t}catch{}const e=(navigator.language||"ru").slice(0,2).toLowerCase();return l.includes(e)?e:"ru"}function o(e){const t=h(d,e);return t??e}function $(e=document){e.querySelectorAll("[data-i18n]").forEach(t=>{const r=t.getAttribute("data-i18n"),s=o(r);typeof s=="string"&&(t.textContent=s)}),e.querySelectorAll("[data-i18n-attr]").forEach(t=>{t.getAttribute("data-i18n-attr").split(";").forEach(s=>{const[n,i]=s.split(":").map(y=>y.trim());if(!n||!i)return;const c=o(i);typeof c=="string"&&t.setAttribute(n,c)})})}function L(e){document.querySelectorAll("[data-lang]").forEach(t=>{t.classList.toggle("is-active",t.getAttribute("data-lang")===e)})}function p(e,t){return`/screens/${e}-${t}.png`}const w="hello@moneyquest.app";function E(){const e=document.getElementById("how-steps");if(!e)return;const t=o("how.steps");Array.isArray(t)&&(e.innerHTML=t.map((r,s)=>`
    <li class="mq-step mq-reveal" style="--mq-delay:${s*80}ms">
      <span class="mq-step__num" aria-hidden="true">${s+1}</span>
      <div>
        <h3>${a(r.title)}</h3>
        <p>${a(r.text)}</p>
      </div>
    </li>`).join(""))}function _(){const e=document.getElementById("learn-cards");if(!e)return;const t=o("learn.cards");Array.isArray(t)&&(e.innerHTML=t.map((r,s)=>`
    <article class="mq-card mq-reveal" style="--mq-delay:${s*60}ms">
      <h3>${a(r.title)}</h3>
      <p>${a(r.text)}</p>
    </article>`).join(""))}function b(){const e=document.getElementById("features-grid");if(!e)return;const t=o("features.showcase");if(!Array.isArray(t))return;const r=o("peek.screens"),s="light";e.innerHTML=t.map((n,i)=>`
    <article class="mq-showcase__item mq-reveal${i%2===1?" mq-showcase__item--reverse":""}" style="--mq-delay:${i*60}ms">
      <figure class="mq-showcase__shot">
        <div class="mq-device__bezel">
          <img src="${p(n.screen,s)}" width="320" height="640" alt="${a((r==null?void 0:r[n.screen])||n.title)}" loading="lazy" decoding="async" />
        </div>
      </figure>
      <div class="mq-showcase__copy">
        <h3>${a(n.title)}</h3>
        <p>${a(n.text)}</p>
      </div>
    </article>`).join("")}function S(){const e=document.getElementById("peek-strip");if(!e)return;const t=o("peek.panels");if(!Array.isArray(t))return;const r=o("peek.screens"),s="light";e.innerHTML=t.map((n,i)=>`
    <article class="mq-screen-card mq-reveal" style="--mq-delay:${i*70}ms">
      <div class="mq-screen-card__frame">
        <img src="${p(n.screen,s)}" width="304" height="608" alt="${a((r==null?void 0:r[n.screen])||n.title)}" loading="lazy" decoding="async" />
      </div>
      <span class="mq-screen-card__label">${a(n.label)}</span>
      <h3>${a(n.title)}</h3>
      <p>${a(n.text)}</p>
    </article>`).join("")}function I(){const e=document.getElementById("coach-points");if(!e)return;const t=o("coach.points");Array.isArray(t)&&(e.innerHTML=t.map((r,s)=>`<li class="mq-reveal" style="--mq-delay:${s*60}ms">${a(r)}</li>`).join(""))}function M(){const e=document.getElementById("mode-game-points"),t=document.getElementById("mode-plan-points"),r=o("modes.game.points"),s=o("modes.plan.points");e&&Array.isArray(r)&&(e.innerHTML=r.map(n=>`<li>${a(n)}</li>`).join("")),t&&Array.isArray(s)&&(t.innerHTML=s.map(n=>`<li>${a(n)}</li>`).join(""))}function T(){const e=document.getElementById("victory-points");if(!e)return;const t=o("victory.points");Array.isArray(t)&&(e.innerHTML=t.map((r,s)=>`
    <li class="mq-victory__item mq-reveal" style="--mq-delay:${s*70}ms">
      <span class="mq-victory__check" aria-hidden="true">✓</span>
      <span>${a(r)}</span>
    </li>`).join(""))}function B(){const e=document.getElementById("partners-points");if(!e)return;const t=o("partners.points");Array.isArray(t)&&(e.innerHTML=t.map((r,s)=>`
    <article class="mq-partner mq-reveal" style="--mq-delay:${s*70}ms">
      <h3>${a(r.title)}</h3>
      <p>${a(r.text)}</p>
    </article>`).join(""))}function P(){const e=document.getElementById("faq-list");if(!e)return;const t=o("faq.items");Array.isArray(t)&&(e.innerHTML=t.map((r,s)=>`
    <details class="mq-faq__item mq-reveal" style="--mq-delay:${s*40}ms">
      <summary>${a(r.q)}</summary>
      <p>${a(r.a)}</p>
    </details>`).join(""))}function a(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function j(){const e=document.querySelector("[data-contact-href]");e&&e.setAttribute("href",`mailto:${w}`)}function H(e){document.querySelectorAll("[data-lang]").forEach(t=>{t.addEventListener("click",()=>{const r=t.getAttribute("data-lang");r&&r!==q()&&e(r)})})}function O(){const e=document.querySelectorAll(".mq-reveal");if(!e.length)return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.forEach(s=>s.classList.add("is-visible"));return}const r=new IntersectionObserver(s=>{s.forEach(n=>{n.isIntersecting&&(n.target.classList.add("is-visible"),r.unobserve(n.target))})},{rootMargin:"0px 0px -8% 0px",threshold:.12});e.forEach(s=>r.observe(s))}function x(){const e=o("peek.screens");if(!e)return;document.querySelectorAll("[data-screen-id]").forEach(s=>{const n=s.getAttribute("data-screen-id");n&&e[n]&&s.setAttribute("alt",e[n])});const t=document.querySelector(".mq-device__shot");t&&e.dashboard&&t.setAttribute("alt",e.dashboard);const r=document.querySelector(".mq-inline-shot img");r&&e.dashboard&&r.setAttribute("alt",e.dashboard)}async function u(e){await A(e),$(),x(),E(),b(),_(),S(),I(),M(),T(),B(),P(),L(e),O()}async function k(){j();const e=v();await u(e),H(u)}k().catch(e=>{console.error("[landing]",e)});
