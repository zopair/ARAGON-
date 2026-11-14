import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

class FakeElement {
  constructor(id) {
    this.id = id;
    this.value = "";
    this.disabled = false;
    this.checked = true;
    this.dataset = {};
    this.style = {};
    this.listeners = new Map();
    this.attributes = new Map();
  }
  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  focus() {}
  async dispatch(type) {
    const callback = this.listeners.get(type);
    if (callback) return callback({ target: this });
  }
}

function mountTool(toolName) {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    }
  };
  const copied = [];
  const window = { ARAGON: { copyText: async (text) => copied.push(text) } };
  const source = readFileSync(resolve(root, "tools", toolName, "app.js"), "utf8");
  runInNewContext(source, {
    document,
    window,
    navigator: {},
    crypto: webcrypto,
    btoa,
    atob,
    TextEncoder,
    TextDecoder,
    Intl
  }, { filename: `${toolName}/app.js` });
  return { elements, copied };
}

const json = mountTool("json");
json.elements.get("indent-size").value = "2";
json.elements.get("json-input").value = '{"name":"أراغون","ok":true}';
await json.elements.get("format-button").dispatch("click");
assert.equal(JSON.parse(json.elements.get("json-output").value).name, "أراغون");
assert.match(json.elements.get("json-output").value, /\n/);
await json.elements.get("minify-button").dispatch("click");
assert.equal(json.elements.get("json-output").value, '{"name":"أراغون","ok":true}');
json.elements.get("json-input").value = "{broken";
await json.elements.get("format-button").dispatch("click");
assert.equal(json.elements.get("copy-button").disabled, true);
assert.equal(json.elements.get("json-status").dataset.kind, "error");

const base64 = mountTool("base64");
const arabic = "مرحبًا، ARAGON!";
base64.elements.get("base64-input").value = arabic;
await base64.elements.get("convert-button").dispatch("click");
const encoded = base64.elements.get("base64-output").value;
assert.equal(Buffer.from(encoded, "base64").toString("utf8"), arabic);
await base64.elements.get("decode-mode").dispatch("click");
base64.elements.get("base64-input").value = encoded;
await base64.elements.get("convert-button").dispatch("click");
assert.equal(base64.elements.get("base64-output").value, arabic);
base64.elements.get("base64-input").value = "%%%";
await base64.elements.get("convert-button").dispatch("click");
assert.equal(base64.elements.get("base64-status").dataset.kind, "error");

const counter = mountTool("word-counter");
counter.elements.get("counter-input").value = "hello world\n\nnext";
await counter.elements.get("counter-input").dispatch("input");
assert.equal(counter.elements.get("words-count").textContent, "3");
assert.equal(counter.elements.get("chars-count").textContent, "17");
assert.equal(counter.elements.get("chars-no-spaces").textContent, "14");
assert.equal(counter.elements.get("paragraphs-count").textContent, "2");

const password = mountTool("password");
password.elements.get("password-length").value = "32";
await password.elements.get("generate-button").dispatch("click");
let generated = password.elements.get("password-output").value;
assert.equal(generated.length, 32);
assert.match(generated, /[a-z]/);
assert.match(generated, /[A-Z]/);
assert.match(generated, /[0-9]/);
assert.match(generated, /[!@#$%^&*()\-_=+\[\]{};:,.?]/);
password.elements.get("exclude-ambiguous").checked = true;
await password.elements.get("generate-button").dispatch("click");
generated = password.elements.get("password-output").value;
assert.doesNotMatch(generated, /[O0Il1]/);
await password.elements.get("clear-button").dispatch("click");
assert.equal(password.elements.get("password-output").value, "");
assert.equal(password.elements.get("copy-button").disabled, true);

const supportAddress = "0x0ae8ed0a15c779920aed5de2f12796108c747fda";
const supportStatus = { textContent: "", dataset: {} };
const copiedAddresses = [];
let copyHandler;
const supportButton = {
  dataset: { copyAddress: supportAddress },
  addEventListener(type, callback) {
    assert.equal(type, "click");
    copyHandler = callback;
  },
  closest(selector) {
    assert.equal(selector, "[data-address-card]");
    return { querySelector: (query) => query === "[data-copy-status]" ? supportStatus : null };
  }
};
const supportDocument = {
  querySelectorAll(selector) {
    if (selector === "[data-year]") return [];
    if (selector === "[data-copy-address]") return [supportButton];
    return [];
  }
};
const supportNavigator = { clipboard: { writeText: async (text) => copiedAddresses.push(text) } };
runInNewContext(readFileSync(resolve(root, "assets", "js", "shared.js"), "utf8"), {
  document: supportDocument,
  window: {},
  navigator: supportNavigator
}, { filename: "assets/js/shared.js" });
await copyHandler();
assert.deepEqual(copiedAddresses, [supportAddress]);
assert.equal(supportStatus.dataset.kind, "success");
supportNavigator.clipboard.writeText = async () => { throw new Error("clipboard denied"); };
await copyHandler();
assert.equal(supportStatus.dataset.kind, "error");
assert.match(supportStatus.textContent, /clipboard denied/);

console.log("نجحت الاختبارات: JSON، Unicode/Base64، إحصاءات النص، كلمة المرور الآمنة، ونسخ عناوين الدعم.");
