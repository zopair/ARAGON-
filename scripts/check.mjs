import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { resolve, relative, dirname, sep, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const files = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "_site" || entry.name === "node_modules") continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) files.push(path);
  }
}

function report(file, message) {
  errors.push(`${relative(root, file)}: ${message}`);
}

walk(root);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const javascriptFiles = files.filter((file) => file.endsWith(".js") || file.endsWith(".mjs"));
const expectedTools = ["json", "base64", "word-counter", "password"];

for (const tool of expectedTools) {
  const htmlPath = resolve(root, "tools", tool, "index.html");
  const scriptPath = resolve(root, "tools", tool, "app.js");
  if (!existsSync(htmlPath)) errors.push(`missing tools/${tool}/index.html`);
  if (!existsSync(scriptPath)) errors.push(`missing tools/${tool}/app.js`);
}

const notFoundPath = resolve(root, "404.html");
if (!existsSync(notFoundPath)) {
  errors.push("missing 404.html");
} else {
  const notFoundHtml = readFileSync(notFoundPath, "utf8");
  const baseHref = notFoundHtml.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
  if (baseHref !== `/${basename(root)}/`) errors.push(`404.html must use the repository Pages base path /${basename(root)}/`);
}

for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, "utf8");
  if (!/<html\b[^>]*\blang=["']ar["']/i.test(html)) report(htmlPath, "missing Arabic html lang attribute");
  if (!/<html\b[^>]*\bdir=["']rtl["']/i.test(html)) report(htmlPath, "missing RTL direction");
  if (!/<title>[^<]+<\/title>/i.test(html)) report(htmlPath, "missing page title");
  if (!/http-equiv=["']Content-Security-Policy["']/i.test(html)) report(htmlPath, "missing Content Security Policy");
  if (/\sstyle\s*=/i.test(html)) report(htmlPath, "inline style attribute is not allowed");
  if (/\son[a-z]+\s*=/i.test(html)) report(htmlPath, "inline event handler is not allowed");
  if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(html)) report(htmlPath, "inline script is not allowed");

  const references = html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi);
  for (const match of references) {
    const reference = match[1].trim();
    if (!reference || reference.startsWith("#") || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) continue;
    let pathname;
    try {
      pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    } catch {
      report(htmlPath, `invalid URL encoding in ${reference}`);
      continue;
    }
    const projectBase = `/${basename(root)}/`;
    let target;
    if (pathname.startsWith(projectBase)) {
      target = resolve(root, pathname.slice(projectBase.length));
    } else if (pathname.startsWith("/")) {
      report(htmlPath, `absolute path is outside the repository Pages base: ${reference}`);
      continue;
    } else {
      target = resolve(dirname(htmlPath), pathname || ".");
    }
    const relativeTarget = relative(root, target);
    if (relativeTarget === ".." || relativeTarget.startsWith(`..${sep}`) || relativeTarget.startsWith(sep)) {
      report(htmlPath, `local reference escapes the repository: ${reference}`);
      continue;
    }
    if (existsSync(target) && statSync(target).isDirectory()) target = resolve(target, "index.html");
    if (!existsSync(target)) report(htmlPath, `broken local reference ${reference}`);
  }
}

for (const scriptPath of javascriptFiles) {
  const result = spawnSync(process.execPath, ["--check", scriptPath], { encoding: "utf8" });
  if (result.status !== 0) report(scriptPath, (result.stderr || result.stdout || "JavaScript syntax check failed").trim());
}

const workflowPath = resolve(root, ".github", "workflows", "pages.yml");
if (!existsSync(workflowPath)) {
  errors.push("missing .github/workflows/pages.yml");
} else {
  const workflow = readFileSync(workflowPath, "utf8");
  if (!/pages:\s*write/.test(workflow) || !/id-token:\s*write/.test(workflow)) errors.push("Pages deploy job must declare only the required Pages and OIDC permissions");
  if (!/actions\/(?:checkout|configure-pages|upload-pages-artifact|deploy-pages)@[0-9a-f]{40}/i.test(workflow)) errors.push("workflow action references must be pinned to full commit SHAs");
}

if (errors.length) {
  console.error(`فشل الفحص: ${errors.length} مشكلة`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`نجح الفحص: ${htmlFiles.length} صفحات HTML، ${javascriptFiles.length} ملفات JavaScript، وكل المسارات المحلية سليمة.`);
}
