$content = [System.IO.File]::ReadAllText("c:\Users\kenne\OneDrive\Desktop\gfa accra forms\app.js")
$csvData = [System.IO.File]::ReadAllText("c:\Users\kenne\OneDrive\Desktop\gfa accra forms\data.csv")

$csvDataLines = $csvData.Split("`n")
$pins = @()

foreach ($line in $csvDataLines) {
    $parts = $line.Trim().Split(',')
    if ($parts.Length -eq 2) {
        $pins += @{
            serial = $parts[0].Trim()
            pin = $parts[1].Trim()
            used = $false
            formData = $null
        }
    }
}

$pinsJson = $pins | ConvertTo-Json -Depth 5 -Compress

$newInitDb = "function initDatabase() {`r`n    if (!localStorage.getItem('gfa_database_v2')) {`r`n        let pins = $pinsJson;`r`n        localStorage.setItem('gfa_database', JSON.stringify(pins));`r`n        localStorage.setItem('gfa_database_v2', 'true');`r`n        console.log('Database initialized with ' + pins.length + ' pins.');`r`n    }`r`n}"

$patternInit = '(?s)function initDatabase\(\)\s*\{.*?\}\r?\n\}'
$content = $content -replace $patternInit, $newInitDb

$patternFix1 = '(?s)// Populate data safely.*?\}\s*\}'
$newFix1 = @"
            // Populate data safely
            let data = record.formData;
            for (let key in data) {
                let elems = form.elements[key];
                if (!elems) continue;

                if (elems.length !== undefined && elems.type !== 'select-one') {
                    // Radio buttons or multiple inputs
                    Array.from(elems).forEach(el => {
                        if (el.value === data[key]) el.checked = true;
                    });
                } else {
                    if (elems.type === 'checkbox') {
                        elems.checked = (data[key] === true || data[key] === "on");
                    } else {
                        elems.value = data[key];
                    }
                }
            }

            // Fix read only mode
            Array.from(form.elements).forEach(el => {
                if (el.id !== 'btn-submit' && el.id !== 'current-serial') {
                    el.disabled = true;
                    if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'file') {
                        el.style.pointerEvents = 'none';
                    }
                }
            });
"@
$content = $content -replace $patternFix1, $newFix1

$patternFix2 = '(?s)const pUpload = document\.getElementById\(''passport-upload''\);.*?pUpload\.style\.background = "transparent";\r?\n\s*\}'
$newFix2 = @"
            const pUpload = document.getElementById('passport-upload');
            if (pUpload) {
                pUpload.type = "text";
                pUpload.value = "Image stored securely.";
                pUpload.style.border = "none";
                pUpload.style.background = "transparent";
                pUpload.disabled = true;
            }
"@
$content = $content -replace $patternFix2, $newFix2

[System.IO.File]::WriteAllText("c:\Users\kenne\OneDrive\Desktop\gfa accra forms\app.js", $content, [System.Text.Encoding]::UTF8)
Write-Output "Update Successful"
