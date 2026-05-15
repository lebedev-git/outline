"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderShare = exports.renderApp = void 0;
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeUtil = _interopRequireDefault(require("node:util"));
var _escape = _interopRequireDefault(require("lodash/escape"));
var _sequelize = require("sequelize");
var _isUUID = _interopRequireDefault(require("validator/lib/isUUID"));
var _types = require("./../../shared/types");
var _date = require("./../../shared/utils/date");
var _env = _interopRequireDefault(require("./../env"));
var _models = require("./../models");
var _DocumentHelper = require("./../models/helpers/DocumentHelper");
var _env2 = _interopRequireDefault(require("./../presenters/env"));
var _passport = require("./../utils/passport");
var _prefetchTags = _interopRequireDefault(require("./../utils/prefetchTags"));
var _readManifestFile = _interopRequireDefault(require("./../utils/readManifestFile"));
var _shareLoader = require("./../commands/shareLoader");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const readFile = _nodeUtil.default.promisify(_nodeFs.default.readFile);
const entry = "app/index.tsx";
const viteHost = _env.default.URL.replace(`:${_env.default.PORT}`, ":3001");
let indexHtmlCache;

/**
 * Formats navigation tree children as markdown list items.
 *
 * @param children Array of navigation nodes
 * @param baseUrl Base URL for generating links
 * @returns Formatted markdown string
 */
