# export_project.ps1
$outputFile = "..\project_export.txt"
$projectRoot = Get-Location

# Function to check if a file is text (skip binaries)
function IsTextFile($path) {
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    $textExt = @('.java', '.ts', '.js', '.html', '.css', '.scss', '.json', '.xml', '.properties', '.yml', '.yaml', '.md', '.txt', '.gradle', '.kt')
    return $textExt -contains $ext
}

# Start output
"=== PROJECT STRUCTURE (tree) ===" | Out-File $outputFile -Encoding utf8
tree /F | Out-File $outputFile -Append -Encoding utf8

"`n`n=== FILE CONTENTS (only text files) ===" | Out-File $outputFile -Append -Encoding utf8

# Walk through all files, excluding common binary/build folders
Get-ChildItem -Recurse -File | Where-Object {
    $_.FullName -notmatch "\\node_modules\\|\\target\\|\\dist\\|\\\.git\\|\\\.idea\\|\\\.vscode\\|\\\.angular\\|\\build\\|\\out\\|\\logs\\|\\\.class$|\.jar$|\.png$|\.jpg$|\.gif$|\.ico$|\.pdf$|\.exe$"
} | ForEach-Object {
    if (IsTextFile $_.FullName) {
        $relativePath = $_.FullName.Substring($projectRoot.Path.Length + 1)
        "`n>>>> FILE: $relativePath <<<<" | Out-File $outputFile -Append -Encoding utf8
        try {
            Get-Content $_.FullName -Raw -Encoding UTF8 | Out-File $outputFile -Append -Encoding utf8
        } catch {
            "!! Could not read file (maybe binary) !!" | Out-File $outputFile -Append -Encoding utf8
        }
    }
}

Write-Host "Export complete. File: $outputFile"