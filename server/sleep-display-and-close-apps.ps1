# ディスプレイをスリープさせる前に、cmd/PowerShell系の端末以外のGUIアプリを終了する。
# 終了対象は「可視ウィンドウを持つプロセス」のみ。バックグラウンドサービスやexplorer/dwm等の
# OSシェル部品はほぼ可視ウィンドウを持たないため、この絞り込みで自然に除外される。

$keepProcessNames = @('cmd', 'powershell', 'pwsh', 'WindowsTerminal', 'conhost')

Get-Process | Where-Object {
    $_.MainWindowHandle -ne 0 -and ($keepProcessNames -notcontains $_.ProcessName)
} | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -ErrorAction Stop
    } catch {
        Write-Warning "Could not stop $($_.ProcessName) (Id=$($_.Id)): $_"
    }
}

Start-Sleep -Seconds 2

sal o New-Object
$f = 'System.Windows.Forms'
Add-Type -AssemblyName $f
$m = (o "$f.Message")::Create((o "$f.Form").Handle, 274, 61808, 2)
(o "$f.NativeWindow").DefWndProc([ref]$m)
