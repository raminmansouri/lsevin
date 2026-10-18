# watchdog.ps1 - runs on the admin PC every 5 minutes (install-watchdog.ps1 sets that up). It is the safety net for the one thing the
# alerter on server B cannot report: B (or the alerter itself) being down. It checks the public sites, the Iranian site (over the Ethernet
# adapter, as an Iranian visitor sees it) and the alerter's own pulse on B, and sends a Telegram message when something is wrong for two
# checks in a row and again when it recovers. Needs secrets\telegram.env (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID).
$ErrorActionPreference = "SilentlyContinue"
$kit   = Split-Path -Parent $MyInvocation.MyCommand.Path
$stateFile = Join-Path $kit "watchdog-state.json"
$cfg = @{}
Get-Content (Join-Path $kit "secrets\telegram.env") | ForEach-Object { if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$') { $cfg[$Matches[1]] = $Matches[2].Trim().Trim('"') } }
function Send([string]$text) {
    if (-not $cfg.TELEGRAM_BOT_TOKEN -or -not $cfg.TELEGRAM_CHAT_ID) { Write-Host "[no telegram config] $text"; return }
    foreach ($chat in $cfg.TELEGRAM_CHAT_ID.Split(",")) {
        $body = @{ chat_id = $chat.Trim(); text = $text; disable_web_page_preview = $true } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$($cfg.TELEGRAM_BOT_TOKEN)/sendMessage" -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 20 | Out-Null
    }
}
function Code([string]$url, [string[]]$extra = @()) {
    $c = & curl.exe -s -m 25 -o NUL -w "%{http_code}" @extra $url 2>$null
    return "$c"
}
$eth = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "Ethernet*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
$failures = @{}
$checks = @(
    @{ n = "lsevincare.com (global site, B)";  u = "https://lsevincare.com/api/health";    ok = "200"; x = @() },
    @{ n = "api.lsevin.com (API, B)";          u = "https://api.lsevin.com/readiness";     ok = "200"; x = @() },
    @{ n = "crm.lsevin.com";                   u = "https://crm.lsevin.com/api/health";    ok = "200"; x = @() }
)
if ($eth) { $checks += @{ n = "lsevin.ir (Iranian site, A) from the Iranian line"; u = "https://lsevin.ir/app-health"; ok = "204"; x = @("--interface", $eth, "--noproxy", "*") } }
foreach ($c in $checks) { $r = Code $c.u $c.x; if ($r -ne $c.ok) { $failures[$c.n] = "HTTP $r (expected $($c.ok))" } }
# the alerter on B must have completed a cycle in the last 10 minutes
$sshKey = Join-Path $env:USERPROFILE ".ssh\lsevin_b"
$beat = & ssh -i $sshKey -o BatchMode=yes -o ConnectTimeout=20 agent@202.133.90.50 "cat /var/lib/lsevin-alerter/last-cycle; echo; date +%s" 2>$null
if ($beat -and $beat.Count -ge 2) {
    $age = [int]$beat[1] - [int]$beat[0]
    if ($age -gt 600) { $failures["alerter on server B"] = "no monitoring cycle for $([int]($age/60)) minutes" }
} else { $failures["server B over SSH"] = "cannot connect (B down, or this PC's network)" }

$state = @{ failing = @{}; notified = @{} }
if (Test-Path $stateFile) { $s = Get-Content $stateFile -Raw | ConvertFrom-Json; if ($s) { $s.failing.PSObject.Properties | ForEach-Object { $state.failing[$_.Name] = [int]$_.Value }; $s.notified.PSObject.Properties | ForEach-Object { $state.notified[$_.Name] = $_.Value } } }
$lines = @(); $rec = @()
foreach ($k in $failures.Keys) {
    $state.failing[$k] = 1 + [int]$state.failing[$k]
    if ($state.failing[$k] -ge 2 -and -not $state.notified[$k]) { $state.notified[$k] = $true; $lines += "DOWN: $k - $($failures[$k])" }
}
foreach ($k in @($state.failing.Keys)) {
    if (-not $failures.ContainsKey($k)) { if ($state.notified[$k]) { $rec += "RECOVERED: $k" }; $state.failing.Remove($k); $state.notified.Remove($k) }
}
if ($lines.Count -or $rec.Count) { Send ("LSevin watchdog (admin PC)`n" + (($lines + $rec) -join "`n")) }
$state | ConvertTo-Json -Depth 4 | Set-Content $stateFile -Encoding utf8
if ($failures.Count -eq 0) { Write-Host "all checks OK" } else { $failures.GetEnumerator() | ForEach-Object { Write-Host "$($_.Key): $($_.Value)" } }
