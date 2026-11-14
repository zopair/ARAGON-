"use strict";

(() => {
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = year;
  });

  async function copyText(text) {
    if (typeof text !== "string" || text.length === 0) {
      throw new Error("لا يوجد نص لنسخه.");
    }
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      throw new Error("النسخ غير متاح في هذا السياق. افتح الموقع عبر HTTPS ثم أعد المحاولة.");
    }
    await navigator.clipboard.writeText(text);
  }

  window.ARAGON = Object.freeze({ copyText });
})();
