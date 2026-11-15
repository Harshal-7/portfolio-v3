/**
 * Light/dark mode. The visitor's own choice (from the bulb) wins, then the default
 * the admin picked, then the device setting. The inline script runs before the
 * first paint, so the page never flashes the wrong theme.
 *
 * The script is a constant: no admin text is ever put inside it. The admin default
 * reaches it through the data-default-mode attribute on <html>.
 */

export const MODE_STORAGE_KEY = "hs-mode";

export const THEME_SCRIPT = `(function(){try{var d=document.documentElement,s=null;try{s=localStorage.getItem("${MODE_STORAGE_KEY}")}catch(e){}var m=s==="light"||s==="dark"?s:d.getAttribute("data-default-mode");if(m!=="light"&&m!=="dark"){m=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.setAttribute("data-mode",m);d.style.colorScheme=m}catch(e){}})()`;
