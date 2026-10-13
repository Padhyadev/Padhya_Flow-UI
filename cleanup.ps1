# PadhyaFlow Cleanup Script
# Removes all files except User Role Management features

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleaning up PadhyaFlow Project" -ForegroundColor Cyan
Write-Host "Keeping only User Role Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to safely remove directory
function Remove-SafeDirectory {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item -Path $Path -Recurse -Force
        Write-Host "[OK] Deleted $Path" -ForegroundColor Green
    } else {
        Write-Host "[SKIP] $Path not found" -ForegroundColor Yellow
    }
}

# Function to safely remove file
function Remove-SafeFile {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item -Path $Path -Force
        Write-Host "[OK] Deleted $Path" -ForegroundColor Green
    }
}

# Delete entire frontend pages directory
Write-Host "`nDeleting frontend pages..." -ForegroundColor White
Remove-SafeDirectory "src\pages"

# Delete frontend components
Write-Host "`nDeleting frontend components..." -ForegroundColor White
Remove-SafeDirectory "src\components"

# Delete frontend assets
Write-Host "`nDeleting frontend assets..." -ForegroundColor White
Remove-SafeDirectory "src\assets"

# Delete frontend data
Write-Host "`nDeleting frontend data..." -ForegroundColor White
Remove-SafeDirectory "src\data"

# Delete unnecessary admin pages
Write-Host "`nDeleting unnecessary admin pages..." -ForegroundColor White
Remove-SafeDirectory "src\admin\pages\areas"
Remove-SafeDirectory "src\admin\pages\cities"
Remove-SafeDirectory "src\admin\pages\locations"
Remove-SafeDirectory "src\admin\pages\properties"
Remove-SafeDirectory "src\admin\pages\property-amenities"
Remove-SafeDirectory "src\admin\pages\property-categories"
Remove-SafeDirectory "src\admin\pages\property-types"
Remove-SafeDirectory "src\admin\pages\sub-property-types"
Remove-SafeDirectory "src\admin\pages\leads"
Remove-SafeDirectory "src\admin\pages\lead-followups"
Remove-SafeDirectory "src\admin\pages\lead-timelines"
Remove-SafeDirectory "src\admin\pages\leadSources"
Remove-SafeDirectory "src\admin\pages\services"
Remove-SafeDirectory "src\admin\pages\reminders"
Remove-SafeDirectory "src\admin\pages\reports"
Remove-SafeDirectory "src\admin\pages\dashboards"
Remove-SafeDirectory "src\admin\pages\dashboard"

# Delete individual unnecessary files
Write-Host "`nDeleting unnecessary admin page files..." -ForegroundColor White
Remove-SafeFile "src\admin\pages\AreaWisePropertyCount.tsx"
Remove-SafeFile "src\admin\pages\AvailablePropertiesList.tsx"
Remove-SafeFile "src\admin\pages\ErrorLogViewer.tsx"
Remove-SafeFile "src\admin\pages\LeadSummaryListing.tsx"
Remove-SafeFile "src\admin\pages\PropertiesByCategory.tsx"
Remove-SafeFile "src\admin\pages\PropertySummaryListing.tsx"
Remove-SafeFile "src\admin\pages\RoleAPIDebug.tsx"
Remove-SafeFile "src\admin\pages\TestAreaAPI.tsx"
Remove-SafeFile "src\admin\pages\TestCityAPI.tsx"
Remove-SafeFile "src\admin\pages\TestLocationAPI.tsx"
Remove-SafeFile "src\admin\pages\TestLogin.tsx"
Remove-SafeFile "src\admin\pages\TestRoleAPI.tsx"
Remove-SafeFile "src\admin\pages\TestUserAPI.tsx"

# Delete unnecessary admin services
Write-Host "`nDeleting unnecessary admin services..." -ForegroundColor White
Remove-SafeFile "src\admin\services\api\areaApi.ts"
Remove-SafeFile "src\admin\services\api\cityApi.ts"
Remove-SafeFile "src\admin\services\api\locationApi.ts"
Remove-SafeFile "src\admin\services\api\propertyApi.ts"
Remove-SafeFile "src\admin\services\api\propertyAmenityApi.ts"
Remove-SafeFile "src\admin\services\api\propertyCategoryApi.ts"
Remove-SafeFile "src\admin\services\api\propertyTypeApi.ts"
Remove-SafeFile "src\admin\services\api\subPropertyTypeApi.ts"
Remove-SafeFile "src\admin\services\api\leadApi.ts"
Remove-SafeFile "src\admin\services\api\leadFollowupApi.ts"
Remove-SafeFile "src\admin\services\api\leadTimelineApi.ts"
Remove-SafeFile "src\admin\services\api\leadSourceApi.ts"
Remove-SafeFile "src\admin\services\api\serviceApi.ts"
Remove-SafeFile "src\admin\services\api\reminderApi.ts"
Remove-SafeFile "src\admin\services\api\reportApi.ts"
Remove-SafeFile "src\admin\services\api\dashboardApi.ts"

# Delete public test files
Write-Host "`nDeleting public test files..." -ForegroundColor White
Remove-SafeFile "public\test-role-api.html"

# Delete root level test/example files
Write-Host "`nDeleting root level test files..." -ForegroundColor White
Remove-SafeFile "INTEGRATION_EXAMPLE_useErrorLogger.tsx"

# Delete frontend related files
Write-Host "`nDeleting frontend assets..." -ForegroundColor White
Remove-SafeFile "src\logo.svg"
Remove-SafeFile "src\App.css"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Remaining features:" -ForegroundColor Yellow
Write-Host "- User Management (Users, Roles, Menus)" -ForegroundColor White
Write-Host "- Role-based Menu Permissions" -ForegroundColor White
Write-Host "- Admin Dashboard" -ForegroundColor White
Write-Host "- Profile and Settings" -ForegroundColor White
Write-Host ""
