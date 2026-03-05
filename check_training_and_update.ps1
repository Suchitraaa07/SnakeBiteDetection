# Monitor training and auto-update model when done
$logPath = "training_improved.log"
$bestModelPath = "runs\detect\models\snake_bite_detector\weights\best.pt"
$outputPath = "models\snake_model.pt"

Write-Host "Monitoring training progress..." -ForegroundColor Cyan
Write-Host "This will auto-update the model when training completes" -ForegroundColor Cyan
Write-Host ""

$lastCheck = 0
while ($true) {
    $logContent = Get-Content $logPath -Tail 50 -ErrorAction SilentlyContinue
    $allContent = [string]::Join("`n", $logContent)
    
    if ($allContent -match "epochs completed") {
        Write-Host "✅ Training Complete!" -ForegroundColor Green
        
        # Check if best model exists
        if (Test-Path $bestModelPath) {
            Write-Host "Copying best model to $outputPath..." -ForegroundColor Yellow
            Copy-Item -Path $bestModelPath -Destination $outputPath -Force
            
            if (Test-Path $outputPath) {
                Write-Host "✅ Model updated successfully!" -ForegroundColor Green
                Write-Host "You can now test inference with:" -ForegroundColor Cyan
                Write-Host "python utils/wound_inference.py data/test/images/image.jpg 0.15" -ForegroundColor Cyan
                break
            }
        } else {
            Write-Host "❌ Best model not found at $bestModelPath" -ForegroundColor Red
            break
        }
    } else {
        $lastLine = Get-Content $logPath -Tail 1 2>$null
        if ($lastLine) {
            Write-Host "Training in progress... $lastLine" -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 30
    }
}
