/** Theme constants, safe to import from server components. */

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "vk-theme";
export const THEME_COLORS: Record<Theme, string> = { dark: "#050505", light: "#f4f1ec" };

/**
 * Runs in <head> before first paint, so a returning visitor never sees the
 * wrong theme flash. Dark is the default.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t="dark";var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"${THEME_COLORS.light}":"${THEME_COLORS.dark}")}catch(e){}})();`;

