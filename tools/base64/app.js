"use strict";

(() => {
  const input = document.getElementById("base64-input");
  const output = document.getElementById("base64-output");
  const status = document.getElementById("base64-status");
  const encodeButton = document.getElementById("encode-mode");
  const decodeButton = document.getElementById("decode-mode");
  const sourceLabel = document.getElementById("source-label");
  const resultLabel = document.getElementById("result-label");
  const convertButton = document.getElementById("convert-button");
  const copyButton = document.getElementById("copy-button");
  const MAX_CHARACTERS = 1_000_000;
  let mode = "encode";

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isEncode = mode === "encode";
    encodeButton.setAttribute("aria-pressed", String(isEncode));
    decodeButton.setAttribute("aria-pressed", String(!isEncode));
    sourceLabel.textContent = isEncode ? "النص الأصلي" : "النص بترميز Base64";
    resultLabel.textContent = isEncode ? "الناتج بترميز Base64" : "النص بعد فك الترميز";
    input.placeholder = isEncode ? "اكتب النص هنا" : "الصق Base64 هنا";
    input.dir = isEncode ? "auto" : "ltr";
    input.value = "";
    output.value = "";
    copyButton.disabled = true;
    setStatus("");
    input.focus();
  }

  function encodeUtf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }

  function decodeUtf8(encoded) {
    const normalized = encoded.replace(/[\t\n\r ]/g, "");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  convertButton.addEventListener("click", () => {
    const source = input.value;
    if (source.length > MAX_CHARACTERS) {
      output.value = "";
      copyButton.disabled = true;
      setStatus("النص أطول من الحد المسموح (مليون محرف).", "error");
      return;
    }
    try {
      output.value = mode === "encode" ? encodeUtf8(source) : decodeUtf8(source);
      copyButton.disabled = output.value.length === 0;
      setStatus(mode === "encode" ? "تم ترميز النص." : "تم فك الترميز بنجاح.", "success");
    } catch {
      output.value = "";
      copyButton.disabled = true;
      setStatus(mode === "encode" ? "تعذر ترميز النص." : "النص ليس Base64 صالحًا أو لا يحتوي على UTF-8 صحيح.", "error");
    }
  });

  encodeButton.addEventListener("click", () => setMode("encode"));
  decodeButton.addEventListener("click", () => setMode("decode"));
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
