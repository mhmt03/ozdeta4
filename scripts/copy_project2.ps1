$src = 'C:\Users\Mehmet\OneDrive\Desktop\react\ozdeta3\ozdeta3c'
$dst = 'C:\Users\Mehmet\Projects\ozdeta3c'
function Copy-Dir($s, $d) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    Get-ChildItem -LiteralPath $s -Force | ForEach-Object {
        if ($_.PSIsContainer) {
            if ($_.Name -in @('node_modules', '.git')) { return }
            $childDst = Join-Path $d $_.Name
            Copy-Dir $_.FullName $childDst
        }
        else {
            $destFile = Join-Path $d $_.Name
            try { Copy-Item -LiteralPath $_.FullName -Destination $destFile -Force -ErrorAction Stop } catch { Write-Output "COPY_ERROR: $($_.FullName) -> $($_.Exception.Message)" }
        }
    }
}
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Dir $src $dst
Write-Output 'COPY_DONE'