function formatChildDocumentsAsMarkdown(children, baseUrl) {
  if (!children || children.length === 0) {
    return "";
  }
  const lines = children.map(child => {
    const url = baseUrl + child.url;
    return `- [${child.title}](${url})`;
  });
  return `\n\n---\n\n**Documents**\n\n${lines.join("\n")}`;
}
const readIndexFile = async () => {
  if (_env.default.isProduction || _env.default.isTest) {
    if (indexHtmlCache) {
      return indexHtmlCache;
    }
  }
  if (_env.default.isTest) {
    return await readFile(_nodePath.default.join(__dirname, "../static/index.html"));
  }
  if (_env.default.isDevelopment) {
    return await readFile(_nodePath.default.join(__dirname, "../../../server/static/index.html"));
  }
  return indexHtmlCache = await readFile(_nodePath.default.join(__dirname, "../../app/index.html"));
};
const renderApp = async function (ctx, next) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const {
    title = _env.default.APP_NAME,
    description = "A modern team knowledge base for your internal documentation, product specs, support answers, meeting notes, onboarding, &amp; more…",
    canonical = "",
    content = "",
    shortcutIcon = `${_env.default.CDN_URL || ""}/images/favicon-32.png`,
    allowIndexing = true
  } = options;
  if (ctx.request.path === "/realtime/") {
    return next();
  }
  if (!_env.default.isCloudHosted) {
    options.analytics?.forEach(integration => {
      if (integration.settings?.instanceUrl) {
        const parsed = new URL(integration.settings?.instanceUrl);
        const csp = ctx.response.get("Content-Security-Policy");
        ctx.set("Content-Security-Policy", csp.replace("script-src", `script-src ${parsed.host}`));
      }
    });
  }
  const {
    shareId
  } = ctx.params;
  const page = await readIndexFile();
  const environment = `
    <script nonce="${ctx.state.cspNonce}">
      window.env = ${JSON.stringify((0, _env2.default)(_env.default, options)).replace(/</g, "\\u003c")};
    </script>
  `;
  const scriptTags = _env.default.isProduction ? `<script type="module" nonce="${ctx.state.cspNonce}" src="${_env.default.CDN_URL || ""}/static/${(0, _readManifestFile.default)()[entry]["file"]}"></script>` : `<script type="module" nonce="${ctx.state.cspNonce}">
        import RefreshRuntime from "${viteHost}/static/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => { }
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      </script>
      <script type="module" nonce="${ctx.state.cspNonce}" src="${viteHost}/static/@vite/client"></script>
      <script type="module" nonce="${ctx.state.cspNonce}" src="${viteHost}/static/${entry}"></script>
    `;
  const aiSearchRouteCleanupScript = `<script nonce="${ctx.state.cspNonce}">(function(){var shellId="outline-ai-search-shell";var oldId="codex-ai-search-main";function path(){var p=location.pathname||"/";return p.length>1&&p.endsWith("/")?p.slice(0,-1):p}function remove(id){var el=document.getElementById(id);if(el)el.remove()}function left(){var ai=document.querySelector('a[href="/ai-search"]');var rect=ai&&ai.getBoundingClientRect&&ai.getBoundingClientRect();return rect?Math.ceil(rect.right+12):312}function mount(){remove(oldId);var active=path()==="/ai-search";if(!active){remove(shellId);return}var shell=document.getElementById(shellId);if(!shell){shell=document.createElement("section");shell.id=shellId;shell.innerHTML='<iframe title="AI search" src="/ai/" style="width:100%;height:100%;border:0;background:#fff"></iframe>';document.body.appendChild(shell)}Object.assign(shell.style,{position:"fixed",left:left()+"px",right:"0",top:"0",bottom:"0",zIndex:"120",background:"#fff",overflow:"hidden"})}function later(){setTimeout(mount,0);setTimeout(mount,100);setTimeout(mount,500)}var ps=history.pushState,rs=history.replaceState;if(!history.__outlineAiPanelPatched){history.pushState=function(){var r=ps.apply(this,arguments);later();return r};history.replaceState=function(){var r=rs.apply(this,arguments);later();return r};history.__outlineAiPanelPatched=true}window.addEventListener("popstate",later);window.addEventListener("resize",mount);document.addEventListener("click",later,true);setInterval(mount,250);later()})();</script>`;
  const aiSearchScript = `
    <script nonce="${ctx.state.cspNonce}">
      (() => {
        if (window.__outlineAiSearchIntegrated) { return; }
        window.__outlineAiSearchIntegrated = true;
        const path = "/ai-search";
        const label = "AI \u043f\u043e\u0438\u0441\u043a";
        const panelId = "outline-ai-integrated";
        const getSearchLink = () => Array.from(document.querySelectorAll("a")).find((element) => element.textContent?.trim() === "\u041f\u043e\u0438\u0441\u043a");
        const cookieValue = (name) => document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(name + "="))?.split("=").slice(1).join("=") || "";
        const requestOutline = async (url, body) => {
          const headers = { "Content-Type": "application/json" };
          const csrf = cookieValue("csrfToken");
          if (csrf) { headers["x-csrf-token"] = decodeURIComponent(csrf); }
          const response = await fetch(url, { method: "POST", credentials: "same-origin", headers, body: JSON.stringify(body || {}) });
          if (!response.ok) {
            let detail = await response.text();
            try { const parsed = JSON.parse(detail); detail = parsed.message || parsed.error || parsed.detail || detail; } catch {}
            throw new Error(detail);
          }
          const json = await response.json();
          return json.data ?? json;
        };
        const removeLegacyAiMain = () => document.getElementById("codex-ai-search-main")?.remove();
        const removePanel = () => { document.getElementById(panelId)?.remove(); removeLegacyAiMain(); };
        const panelLeft = () => {
          const link = document.querySelector("[data-outline-ai-search-link]") || getSearchLink();
          const rect = link?.getBoundingClientRect();
          return rect ? Math.ceil(rect.right + 12) : 315;
        };
        const renderPanel = () => {
          let panel = document.getElementById(panelId);
          if (!panel) {
            panel = document.createElement("section");
            panel.id = panelId;
            panel.innerHTML = '<style>#outline-ai-integrated{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827}#outline-ai-integrated *{box-sizing:border-box}.ai-wrap{height:100%;display:grid;grid-template-rows:auto 1fr auto;background:#fff;border-radius:0 8px 8px 0;overflow:hidden}.ai-head{height:72px;display:flex;align-items:center;justify-content:flex-start;padding:0 40px;border-bottom:1px solid #e5e7eb;position:relative}.ai-title{font-size:28px;font-weight:700;letter-spacing:0}.ai-actions{display:flex;gap:8px;margin-left:auto}.ai-actions [data-ai-reindex]{display:none}.ai-close{position:absolute;right:18px;top:18px;width:52px;height:52px;border-radius:50%;border:1px solid #e5e7eb;background:#fff;color:#111827;font-size:32px;line-height:1;box-shadow:0 8px 24px rgba(15,23,42,.14);cursor:pointer}.ai-btn{border:1px solid #d1d5db;background:#fff;color:#111827;border-radius:6px;height:36px;padding:0 14px;font-weight:600;cursor:pointer}.ai-btn.primary{background:#0f766e;border-color:#0f766e;color:#fff}.ai-body{display:grid;grid-template-columns:minmax(0,1fr);gap:0;min-height:0}.ai-chat{padding:28px 32px;overflow:auto}.ai-side{display:none}.ai-card{border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:16px;margin-bottom:12px}.ai-muted{color:#64748b;font-size:14px;line-height:1.5}.ai-msg{max-width:920px;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin:0 0 12px;background:#fff;white-space:pre-wrap;line-height:1.55}.ai-msg.user{background:#eef6ff;border-color:#bfdbfe}.ai-role{display:block;font-size:12px;font-weight:700;color:#0f766e;text-transform:uppercase;margin-bottom:6px}.ai-sources{display:flex;flex-direction:column;gap:6px;margin-top:10px}.ai-sources a{color:#2563eb;text-decoration:none}.ai-form{display:flex;gap:12px;padding:16px 32px;border-top:1px solid #e5e7eb;background:#fff}.ai-input{flex:1;min-height:56px;max-height:140px;resize:vertical;border:1px solid #cbd5e1;border-radius:8px;padding:12px 14px;font:inherit}.ai-empty{height:100%;display:flex;align-items:center;justify-content:center;color:#64748b;text-align:center;padding:40px}@media(max-width:900px){.ai-body{grid-template-columns:1fr}.ai-side{display:none}.ai-head{padding:0 18px}.ai-chat,.ai-form{padding-left:18px;padding-right:18px}}</style><div class="ai-wrap"><header class="ai-head"><div class="ai-title">AI \u043f\u043e\u0438\u0441\u043a</div><div class="ai-actions"><button class="ai-btn" data-ai-reindex>\u041f\u0435\u0440\u0435\u0438\u043d\u0434\u0435\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u0442\u044c</button><button class="ai-close" data-ai-close aria-label="\u0417\u0430\u043a\u0440\u044b\u0442\u044c">&times;</button></div></header><div class="ai-body"><main class="ai-chat" data-ai-chat><div class="ai-empty">\u0417\u0430\u0434\u0430\u0439 \u0432\u043e\u043f\u0440\u043e\u0441 \u043f\u043e \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u043c \u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043d\u044b\u043c \u0444\u0430\u0439\u043b\u0430\u043c Outline.</div></main><aside class="ai-side"><div class="ai-card"><strong>\u0427\u0442\u043e \u0438\u043d\u0434\u0435\u043a\u0441\u0438\u0440\u0443\u0435\u0442\u0441\u044f</strong><div class="ai-muted">\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b Outline \u0438 \u0432\u043b\u043e\u0436\u0435\u043d\u0438\u044f PDF, DOCX, XLSX, PPTX. \u0421\u043a\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 PDF \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f, \u043d\u043e \u0434\u043b\u044f \u043f\u043e\u0438\u0441\u043a\u0430 \u043f\u043e \u043d\u0438\u043c \u043f\u043e\u0437\u0436\u0435 \u043d\u0443\u0436\u0435\u043d OCR.</div></div><div class="ai-card"><strong>\u0414\u043e\u0441\u0442\u0443\u043f\u044b</strong><div class="ai-muted">\u041e\u0442\u0432\u0435\u0442\u044b \u0441\u0442\u0440\u043e\u044f\u0442\u0441\u044f \u0447\u0435\u0440\u0435\u0437 Outline API \u0438 \u0444\u0438\u043b\u044c\u0442\u0440\u0443\u044e\u0442\u0441\u044f \u043f\u043e \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u043c, \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u043c \u0442\u0435\u043a\u0443\u0449\u0435\u043c\u0443 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044e.</div></div></aside></div><form class="ai-form" data-ai-form><textarea class="ai-input" data-ai-input placeholder="\u0421\u043f\u0440\u043e\u0441\u0438 \u043f\u043e \u0431\u0430\u0437\u0435 \u0437\u043d\u0430\u043d\u0438\u0439..."></textarea><button class="ai-btn primary" type="submit">\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c</button></form></div>';
            document.body.appendChild(panel);
            panel.querySelector("[data-ai-close]").addEventListener("click", () => { window.history.pushState(null, "", "/"); removePanel(); });
            panel.querySelector("[data-ai-reindex]").addEventListener("click", async (event) => {
              const button = event.currentTarget;
              button.disabled = true;
              button.textContent = "\u0418\u043d\u0434\u0435\u043a\u0441\u0438\u0440\u0443\u044e...";
              try { await requestOutline("/ai/index", {}); button.textContent = "\u0413\u043e\u0442\u043e\u0432\u043e"; }
              catch (error) { button.textContent = "\u041e\u0448\u0438\u0431\u043a\u0430"; addMessage("\u0421\u0438\u0441\u0442\u0435\u043c\u0430", error.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0435\u0440\u0435\u0438\u043d\u0434\u0435\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u0442\u044c."); }
              finally { setTimeout(() => { button.disabled = false; button.textContent = "\u041f\u0435\u0440\u0435\u0438\u043d\u0434\u0435\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u0442\u044c"; }, 1800); }
            });
            panel.querySelector("[data-ai-form]").addEventListener("submit", async (event) => {
              event.preventDefault();
              const input = panel.querySelector("[data-ai-input]");
              const message = input.value.trim();
              if (!message) { return; }
              input.value = "";
              addMessage("\u0412\u044b", message, [], true);
              try { const result = await requestOutline("/ai/chat", { message, limit: 5 }); addMessage("AI", result.answer || "\u041d\u0435\u0442 \u043e\u0442\u0432\u0435\u0442\u0430.", result.sources || []); }
              catch (error) { addMessage("\u041e\u0448\u0438\u0431\u043a\u0430", error.message || "\u0417\u0430\u043f\u0440\u043e\u0441 \u043d\u0435 \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d."); }
            });
          }
          Object.assign(panel.style, { position: "fixed", left: panelLeft() + "px", right: "56px", top: "0", bottom: "0", zIndex: "80", background: "white", borderRadius: "0 8px 8px 0", boxShadow: "0 0 0 9999px rgba(17, 24, 39, 0.18), 0 16px 48px rgba(15, 23, 42, 0.18)", overflow: "visible" });
          return panel;
        };
        const appendFormattedText = (element, text) => {
          const lines = String(text || "").split("\n");
          lines.forEach((line, lineIndex) => {
            if (lineIndex) {
              element.append(document.createElement("br"));
            }
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            parts.forEach((part) => {
              if (!part) {
                return;
              }
              if (part.startsWith("**") && part.endsWith("**")) {
                const strong = document.createElement("strong");
                strong.textContent = part.slice(2, -2);
                element.append(strong);
                return;
              }
              element.append(document.createTextNode(part));
            });
          });
        };
        const sourceLabel = (source) => {
          const title = String(source.title || "").trim();
          if (title && title !== "1") {
            return title;
          }
          if (source.collection) {
            return "\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a: " + source.collection;
          }
          if (source.filename) {
            return source.filename;
          }
          return "Открыть источник";
        };
        const uniqueSources = (sources) => {
          const seen = new Set();
          return (sources || []).filter((source) => {
            const key = source.url || source.documentId || source.attachmentId || source.title;
            if (!key || seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });
        };
        const addMessage = (role, text, sources, user) => {
          const panel = renderPanel();
          const chat = panel.querySelector("[data-ai-chat]");
          chat.querySelector(".ai-empty")?.remove();
          const item = document.createElement("div");
          item.className = "ai-msg" + (user ? " user" : "");
          const roleElement = document.createElement("span");
          roleElement.className = "ai-role";
          roleElement.textContent = role;
          const content = document.createElement("div");
          content.className = "ai-content";
          if (user) {
            content.textContent = text;
          } else {
            appendFormattedText(content, text);
          }
          item.append(roleElement, content);
          const visibleSources = uniqueSources(sources);
          if (visibleSources.length) {
            const list = document.createElement("div");
            list.className = "ai-sources";
            visibleSources.forEach((source) => { const link = document.createElement("a"); link.href = source.url; link.textContent = sourceLabel(source); list.append(link); });
            item.append(list);
          }
          chat.append(item);
          chat.scrollTop = chat.scrollHeight;
        };
        const openAiPanel = (event) => {
          event.preventDefault();
          window.history.pushState(null, "", path);
          renderPanel();
        };
        const bindExistingAiLinks = () => {
          Array.from(document.querySelectorAll("a")).forEach((element) => {
            if (element.dataset.outlineAiSearchLink || element.dataset.outlineAiSearchBound) {
              return;
            }
            if (element.textContent?.trim() !== label) {
              return;
            }
            element.setAttribute("href", path);
            element.removeAttribute("aria-current");
            element.removeAttribute("aria-label");
            element.dataset.outlineAiSearchBound = "true";
            element.addEventListener("click", openAiPanel);
          });
        };
        const ensureLink = () => {
          bindExistingAiLinks();
          if (document.querySelector("[data-outline-ai-search-link]")) { return; }
          const searchLink = getSearchLink();
          if (!searchLink) { return; }
          const link = searchLink.cloneNode(true);
          link.setAttribute("href", path);
          link.removeAttribute("aria-current");
          link.removeAttribute("aria-label");
          link.dataset.outlineAiSearchLink = "true";
          const textNode = Array.from(link.querySelectorAll("*")).find((element) => element.textContent?.trim() === "\u041f\u043e\u0438\u0441\u043a");
          if (textNode) { textNode.textContent = label; } else { link.textContent = label; }
          link.addEventListener("click", openAiPanel);
          searchLink.insertAdjacentElement("afterend", link);
        };
        const removeLegacyFrame = () => { document.querySelectorAll('iframe[title="AI ?????"], iframe[src="/ai/"]').forEach((frame) => frame.remove()); removeLegacyAiMain(); };
        const sync = () => { ensureLink(); removeLegacyFrame(); if (window.location.pathname === path) { renderPanel(); } else { removePanel(); } };
        document.addEventListener("click", (event) => {
          const link = event.target?.closest?.("a");
          if (!link || link.dataset.outlineAiSearchLink) { return; }
          try { const url = new URL(link.href); if (url.origin === window.location.origin && url.pathname !== path) { removePanel(); } } catch { return; }
        }, true);
        window.addEventListener("resize", sync);
        window.addEventListener("popstate", sync);
        new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });
        window.setInterval(sync, 1000);
        sync();
      })();
    </script>
  `;
  let headTags = `
    <meta name="robots" content="${allowIndexing ? "index, follow" : "noindex, nofollow"}" />
    <link rel="canonical" href="${(0, _escape.default)(canonical)}" />
    <link
      rel="shortcut icon"
      type="image/png"
      href="${(0, _escape.default)(shortcutIcon)}"
      sizes="32x32"
    />
    `;
  if (options.isShare) {
    headTags += `
    <link rel="sitemap" type="application/xml" href="/api/shares.sitemap?id=${(0, _escape.default)(options.rootShareId || shareId)}">
    `;
  } else {
    headTags += _prefetchTags.default;
    headTags += `
    <link rel="manifest" href="/static/manifest.webmanifest" />
    <link
      rel="apple-touch-icon"
      type="image/png"
      href="${_env.default.CDN_URL ?? ""}/images/icon-maskable-192.png"
      sizes="192x192"
    />
    <link
      rel="apple-touch-icon"
      type="image/png"
      href="${_env.default.CDN_URL ?? ""}/images/icon-maskable-512.png"
      sizes="512x512"
    />
    <link
      rel="apple-touch-icon"
      type="image/png"
      href="${_env.default.CDN_URL ?? ""}/images/icon-maskable-1024.png"
      sizes="1024x1024"
    />
    <link
      rel="search"
      type="application/opensearchdescription+xml"
      href="/opensearch.xml"
      title="Outline"
    />
    `;
  }

  // Ensure no caching is performed
  ctx.response.set("Cache-Control", "no-cache, must-revalidate");
  ctx.response.set("Expires", "-1");
  ctx.body = page.toString().replace(/\{env\}/g, environment).replace(/\{lang\}/g, (0, _date.unicodeCLDRtoISO639)(_env.default.DEFAULT_LANGUAGE)).replace(/\{title\}/g, (0, _escape.default)(title)).replace(/\{description\}/g, (0, _escape.default)(description)).replace(/\{content\}/g, content).replace(/\{cdn-url\}/g, _env.default.CDN_URL || "").replace(/\{head-tags\}/g, headTags).replace(/\{slack-app-id\}/g, _env.default.public.SLACK_APP_ID || "").replace(/\{script-tags\}/g, scriptTags + aiSearchRouteCleanupScript).replace(/\{csp-nonce\}/g, ctx.state.cspNonce);
};
exports.renderApp = renderApp;
const renderShare = async (ctx, next) => {
  const rootShareId = ctx.state?.rootShare?.id;
  const shareId = rootShareId ?? ctx.params.shareId;
  const collectionSlug = ctx.params.collectionSlug;
  const documentSlug = ctx.params.documentSlug;

  // Find the share record if published so that the document title can be returned
  // in the server-rendered HTML. This allows it to appear in unfurls more reliably.
  let share, collection, document, team;
  let analytics = [];
  let sharedTree;
  try {
    team = await (0, _passport.getTeamFromContext)(ctx, {
      includeStateCookie: false
    });
    const result = await (0, _shareLoader.loadPublicShare)({
      id: shareId,
      collectionId: collectionSlug,
      documentId: documentSlug,
      teamId: team?.id
    });
    share = result.share;
    collection = result.collection;
    document = result.document;
    sharedTree = result.sharedTree;
    if ((0, _isUUID.default)(shareId) && share?.urlId) {
      // Redirect temporarily because the url slug
      // can be modified by the user at any time
      ctx.redirect(share.canonicalUrl);
      ctx.status = 307;
      return;
    }
    analytics = await _models.Integration.findAll({
      where: {
        teamId: share.teamId,
        type: _types.IntegrationType.Analytics
      }
    });
    if (share && !ctx.userAgent.isBot) {
      await share.update({
        lastAccessedAt: new Date(),
        views: _sequelize.Sequelize.literal("views + 1")
      }, {
        hooks: false
      });
    }
  } catch (_err) {
    // If the share or document does not exist, return a 404.
    ctx.status = 404;
  }

  // If the client explicitly requests markdown and prefers it over HTML,
  // or the URL path ends with .md, return the document as markdown. This is
  // useful for LLMs and API clients.
  const acceptHeader = ctx.request.headers.accept || "";
  const prefersMarkdown = ctx.params.format === "md" || acceptHeader.includes("text/markdown") && ctx.accepts("text/markdown", "text/html") === "text/markdown";
  if (prefersMarkdown && (document || collection)) {
    let markdown = await _DocumentHelper.DocumentHelper.toMarkdown(document || collection, {
      includeTitle: true,
      signedUrls: 86400,
      // 24 hours
      teamId: team?.id
    });

    // Append child documents list if the share includes them
    if (share?.includeChildDocuments && sharedTree) {
      const node = document ? collection?.getDocumentTree(document.id) ?? sharedTree : sharedTree;
      if (node?.children?.length) {
        markdown += formatChildDocumentsAsMarkdown(node.children, share.canonicalUrl);
      }
    }
    ctx.type = "text/markdown";
    ctx.body = markdown;
    return;
  }

  // Allow shares to be embedded in iframes on other websites unless prevented by team preference
  const preventEmbedding = team?.getPreference(_types.TeamPreference.PreventDocumentEmbedding) ?? false;
  if (!preventEmbedding) {
    ctx.remove("X-Frame-Options");
  }
  const publicBranding = team?.getPreference(_types.TeamPreference.PublicBranding) ?? false;
  const title = document ? document.title : collection ? collection.name : publicBranding && team?.name ? team.name : undefined;
  const content = document || collection ? await _DocumentHelper.DocumentHelper.toHTML(document || collection, {
    includeStyles: false,
    includeHead: false,
    includeTitle: true,
    signedUrls: true
  }) : undefined;
  const canonicalUrl = share && share.canonicalUrl !== ctx.request.origin + ctx.request.url ? `${share.canonicalUrl}${documentSlug && document ? document.path : collectionSlug && collection ? collection.path : ""}` : undefined;

  // Inject share information in SSR HTML
  return renderApp(ctx, next, {
    title,
    description: document?.getSummary() || (publicBranding && team?.description ? team.description : undefined),
    content,
    shortcutIcon: publicBranding && team?.avatarUrl ? team.avatarUrl : undefined,
    analytics,
    isShare: true,
    rootShareId,
    canonical: canonicalUrl,
    allowIndexing: share?.allowIndexing
  });
};
exports.renderShare = renderShare;
