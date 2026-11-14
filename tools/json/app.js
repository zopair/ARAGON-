"use strict";

(() => {
  const input = document.getElementById("json-input");
  const output = document.getElementById("json-output");
  const indent = document.getElementById("indent-size");
  const status = document.getElementById("json-status");
  const copyButton = document.getElementById("copy-button");
  const MAX_CHARACTERS = 1_000_000;

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function serialize(compact) {
    const source = input.value;
    if (!source.trim()) {
      output.value = "";
      copyButton.disabled = true;
      setStatus("أدخل JSON أولًا.", "error");
      input.focus();
      return;
    }
    if (source.length > MAX_CHARACTERS) {
      output.value = "";
      copyButton.disabled = true;
      setStatus("النص أطول من الحد المسموح (مليون محرف).", "error");
      return;
    }
    try {
      const parsed = JSON.parse(source);
      const spacing = compact ? 0 : indent.value === "tab" ? "\t" : Number(indent.value);
      output.value = JSON.stringify(parsed, null, spacing);
      copyButton.disabled = output.value.length === 0;
      setStatus(compact ? "تم التحقق وتصغير JSON." : "JSON صالح وتم تنسيقه.", "success");
    } catch (error) {
      output.value = "";
      copyButton.disabled = true;
      const detail = error instanceof Error ? error.message : "خطأ غير معروف";
      setStatus(`JSON غير صالح: ${detail}`, "error");
    }
  }

  document.getElementById("format-button").addEventListener("click", () => serialize(false));
  document.getElementById("minify-button").addEventListener("click", () => serialize(true));
  copyButton.addEventListener("click", async () => {
    try {
      await window.ARAGON.copyText(output.value);
      setStatus("تم نسخ الناتج.", "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "تعذر النسخ.", "error");
    }
  });
  document.getElementById("clear-button").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    copyButton.disabled = true;
    setStatus("تم مسح الحقول.", "success");
    input.focus();
  });
})();
