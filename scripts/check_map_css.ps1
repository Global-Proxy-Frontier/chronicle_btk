try {
  $html = (Invoke-WebRequest -Uri 'http://localhost:3000/map' -UseBasicParsing -ErrorAction Stop).Content
  if ($html -match 'href="(\/_next\/static\/css\/[^\"]+)"') {
    Write-Output $matches[1]
  } elseif ($html -match "href='(\/_next\/static\/css\/[^']+)'") {
    Write-Output $matches[1]
  } else {
    Write-Output 'NO_CSS'
  }
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
  exit 2
}
