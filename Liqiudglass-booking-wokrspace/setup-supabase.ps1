# setup-supabase.ps1
# This script automates the Supabase setup based on environment variables.
# Required environment variables:
# $env:PROJECT_REF
# $env:SUPABASE_DB_PASSWORD
# $env:SUPABASE_URL
# $env:SUPABASE_ANON_KEY
# $env:SUPABASE_SERVICE_ROLE_KEY

$ErrorActionPreference = "Stop"

function Write-SetupInfo($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-SetupError($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

try {
    # 1. Check Supabase CLI
    Write-SetupInfo "Checking Supabase CLI..."
    try {
        supabase --version | Out-Null
    }
    catch {
        Write-SetupError "Supabase CLI is not installed. Please install it first (e.g., scoop install supabase)."
        exit 1
    }

    # 2. Supabase Init
    if (-not (Test-Path "supabase/config.toml")) {
        Write-SetupInfo "Initializing Supabase project..."
        supabase init
    }

    # 3. Supabase Link
    Write-SetupInfo "Linking to project $env:PROJECT_REF..."
    if (-not $env:PROJECT_REF -or -not $env:SUPABASE_DB_PASSWORD) {
        Write-SetupError "Missing PROJECT_REF or SUPABASE_DB_PASSWORD environment variables."
        exit 1
    }
    supabase link --project-ref "$env:PROJECT_REF" --password "$env:SUPABASE_DB_PASSWORD" --non-interactive

    # 4. Apply Migrations
    Write-SetupInfo "Pushing database migrations..."
    supabase db push --linked --non-interactive

    # 5. Run Seed
    if (Test-Path "supabase/seed_services.sql") {
        Write-SetupInfo "Applying seed data (services)..."
        # Using db execute to run the seed file on the remote database
        supabase db execute --linked --file "supabase/seed_services.sql" --non-interactive
    }

    # 6. Update Environment Files
    Write-SetupInfo "Updating .env files..."
    
    $webEnvPath = "web/.env.local"
    $apiEnvPath = "api/.env"

    $webEnvContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$env:SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY
"@

    $apiEnvContent = @"
# Supabase Configuration
DATABASE_URL=postgresql://postgres:$($env:SUPABASE_DB_PASSWORD)@db.$($env:PROJECT_REF).supabase.co:5432/postgres
SUPABASE_URL=$env:SUPABASE_URL
SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY
"@

    Set-Content -Path $webEnvPath -Value $webEnvContent -Force
    Set-Content -Path $apiEnvPath -Value $apiEnvContent -Force

    # 7. Sanity Check
    Write-SetupInfo "Running sanity checks..."
    $checkSql = "SELECT count(*) FROM public.services; SELECT count(*) FROM public.bookings;"
    $result = supabase db execute --linked --query "$checkSql" --non-interactive
    
    Write-SetupInfo "Sanity check results:"
    Write-SetupInfo $result

    Write-Host "OK" -ForegroundColor Green
    Write-SetupInfo "Next steps: 1. Restart your development servers. 2. Verify the login flow."

}
catch {
    Write-SetupError "Setup failed: $($_.Exception.Message)"
    Write-Host "FAIL" -ForegroundColor Red
    exit 1
}
