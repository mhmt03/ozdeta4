$src = 'C:\Users\Mehmet\OneDrive\Desktop\react\ozdeta3\ozdeta3c'
$dst = 'C:\Users\Mehmet\Projects\ozdeta3c'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
# Create directories (excluding node_modules and .git)
Get-ChildItem -Path $src -Directory -Recurse -Force | Where-Object { $_.FullName -notmatch '\\node_modules(\\|$)' -and $_.FullName -notmatch '\\\.git(\\|$)' } | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length).TrimStart('\')
    $destDir = Join-Path $dst $rel
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
}
# Copy files excluding node_modules and .git
Get-ChildItem -Path $src -File -Recurse -Force | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' } | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length).TrimStart('\')
    $destFile = Join-Path $dst $rel
    $destDir = Split-Path $destFile -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
    Copy-Item -Path $_.FullName -Destination $destFile -Force
}
Write-Output 'COPY_DONE'
