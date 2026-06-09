// QueryDesk (public, static) — Clerk-gated entry point.
//
// Clerk is hotloaded as the prebuilt browser bundle (which includes the
// component UI). The npm @clerk/clerk-js v6 splits the UI into a separate
// bundle that a plain Vite import doesn't include, so we load clerk.browser.js
// from this instance's Frontend API domain (derived from the publishable key).
//
// Next: supabase.js (synced streams) + the sidebar / add-paper UI.
import "./style.css";
import { mountApp } from "./app.js";

const PK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const main = document.getElementById("main");
const authEl = document.getElementById("auth-controls");

function fail(msg) {
  main.innerHTML = `<p style="color:#c23a3a;max-width:560px;margin:8vh auto">${msg}</p>`;
  throw new Error(msg);
}
if (!PK) fail("Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local");

// Frontend API domain is base64-encoded in the publishable key: "<domain>$".
function frontendApi(pk) {
  const b64 = pk.replace(/^pk_(test|live)_/, "");
  return atob(b64).replace(/\$+$/, "");
}

// The app's own URL (directory of the current page). On GitHub Pages project
// sites this is "/is-querydesk-web/", on localhost "/". Clerk must redirect
// back here after sign-in / sign-out, otherwise it lands on "/" (the github.io
// root) which 404s for a subpath deployment.
const APP_ROOT = location.pathname.replace(/[^/]*$/, "");

let appMounted = false;

function render() {
  const clerk = window.Clerk;
  if (clerk.user) {
    authEl.replaceChildren();
    const ub = document.createElement("div");
    authEl.append(ub);
    clerk.mountUserButton(ub, { afterSignOutUrl: APP_ROOT });
    showApp();
  } else {
    appMounted = false;
    authEl.replaceChildren();
    main.replaceChildren();
    const view = document.createElement("div");
    view.className = "auth-view";
    const hero = document.createElement("div");
    hero.className = "hero";
    hero.innerHTML = `<h1>Search the IS corpus by meaning</h1>
      <p>Sign in to search <b>81,399</b> abstract-bearing papers across IS
      journals, conferences and preprints — ranked by meaning, right in your browser.</p>`;
    const wrap = document.createElement("div");
    wrap.className = "signin-wrap";
    view.append(hero, wrap);
    main.append(view);
    clerk.mountSignIn(wrap, { fallbackRedirectUrl: APP_ROOT });
  }
}

function showApp() {
  if (appMounted) return;
  appMounted = true;
  main.replaceChildren();
  mountApp(main);
}

const script = document.createElement("script");
script.async = true;
script.crossOrigin = "anonymous";
script.setAttribute("data-clerk-publishable-key", PK);
script.src = `https://${frontendApi(PK)}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
script.addEventListener("load", async () => {
  try {
    await window.Clerk.load({
      afterSignOutUrl: APP_ROOT,
      signInFallbackRedirectUrl: APP_ROOT,
      signUpFallbackRedirectUrl: APP_ROOT,
    });
    render();
    window.Clerk.addListener(() => render());
  } catch (e) {
    fail("Clerk failed to load: " + e.message);
  }
});
script.addEventListener("error", () => fail("Could not load Clerk from " + frontendApi(PK)));
document.head.appendChild(script);
