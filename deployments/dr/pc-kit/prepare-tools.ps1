# prepare-tools.ps1 - run ONCE on a PC with normal internet (and again after upgrading k3s/rclone/SymmetricDS).
# Downloads everything a server rebuild needs that must not depend on the internet being reachable from the new server
# (server A in Iran cannot reach GitHub/SourceForge), and makes a copy of the application repository.
#   powershell -ExecutionPolicy Bypass -File prepare-tools.ps1 [-Repo E:\jafariyan\workplace\lsevin\.claude-publish]
# Result: tools\ (k3s, k3s-install.sh, rclone, symmetric-server-3.16.17.zip, lego) and repo.bundle next to this script.
param([string]$Repo = "")
$ErrorActionPreference = "Stop"
$kit   = Split-Path -Parent $MyInvocation.MyCommand.Path
$tools = Join-Path $kit "tools"
New-Item -ItemType Directory -Force $tools | Out-Null
$k3s = "v1.36.4+k3s1"; $rclone = "v1.75.1"; $symds = "3.16.17"; $lego = "v4.25.2"
$symdsSha = "3b1f9dbe4aea1e2e021446aceed82d1be592b0cd3b62414d8e33b5a26047f073"
function Get([string]$url, [string]$dest) {
    if (Test-Path $dest) { Write-Host "have $(Split-Path -Leaf $dest)"; return }
    Write-Host "downloading $url"; & curl.exe -fL --retry 3 -o $dest $url; if ($LASTEXITCODE -ne 0) { throw "download failed: $url" }
}
Get "https://github.com/k3s-io/k3s/releases/download/$($k3s -replace '\+','%2B')/k3s" (Join-Path $tools "k3s")
Get "https://get.k3s.io" (Join-Path $tools "k3s-install.sh")
$z = Join-Path $env:TEMP "rclone-linux.zip"
if (-not (Test-Path (Join-Path $tools "rclone"))) {
    Get "https://downloads.rclone.org/$rclone/rclone-$rclone-linux-amd64.zip" $z
    Expand-Archive -Force $z (Join-Path $env:TEMP "rclone-linux"); Copy-Item (Get-ChildItem (Join-Path $env:TEMP "rclone-linux") -Recurse -Filter rclone | Where-Object { -not $_.PSIsContainer } | Select-Object -First 1).FullName (Join-Path $tools "rclone")
}
$sz = Join-Path $tools "symmetric-server-$symds.zip"
Get "https://sourceforge.net/projects/symmetricds/files/symmetricds/symmetricds-3.16/symmetric-server-$symds.zip/download" $sz
if ((Get-FileHash $sz -Algorithm SHA256).Hash.ToLower() -ne $symdsSha) { Remove-Item $sz; throw "SymmetricDS checksum mismatch - file removed" }
$lz = Join-Path $env:TEMP "lego.tar.gz"
if (-not (Test-Path (Join-Path $tools "lego"))) {
    Get "https://github.com/go-acme/lego/releases/download/$lego/lego_${lego}_linux_amd64.tar.gz" $lz
    tar -xzf $lz -C $tools lego
}
if ($Repo) {
    & git -C $Repo bundle create (Join-Path $kit "repo.bundle") --all
    Write-Host "repository bundle written (re-run this after big changes)"
} else { Write-Host "Tip: add -Repo <path to your git checkout> to also make repo.bundle" }
Get-ChildItem $tools | Format-Table Name, Length -AutoSize
