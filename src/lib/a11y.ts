export type Cvd = "none" | "protan" | "deutan" | "tritan" | "mono";
export type A11y = { cvd: Cvd; audio: boolean; largeText: boolean; rate: number };
const KEY = "triantena-a11y";
export const defaultA11y: A11y = { cvd: "none", audio: false, largeText: false, rate: 1 };

export function loadA11y(): A11y {
  try { return { ...defaultA11y, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return defaultA11y; }
}

let handler: ((e: Event) => void) | null = null;
let last = "";

export function speak(text: string, rate = 1) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

export function applyA11y(s: A11y) {
  const html = document.documentElement;
  if (s.cvd === "none") html.removeAttribute("data-cvd"); else html.setAttribute("data-cvd", s.cvd);
  html.setAttribute("data-large-text", String(s.largeText));
  localStorage.setItem(KEY, JSON.stringify(s));
  if (handler) { document.removeEventListener("focusin", handler); document.removeEventListener("mouseover", handler); handler = null; }
  if (s.audio) {
    handler = (e) => {
      const el = (e.target as HTMLElement)?.closest("button,a,h1,h2,h3,td,th,label,li,[aria-label],p") as HTMLElement | null;
      if (!el) return;
      const text = (el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 200);
      if (text && text !== last) { last = text; speak(text, s.rate); }
    };
    document.addEventListener("focusin", handler);
    document.addEventListener("mouseover", handler);
  } else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
