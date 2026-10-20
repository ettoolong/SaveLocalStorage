const $ = (id) => document.getElementById(id);

let activeTab = null;

function setStatus(text, kind = "") {
  $("status").textContent = text;
  $("status").className = `status ${kind}`;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function init() {
  [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  try {
    const info = await runInTab(activeTab.id, pageGetInfo);
    $("origin").textContent = info.origin;
    if (info.error) {
      setStatus(t("errNoStorageAccess", String(info.error)), "error");
      return;
    }
    $("count").textContent = t("itemCount", String(info.count));
    $("export").disabled = false;
    $("import").disabled = false;
  } catch (e) {
    $("origin").textContent = activeTab.url || t("unknownPage");
    setStatus(t("errRestrictedPage"), "error");
  }
}

async function exportStorage() {
  $("export").disabled = true;
  try {
    const page = await runInTab(activeTab.id, pageReadLocalStorage);
    const payload = {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      origin: page.origin,
      hostname: page.hostname,
      url: page.url,
      exportedAt: new Date().toISOString(),
      count: Object.keys(page.data).length,
      data: page.data,
    };
    const safeHost = page.hostname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const result = await browser.runtime.sendMessage({
      type: "download-json",
      filename: `localStorage-${safeHost}-${timestamp()}.json`,
      content: JSON.stringify(payload, null, 2),
    });
    if (!result?.ok) throw new Error(result?.error || t("errDownloadFailed"));
    setStatus(t("exportDone", String(payload.count)), "ok");
  } catch (e) {
    setStatus(t("exportFailed", e.message), "error");
  } finally {
    $("export").disabled = false;
  }
}

async function openImportWindow() {
  // popup 開啟檔案選擇器時會被關閉, 所以改開一個獨立的小視窗處理匯入
  await browser.windows.create({
    url: browser.runtime.getURL(`import.html?tabId=${activeTab.id}`),
    type: "popup",
    width: 480,
    height: 520,
  });
  window.close();
}

localizePage();
$("export").addEventListener("click", exportStorage);
$("import").addEventListener("click", openImportWindow);
init();
