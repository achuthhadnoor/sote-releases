const RELEASES_API =
  "https://api.github.com/repos/achuthhadnoor/sote-releases/releases/latest";
const RELEASES_LATEST_PAGE =
  "https://github.com/achuthhadnoor/sote-releases/releases/latest";

/** @typedef {{ name: string, browser_download_url: string, size?: number }} Asset */

/**
 * @returns {{ os: 'mac' | 'windows' | 'other', arch: 'arm64' | 'x64' | 'unknown' }}
 */
function detectPlatform() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  let os = "other";
  if (/windows/i.test(ua)) os = "windows";
  else if (/mac os x|macintosh/i.test(ua)) os = "mac";

  let arch = "unknown";
  // Best-effort: Apple Silicon often reports MacIntel in browsers; prefer arm if hinted.
  if (/arm|aarch64/i.test(ua) || /arm64/i.test(platform)) arch = "arm64";
  else if (/win64|x86_64|x64|intel/i.test(ua + platform)) arch = "x64";
  else if (os === "mac") arch = "arm64"; // most new Macs
  else if (os === "windows") arch = "x64";

  return { os, arch };
}

/**
 * @param {Asset[]} assets
 * @param {'mac' | 'windows' | 'other'} os
 * @param {'arm64' | 'x64' | 'unknown'} arch
 * @returns {Asset | null}
 */
function pickPrimary(assets, os, arch) {
  const names = assets.map((a) => ({ asset: a, n: a.name.toLowerCase() }));

  if (os === "mac") {
    if (arch === "x64") {
      return (
        names.find((x) => x.n.includes("x64") && x.n.endsWith(".dmg"))?.asset ||
        names.find((x) => x.n.includes("x64") && x.n.includes(".app.tar.gz") && !x.n.endsWith(".sig"))
          ?.asset ||
        null
      );
    }
    return (
      names.find((x) => x.n.includes("aarch64") && x.n.endsWith(".dmg"))?.asset ||
      names.find(
        (x) => x.n.includes("aarch64") && x.n.includes(".app.tar.gz") && !x.n.endsWith(".sig"),
      )?.asset ||
      null
    );
  }

  if (os === "windows") {
    return (
      names.find((x) => x.n.endsWith("-setup.exe"))?.asset ||
      names.find((x) => x.n.endsWith(".exe") && !x.n.endsWith(".sig"))?.asset ||
      names.find((x) => x.n.endsWith(".msi") && !x.n.endsWith(".sig"))?.asset ||
      null
    );
  }

  return null;
}

/**
 * @param {Asset[]} assets
 * @returns {{ label: string, hint: string, url: string, id: string }[]}
 */
function catalog(assets) {
  /** @type {{ label: string, hint: string, url: string, id: string }[]} */
  const out = [];
  const by = (pred, label, hint, id) => {
    const hit = assets.find((a) => pred(a.name.toLowerCase()));
    if (hit) out.push({ label, hint, url: hit.browser_download_url, id });
  };

  by((n) => n.includes("aarch64") && n.endsWith(".dmg"), "macOS", "Apple Silicon", "mac-arm");
  by((n) => n.includes("x64") && n.endsWith(".dmg"), "macOS", "Intel", "mac-intel");
  by((n) => n.endsWith("-setup.exe"), "Windows", "NSIS installer", "win-exe");
  by((n) => n.endsWith(".msi") && !n.endsWith(".sig"), "Windows", "MSI", "win-msi");

  return out;
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

async function main() {
  const primary = document.getElementById("primary-download");
  const primaryLabel = document.getElementById("primary-label");
  const list = document.getElementById("download-list");
  const status = document.getElementById("status");
  const { os, arch } = detectPlatform();

  try {
    const res = await fetch(RELEASES_API, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const release = await res.json();
    /** @type {Asset[]} */
    const assets = (release.assets || []).filter(
      (a) => !String(a.name).endsWith(".sig") && a.name !== "latest.json",
    );

    const version = String(release.tag_name || release.name || "").replace(/^v/, "");
    const primaryAsset = pickPrimary(assets, os, arch);
    const items = catalog(assets);

    if (primaryAsset && primary instanceof HTMLAnchorElement) {
      primary.href = primaryAsset.browser_download_url;
      const nav = document.getElementById("nav-download");
      if (nav instanceof HTMLAnchorElement) nav.href = primaryAsset.browser_download_url;

      if (primaryLabel) {
        primaryLabel.textContent =
          os === "mac"
            ? "Download for macOS"
            : os === "windows"
              ? "Download for Windows"
              : "Download";
      }
      if (status) {
        const bits = [version && `v${version}`, formatBytes(primaryAsset.size)].filter(Boolean);
        status.textContent = bits.length
          ? `${bits.join(" · ")} · auto-updates included`
          : "macOS & Windows · auto-updates included";
      }
    }

    if (list && items.length) {
      list.innerHTML = "";
      for (const item of items) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.url;
        if (primaryAsset && item.url === primaryAsset.browser_download_url) {
          a.setAttribute("aria-current", "true");
        }
        a.innerHTML = `<span>${item.label}</span><span class="hint">${item.hint}</span>`;
        li.appendChild(a);
        list.appendChild(li);
      }
    }
  } catch (err) {
    console.warn("release lookup failed", err);
    if (primary instanceof HTMLAnchorElement) primary.href = RELEASES_LATEST_PAGE;
    if (primaryLabel) primaryLabel.textContent = "Download";
    if (status) {
      status.textContent = "Couldn’t load assets automatically — use the latest release page.";
    }
  }
}

main();
