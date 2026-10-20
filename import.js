const $ = (id) => document.getElementById(id);

const tabId = Number(new URLSearchParams(location.search).get("tabId"));
let targetOrigin = null;
let imported = null; // 解析後的匯出檔內容

function setStatus(text, kind = "") {
  $("status").textContent = text;
  $("status").className = `status ${kind}`;
}

function updateImportButton() {
  const mismatch = imported && imported.origin !== targetOrigin;
  $("do-import").disabled = !imported || (mismatch && !$("force").checked);
}

function validateExport(obj) {
  if (!obj || typeof obj !== "object") throw new Error(t("errNotObject"));
  if (obj.format !== EXPORT_FORMAT) throw new Error(t("errWrongFormat"));
  if (obj.version > EXPORT_VERSION) throw new Error(t("errUnsupportedVersion", String(obj.version)));
  if (typeof obj.origin !== "string") throw new Error(t("errMissingOrigin"));
  if (!obj.data || typeof obj.data !== "object" || Array.isArray(obj.data)) {
    throw new Error(t("errMissingData"));
  }
  for (const [key, value] of Object.entries(obj.data)) {
    if (typeof value !== "string") throw new Error(t("errValueNotString", key));
  }
  return obj;
}

async function init() {
  try {
    const info = await runInTab(tabId, pageGetInfo);
    targetOrigin = info.origin;
    $("target").textContent = targetOrigin;
    $("file").disabled = false;
  } catch (e) {
    $("target").textContent = t("inaccessible");
    setStatus(t("errTargetTab"), "error");
  }
}

async function onFileSelected() {
  imported = null;
  $("file-info").hidden = true;
  $("reload").hidden = true;
  setStatus("");

  const file = $("file").files[0];
  if (file) {
    try {
      imported = validateExport(JSON.parse(await file.text()));
      $("file-origin").textContent = imported.origin;
      $("file-time").textContent = imported.exportedAt ? new Date(imported.exportedAt).toLocaleString() : t("unknown");
      $("file-count").textContent = Object.keys(imported.data).length;
      $("mismatch").hidden = imported.origin === targetOrigin;
      $("force").checked = false;
      $("file-info").hidden = false;
    } catch (e) {
      setStatus(t("errReadFile", e.message), "error");
    }
  }
  updateImportButton();
}

async function doImport() {
  $("do-import").disabled = true;
  try {
    const result = await runInTab(tabId, pageWriteLocalStorage, [
      imported.data,
      $("clear").checked,
      targetOrigin,
    ]);
    if (!result.ok) {
      throw new Error(result.code === "originChanged"
        ? t("errPageOriginChanged", [result.actual, targetOrigin])
        : result.error);
    }
    setStatus(t("importDone", String(result.written)), "ok");
    $("reload").hidden = false;
  } catch (e) {
    setStatus(t("importFailed", e.message), "error");
  }
  updateImportButton();
}

localizePage();
$("file").addEventListener("change", onFileSelected);
$("force").addEventListener("change", updateImportButton);
$("do-import").addEventListener("click", doImport);
$("reload").addEventListener("click", async () => {
  await browser.tabs.reload(tabId);
  window.close();
});
$("close").addEventListener("click", () => window.close());
init();
