"use strict";

(() => {
  const output = document.getElementById("password-output");
  const lengthInput = document.getElementById("password-length");
  const lengthDescription = document.getElementById("length-description");
  const lengthBar = document.getElementById("length-bar");
  const status = document.getElementById("password-status");
  const copyButton = document.getElementById("copy-button");
  const characters = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?"
  };
  const ambiguous = /[O0Il1]/g;

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function secureRandomInt(maxExclusive) {
    if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 0x100000000) {
      throw new RangeError("نطاق عشوائي غير صالح.");
    }
    if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
      throw new Error("مولّد الأرقام الآمن غير متاح. افتح الصفحة عبر HTTPS أو على localhost.");
    }
    const range = 0x100000000;
    const limit = range - (range % maxExclusive);
    const value = new Uint32Array(1);
    do {
      globalThis.crypto.getRandomValues(value);
    } while (value[0] >= limit);
    return value[0] % maxExclusive;
  }

  function chooseCharacter(pool) {
    return pool[secureRandomInt(pool.length)];
  }

  function updateLengthDescription() {
    const value = Number(lengthInput.value);
    const valid = Number.isInteger(value) && value >= 8 && value <= 128;
    lengthDescription.textContent = valid ? `${value} محرفًا` : "أدخل طولًا بين 8 و128";
    lengthDescription.dataset.kind = valid ? "" : "error";
    lengthBar.style.width = valid ? `${Math.round((value / 128) * 100)}%` : "0%";
  }

  lengthInput.addEventListener("input", updateLengthDescription);
  document.getElementById("generate-button").addEventListener("click", () => {
    const length = Number(lengthInput.value);
    if (!Number.isInteger(length) || length < 8 || length > 128) {
      output.value = "";
      copyButton.disabled = true;
      setStatus("اختر طولًا صحيحًا بين 8 و128.", "error");
      lengthInput.focus();
      return;
    }

    const excludeAmbiguous = document.getElementById("exclude-ambiguous").checked;
    const selected = Object.keys(characters)
      .filter((key) => document.getElementById(key).checked)
      .map((key) => excludeAmbiguous ? characters[key].replace(ambiguous, "") : characters[key])
      .filter((pool) => pool.length > 0);

    if (selected.length === 0) {
      output.value = "";
      copyButton.disabled = true;
      setStatus("اختر مجموعة محارف واحدة على الأقل.", "error");
      return;
    }

    try {
      const allCharacters = selected.join("");
      const result = selected.map(chooseCharacter);
      while (result.length < length) result.push(chooseCharacter(allCharacters));
      for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = secureRandomInt(index + 1);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
      }
      output.value = result.join("");
      copyButton.disabled = false;
      setStatus("تم إنشاء كلمة المرور محليًا. احفظها في مدير كلمات مرور موثوق.", "success");
    } catch (error) {
      output.value = "";
      copyButton.disabled = true;
      setStatus(error instanceof Error ? error.message : "تعذر إنشاء كلمة المرور.", "error");
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await window.ARAGON.copyText(output.value);
      setStatus("تم نسخ كلمة المرور. احرص على عدم مشاركتها.", "success");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "تعذر النسخ.", "error");
    }
  });

  document.getElementById("clear-button").addEventListener("click", () => {
    output.value = "";
    copyButton.disabled = true;
    setStatus("تم مسح كلمة المرور من الصفحة.", "success");
    document.getElementById("generate-button").focus();
  });
  updateLengthDescription();
})();
