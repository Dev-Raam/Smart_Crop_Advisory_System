$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$sitePackages = Join-Path $scriptDir "venv\Lib\site-packages"

if (-not (Test-Path $bundledPython)) {
  throw "Bundled Python runtime not found at $bundledPython"
}

$env:PYTHONPATH = $sitePackages
Push-Location $scriptDir
try {
  & $bundledPython train_pest_model.py
} finally {
  Pop-Location
}
