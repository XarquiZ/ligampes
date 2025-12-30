$url = "https://github.com/stripe/stripe-cli/releases/download/v1.23.14/stripe_1.23.14_windows_x86_64.zip"
$zipPath = "stripe.zip"
$extractPath = "stripe_temp"

Write-Host "Downloading Stripe CLI..."
Invoke-WebRequest -Uri $url -OutFile $zipPath

Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

Write-Host "Installing..."
# Move stripe.exe to current folder
Move-Item -Path "$extractPath\stripe.exe" -Destination . -Force

Write-Host "Cleaning up..."
Remove-Item $zipPath
Remove-Item $extractPath -Recurse -Force

Write-Host "Stripe CLI installed successfully!"
Write-Host "Run '.\stripe login' to authenticate."
