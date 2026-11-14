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

  document.querySelectorAll("[data-copy-address]").forEach((button) => {
    button.addEventListener("click", async () => {
      const status = button.closest("[data-address-card]")?.querySelector("[data-copy-status]");
      if (!status) return;
      status.dataset.kind = "";
      try {
        await copyText(button.dataset.copyAddress);
        status.textContent = "تم نسخ العنوان. راجع الشبكة قبل الإرسال.";
        status.dataset.kind = "success";
      } catch (error) {
        status.textContent = error?.message || "تعذر النسخ؛ انسخ العنوان يدويًا.";
        status.dataset.kind = "error";
      }
    });
  });

  window.ARAGON = Object.freeze({ copyText });
})();
