# Run in the folder containing restoranlar.json and gorseller.
# Put cwebp.exe in this folder, or add cwebp to PATH.
& {
    $ErrorActionPreference = 'Stop'
    $root = (Get-Location).Path
    $jsonPath = Join-Path $root 'restoranlar.json'
    $imageDir = Join-Path $root 'gorseller'
    $localEncoder = Join-Path $root 'cwebp.exe'
    $encoder = if (Test-Path -LiteralPath $localEncoder -PathType Leaf) {
        $localEncoder
    } else {
        (Get-Command cwebp -CommandType Application -ErrorAction Stop).Source
    }

    if (!(Test-Path -LiteralPath $imageDir -PathType Container)) {
        throw "Folder not found: $imageDir"
    }
    $raw = [IO.File]::ReadAllText($jsonPath, [Text.Encoding]::UTF8)
    if (!$raw.TrimStart().StartsWith('[')) {
        throw 'restoranlar.json must contain a JSON array.'
    }
    $records = @($raw | ConvertFrom-Json)
    $mapping = @{}
    $failed = 0
    $images = @(Get-ChildItem -LiteralPath $imageDir -File |
        Where-Object { $_.Extension -match '^\.(png|jpe?g)$' } |
        Sort-Object Name)

    foreach ($image in $images) {
        $tempImage = Join-Path $imageDir (([guid]::NewGuid().ToString('N')) + '.webp')
        try {
            # Quality 90; dimensions and alpha channel are preserved.
            & $encoder -quiet -q 90 -metadata all $image.FullName -o $tempImage
            if ($LASTEXITCODE -ne 0) { throw "cwebp exit code: $LASTEXITCODE" }
            if (!(Test-Path -LiteralPath $tempImage -PathType Leaf)) {
                throw 'No output image was created.'
            }
            if ((Get-Item -LiteralPath $tempImage).Length -eq 0) {
                throw 'The output image is empty.'
            }

            # Includes extension and collision suffix in the 50-character limit.
            $number = 1
            do {
                $suffix = if ($number -eq 1) { '' } else { "-$number" }
                $maxBase = 50 - '.webp'.Length - $suffix.Length
                $base = $image.BaseName.Substring(0, [Math]::Min($image.BaseName.Length, $maxBase))
                $newName = "$base$suffix.webp"
                $target = Join-Path $imageDir $newName
                $number++
            } while (Test-Path -LiteralPath $target)

            # Move fails instead of overwriting an existing destination.
            [IO.File]::Move($tempImage, $target)
            $mapping[$image.Name] = $newName
            Write-Host "$($image.Name) -> $newName"
        } catch {
            $failed++
            Write-Warning "$($image.Name): $($_.Exception.Message)"
        } finally {
            if (Test-Path -LiteralPath $tempImage) {
                Remove-Item -LiteralPath $tempImage -Force
            }
        }
    }

    $updated = 0
    foreach ($record in $records) {
        if ($null -ne $record.gorselAdi -and $mapping.ContainsKey([string]$record.gorselAdi)) {
            $record.gorselAdi = $mapping[[string]$record.gorselAdi]
            $updated++
        }
    }

    if ($updated -gt 0) {
        $token = [guid]::NewGuid().ToString('N')
        $backup = Join-Path $root "restoranlar.$token.bak.json"
        $tempJson = Join-Path $root "restoranlar.$token.tmp.json"
        try {
            # -InputObject preserves the array even with only one record.
            $json = ConvertTo-Json -InputObject $records -Depth 100
            [IO.File]::WriteAllText($tempJson, $json, [Text.UTF8Encoding]::new($false))
            # Replace JSON and back up the original in the same operation.
            [IO.File]::Replace($tempJson, $jsonPath, $backup)
            Write-Host "JSON backup: $backup"
        } finally {
            if (Test-Path -LiteralPath $tempJson) {
                Remove-Item -LiteralPath $tempJson -Force
            }
        }
    }
    Write-Host "Converted images: $($mapping.Count) | Updated records: $updated | Failed: $failed"
}
