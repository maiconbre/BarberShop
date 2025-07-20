# Script PowerShell para alternar entre ambientes de desenvolvimento
# Uso: .\switch-env.ps1 [local|prod]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "prod", "development", "production")]
    [string]$Environment
)

# Cores para output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Função para verificar se arquivo existe
function Test-EnvFile {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        return $true
    } else {
        Write-ColorOutput "❌ Arquivo não encontrado: $FilePath" $Red
        return $false
    }
}

# Normalizar nome do ambiente
switch ($Environment.ToLower()) {
    "local" { $Environment = "development" }
    "prod" { $Environment = "production" }
}

# Definir caminhos
$SourceFile = ".env.$Environment"
$TargetFile = ".env"

Write-ColorOutput "🔄 Alternando para ambiente: $Environment" $Cyan
Write-ColorOutput "📁 Diretório atual: $(Get-Location)" $Yellow

# Verificar se arquivo de origem existe
if (-not (Test-EnvFile $SourceFile)) {
    Write-ColorOutput "❌ Falha ao alternar ambiente!" $Red
    exit 1
}

# Fazer backup do .env atual se existir
if (Test-Path $TargetFile) {
    $BackupFile = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $TargetFile $BackupFile
    Write-ColorOutput "💾 Backup criado: $BackupFile" $Yellow
}

# Copiar arquivo de ambiente
try {
    Copy-Item $SourceFile $TargetFile -Force
    Write-ColorOutput "✅ Ambiente alterado com sucesso para: $Environment" $Green
    
    # Mostrar configurações principais
    Write-ColorOutput "\n📋 Configurações ativas:" $Cyan
    
    $EnvContent = Get-Content $TargetFile
    $ApiUrl = ($EnvContent | Where-Object { $_ -match "^VITE_API_URL=" }) -replace "VITE_API_URL=", ""
    $DevMode = ($EnvContent | Where-Object { $_ -match "^VITE_DEV_MODE=" }) -replace "VITE_DEV_MODE=", ""
    $DebugApi = ($EnvContent | Where-Object { $_ -match "^VITE_DEBUG_API=" }) -replace "VITE_DEBUG_API=", ""
    
    Write-ColorOutput "   🌐 API URL: $ApiUrl" $Green
    Write-ColorOutput "   🔧 Dev Mode: $DevMode" $Green
    Write-ColorOutput "   🐛 Debug API: $DebugApi" $Green
    
    # Sugestões de próximos passos
    Write-ColorOutput "\n🚀 Próximos passos:" $Cyan
    if ($Environment -eq "development") {
        Write-ColorOutput "   npm run dev:local" $Yellow
        Write-ColorOutput "   (Certifique-se de que sua API local está rodando na porta 6543)" $Yellow
    } else {
        Write-ColorOutput "   npm run dev:prod" $Yellow
        Write-ColorOutput "   (Usando API de produção para testes)" $Yellow
    }
    
} catch {
    Write-ColorOutput "❌ Erro ao copiar arquivo: $($_.Exception.Message)" $Red
    exit 1
}

Write-ColorOutput "\n✨ Ambiente configurado com sucesso!" $Green