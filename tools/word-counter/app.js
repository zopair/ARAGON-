"use strict";

(() => {
  const input = document.getElementById("counter-input");
  const wordCount = document.getElementById("words-count");
  const charCount = document.getElementById("chars-count");
  const charNoSpaces = document.getElementById("chars-no-spaces");
  const paragraphCount = document.getElementById("paragraphs-count");
  const copyButton = document.getElementById("copy-button");
  const status = document.getElementById("counter-status");
  const wordSegmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "word" })
    : null;
  const graphemeSegmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

  function countWords(text) {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    if (wordSegmenter) {
      let count = 0;
      for (const part of wordSegmenter.segment(text)) {
        if (part.isWordLike) count += 1;
      }
      return count;
    }
    return (trimmed.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
  }

  function countCharacters(text) {
    if (graphemeSegmenter) {
      let count = 0;
      for (const _part of graphemeSegmenter.segment(text)) count += 1;
      return count;
    }
    return Array.from(text).length;
  }

  function update() {
    const text = input.value;
    const trimmed = text.trim();
    const paragraphs = trimmed ? trimmed.split(/(?:\r?\n)[\t \u00a0\r\n]*(?:\r?\n)+/u).filter((part) => part.trim()).length : 0;
    wordCount.textContent = String(countWords(text));
    charCount.textContent = String(countCharacters(text));
    charNoSpaces.textContent = String(countCharacters(text.replace(/[\s\p{Z}]/gu, "")));
    paragraphCount.textContent = String(paragraphs);
    copyButton.disabled = text.length === 0;
    status.textContent = "";
    status.dataset.kind = "";
  }

  input.addEventListener("input", update);
  copyButton.addEventListener("click", async () => {
    try {
      await window.ARAGON.copyText(input.value);
      status.textContent = "تم نسخ النص.";
      status.dataset.kind = "success";
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "تعذر النسخ.";
      status.dataset.kind = "error";
    }
  });
  document.getElementById("clear-button").addEventListener("click", () => {
    input.value = "";
    update();
    status.textContent = "تم مسح النص.";
    status.dataset.kind = "success";
    input.focus();
  });
  update();
})();
