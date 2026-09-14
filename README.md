# sote-releases

Public **installers**, **auto-update artifacts**, and the **download site** for [sote](https://github.com/achuthhadnoor/sote).

This repository intentionally contains **no application source**. Builds are published here from sote CI on version tags (`v*`).

## Download

**Website:** https://achuthhadnoor.github.io/sote-releases/

Or grab installers from [Releases](https://github.com/achuthhadnoor/sote-releases/releases/latest).

| Platform | Asset |
|---|---|
| macOS Apple Silicon | `sote_*_aarch64.dmg` |
| macOS Intel | `sote_*_x64.dmg` |
| Windows | `sote_*_x64-setup.exe` (NSIS) |

macOS builds may be unsigned — use Right-click → Open the first time if Gatekeeper warns.

## Auto-updates

Installed apps check:

`https://github.com/achuthhadnoor/sote-releases/releases/latest/download/latest.json`

Source, issues, and development live in [achuthhadnoor/sote](https://github.com/achuthhadnoor/sote).
