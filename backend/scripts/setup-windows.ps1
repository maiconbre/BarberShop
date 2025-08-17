# PowerShell Script para Configuração do Ambiente Barber Backend (Windows)
# Executar como: powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1

param(
    [switch]$Local,
    [switch]$Supabase,
    [switch]$Docker,
    [switch]$Interactive
)

# Configurações de cores
$colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Question = "Magenta"
}

function Write-ColorMessage {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Test-PostgreSQL {
    Write-ColorMessage "🔍 Verificando PostgreSQL..." "Info"
    
    try {
        $service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
        if ($service) {
            Write-ColorMessage "   ✅ PostgreSQL encontrado: $($service.Name)" "Success"
            
            if ($service.Status -eq "Running") {
                Write-ColorMessage "   ✅ Serviço está rodando" "Success"
                return $true
            } else {
                Write-ColorMessage "   ⚠️  Serviço está parado, iniciando..." "Warning"
                Start-Service $service.Name
                Start-Sleep -Seconds 3
                return $true
            }
        } else {
            Write-ColorMessage "   ❌ PostgreSQL não encontrado" "Error"
            return $false
        }
    } catch {
        Write-ColorMessage "   ❌ Erro ao verificar PostgreSQL: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Test-PostgreSQLConnection {
    param($HostName, $Port, $User, $Password, $Database)
    
    try {
        $env:PGPASSWORD = $Password
        $result = & "psql" -h $HostName -p $Port -U $User -d $Database -c "SELECT version();" 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Create-Database {
    param($HostName, $Port, $User, $Password, $Database)
    
    Write-ColorMessage "🗄️  Criando banco de dados '$Database'..." "Info"
    
    try {
        $env:PGPASSWORD = $Password
        & "createdb" -h $HostName -p $Port -U $User $Database 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorMessage "   ✅ Banco criado com sucesso" "Success"
            return $true
        } else {
            Write-ColorMessage "   ⚠️  Banco já existe ou erro ao criar" "Warning"
            return $true
        }
    } catch {
        Write-ColorMessage "   ❌ Erro ao criar banco: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Install-PostgreSQL {
    Write-ColorMessage "📦 Instalando PostgreSQL via Chocolatey..." "Info"
    
    try {
        if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
            Write-ColorMessage "   ❌ Chocolatey não encontrado. Instalando manualmente..." "Warning"
            Write-ColorMessage "   Por favor, instale PostgreSQL manualmente: https://www.postgresql.org/download/windows/" "Error"
            return $false
        }
        
        choco install postgresql -y
        Write-ColorMessage "   ✅ PostgreSQL instalado via Chocolatey" "Success"
        return $true
    } catch {
        Write-ColorMessage "   ❌ Erro ao instalar PostgreSQL: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Setup-DockerPostgreSQL {
    Write-ColorMessage "🐳 Configurando PostgreSQL via Docker..." "Info"
    
    try {
        if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
            Write-ColorMessage "   ❌ Docker não encontrado" "Error"
            return $false
        }
        
        # Parar container existente se houver
        docker stop postgres-barber 2>$null
        docker rm postgres-barber 2>$null
        
        # Iniciar novo container
        docker run --name postgres-barber `
            -e POSTGRES_PASSWORD=postgres `
            -e POSTGRES_DB=barbershop `
            -p 5432:5432 `
            -d postgres:latest
        
        Write-ColorMessage "   ✅ Container PostgreSQL iniciado" "Success"
        Write-ColorMessage "   Host: localhost:5432" "Info"
        Write-ColorMessage "   User: postgres" "Info"
        Write-ColorMessage "   Password: postgres" "Info"
        Write-ColorMessage "   Database: barbershop" "Info"
        
        return $true
    } catch {
        Write-ColorMessage "   ❌ Erro ao configurar Docker: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Configure-EnvFile {
    param($Config)
    
    Write-ColorMessage "📝 Configurando arquivo .env..." "Info"
    
    $envPath = Join-Path $PSScriptRoot "..\.env"
    $envLocalPath = Join-Path $PSScriptRoot "..\.env.local"
    
    if ($Config.Type -eq "Local") {
        $content = @"
# Configuração de desenvolvimento local - PostgreSQL
NODE_ENV=development

# PostgreSQL local
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=barbershop

# JWT configuration
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1d

# Refresh token configuration
REFRESH_TOKEN_SECRET=dev_refresh_secret_key_change_in_production
REFRESH_TOKEN_EXPIRES_IN=7d

# Server configuration
PORT=8000
HOST=localhost

# Database SSL (desabilitar para desenvolvimento local)
DB_SSL=false

# Enable SQL logs for development
ENABLE_SQL_LOGS=true
"@
    } elseif ($Config.Type -eq "Docker") {
        $content = @"
# Configuração Docker PostgreSQL
NODE_ENV=development

# PostgreSQL via Docker
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=barbershop

# Resto das configurações...
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=dev_refresh_secret_key_change_in_production
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=8000
HOST=localhost
DB_SSL=false
ENABLE_SQL_LOGS=true
"@
    } else {
        Write-ColorMessage "   ✅ Mantendo configuração Supabase existente" "Info"
        return
    }
    
    $content | Out-File -FilePath $envPath -Encoding UTF8
    Write-ColorMessage "   ✅ Arquivo .env configurado" "Success"
}

function Test-NodeModules {
    Write-ColorMessage "📦 Verificando dependências..." "Info"
    
    $packageJson = Get-Content (Join-Path $PSScriptRoot "..\package.json") | ConvertFrom-Json
    
    if (!(Test-Path (Join-Path $PSScriptRoot "..\node_modules"))) {
        Write-ColorMessage "   📥 Instalando dependências..." "Info"
        npm install
        Write-ColorMessage "   ✅ Dependências instaladas" "Success"
    } else {
        Write-ColorMessage "   ✅ Dependências já instaladas" "Success"
    }
}

function Interactive-Setup {
    Write-ColorMessage "🔧 Configuração Interativa do Ambiente" "Question"
    Write-ColorMessage "==================================" "Question"
    
    Write-ColorMessage "
📋 Opções de configuração:" "Info"
    Write-ColorMessage "1. PostgreSQL Local (recomendado)" "Info"
    Write-ColorMessage "2. PostgreSQL via Docker" "Info"
    Write-ColorMessage "3. Supabase (cloud)" "Info"
    Write-ColorMessage "4. Sair" "Info"
    
    $choice = Read-Host "
Escolha uma opção (1-4)"
    
    switch ($choice) {
        "1" {
            if (Test-PostgreSQL) {
                Create-Database -HostName "localhost" -Port 5432 -User "postgres" -Password "postgres" -Database "barbershop"
                Configure-EnvFile -Config @{Type="Local"}
            } else {
                Write-ColorMessage "PostgreSQL não encontrado. Deseja instalar via Chocolatey? (s/n)" "Warning"
                $install = Read-Host
                if ($install -eq "s" -or $install -eq "S") {
                    if (Install-PostgreSQL) {
                        Start-Sleep -Seconds 10
                        Create-Database -HostName "localhost" -Port 5432 -User "postgres" -Password "postgres" -Database "barbershop"
                        Configure-EnvFile -Config @{Type="Local"}
                    }
                }
            }
        }
        "2" {
            if (Setup-DockerPostgreSQL) {
                Configure-EnvFile -Config @{Type="Docker"}
            }
        }
        "3" {
            Write-ColorMessage "Configuração Supabase mantida. Edite manualmente o arquivo .env se necessário." "Info"
        }
        "4" {
            Write-ColorMessage "Configuração cancelada." "Warning"
            exit 0
        }
    }
}

# Script principal
Write-ColorMessage "💈 Barber Backend - Configuração de Ambiente" "Question"
Write-ColorMessage "==========================================" "Question"

# Mudar para o diretório do backend
Set-Location (Split-Path $PSScriptRoot)

# Verificar se Node.js está instalado
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-ColorMessage "❌ Node.js não encontrado. Por favor, instale: https://nodejs.org/" "Error"
    exit 1
}

# Instalar dependências
Test-NodeModules

# Processar argumentos
if ($Local) {
    Write-ColorMessage "Configurando PostgreSQL local..." "Info"
    if (Test-PostgreSQL) {
        Create-Database -HostName "localhost" -Port 5432 -User "postgres" -Password "postgres" -Database "barbershop"
        Configure-EnvFile -Config @{Type="Local"}
    } else {
        Write-ColorMessage "PostgreSQL não encontrado. Use -Interactive para instalar." "Error"
    }
} elseif ($Docker) {
    Setup-DockerPostgreSQL
    Configure-EnvFile -Config @{Type="Docker"}
} elseif ($Supabase) {
    Write-ColorMessage "Configuração Supabase mantida." "Info"
} else {
    Interactive-Setup
}

# Testar conexão final
Write-ColorMessage "
🧪 Testando conexão..." "Info"
npm run db:test

Write-ColorMessage "
✅ Configuração concluída!" "Success"
Write-ColorMessage "
📋 Próximos passos:" "Info"
Write-ColorMessage "   npm run migrate:dev    # Executar migrações" "Info"
Write-ColorMessage "   npm run dev            # Iniciar servidor" "Info"