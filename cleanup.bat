@echo off
echo ========================================
echo Cleaning up PadhyaFlow Project
echo Keeping only User Role Management
echo ========================================
echo.

REM Delete entire frontend pages directory
echo Deleting frontend pages...
if exist "src\pages" (
    rmdir /s /q "src\pages"
    echo [OK] Deleted src\pages
)

REM Delete frontend components
echo Deleting frontend components...
if exist "src\components" (
    rmdir /s /q "src\components"
    echo [OK] Deleted src\components
)

REM Delete frontend assets
echo Deleting frontend assets...
if exist "src\assets" (
    rmdir /s /q "src\assets"
    echo [OK] Deleted src\assets
)

REM Delete frontend data
echo Deleting frontend data...
if exist "src\data" (
    rmdir /s /q "src\data"
    echo [OK] Deleted src\data
)

REM Delete unnecessary admin pages
echo Deleting unnecessary admin pages...
if exist "src\admin\pages\areas" (
    rmdir /s /q "src\admin\pages\areas"
    echo [OK] Deleted areas pages
)
if exist "src\admin\pages\cities" (
    rmdir /s /q "src\admin\pages\cities"
    echo [OK] Deleted cities pages
)
if exist "src\admin\pages\locations" (
    rmdir /s /q "src\admin\pages\locations"
    echo [OK] Deleted locations pages
)
if exist "src\admin\pages\properties" (
    rmdir /s /q "src\admin\pages\properties"
    echo [OK] Deleted properties pages
)
if exist "src\admin\pages\property-amenities" (
    rmdir /s /q "src\admin\pages\property-amenities"
    echo [OK] Deleted property-amenities pages
)
if exist "src\admin\pages\property-categories" (
    rmdir /s /q "src\admin\pages\property-categories"
    echo [OK] Deleted property-categories pages
)
if exist "src\admin\pages\property-types" (
    rmdir /s /q "src\admin\pages\property-types"
    echo [OK] Deleted property-types pages
)
if exist "src\admin\pages\sub-property-types" (
    rmdir /s /q "src\admin\pages\sub-property-types"
    echo [OK] Deleted sub-property-types pages
)
if exist "src\admin\pages\leads" (
    rmdir /s /q "src\admin\pages\leads"
    echo [OK] Deleted leads pages
)
if exist "src\admin\pages\lead-followups" (
    rmdir /s /q "src\admin\pages\lead-followups"
    echo [OK] Deleted lead-followups pages
)
if exist "src\admin\pages\lead-timelines" (
    rmdir /s /q "src\admin\pages\lead-timelines"
    echo [OK] Deleted lead-timelines pages
)
if exist "src\admin\pages\leadSources" (
    rmdir /s /q "src\admin\pages\leadSources"
    echo [OK] Deleted leadSources pages
)
if exist "src\admin\pages\services" (
    rmdir /s /q "src\admin\pages\services"
    echo [OK] Deleted services pages
)
if exist "src\admin\pages\reminders" (
    rmdir /s /q "src\admin\pages\reminders"
    echo [OK] Deleted reminders pages
)
if exist "src\admin\pages\reports" (
    rmdir /s /q "src\admin\pages\reports"
    echo [OK] Deleted reports pages
)
if exist "src\admin\pages\dashboards" (
    rmdir /s /q "src\admin\pages\dashboards"
    echo [OK] Deleted extra dashboards
)
if exist "src\admin\pages\dashboard" (
    rmdir /s /q "src\admin\pages\dashboard"
    echo [OK] Deleted dashboard subfolder
)

REM Delete individual unnecessary files
echo Deleting unnecessary admin page files...
if exist "src\admin\pages\AreaWisePropertyCount.tsx" del /q "src\admin\pages\AreaWisePropertyCount.tsx"
if exist "src\admin\pages\AvailablePropertiesList.tsx" del /q "src\admin\pages\AvailablePropertiesList.tsx"
if exist "src\admin\pages\ErrorLogViewer.tsx" del /q "src\admin\pages\ErrorLogViewer.tsx"
if exist "src\admin\pages\LeadSummaryListing.tsx" del /q "src\admin\pages\LeadSummaryListing.tsx"
if exist "src\admin\pages\PropertiesByCategory.tsx" del /q "src\admin\pages\PropertiesByCategory.tsx"
if exist "src\admin\pages\PropertySummaryListing.tsx" del /q "src\admin\pages\PropertySummaryListing.tsx"
if exist "src\admin\pages\RoleAPIDebug.tsx" del /q "src\admin\pages\RoleAPIDebug.tsx"
if exist "src\admin\pages\TestAreaAPI.tsx" del /q "src\admin\pages\TestAreaAPI.tsx"
if exist "src\admin\pages\TestCityAPI.tsx" del /q "src\admin\pages\TestCityAPI.tsx"
if exist "src\admin\pages\TestLocationAPI.tsx" del /q "src\admin\pages\TestLocationAPI.tsx"
if exist "src\admin\pages\TestLogin.tsx" del /q "src\admin\pages\TestLogin.tsx"
if exist "src\admin\pages\TestRoleAPI.tsx" del /q "src\admin\pages\TestRoleAPI.tsx"
if exist "src\admin\pages\TestUserAPI.tsx" del /q "src\admin\pages\TestUserAPI.tsx"
echo [OK] Deleted test and debug files

REM Delete unnecessary admin services
echo Deleting unnecessary admin services...
if exist "src\admin\services\api\areaApi.ts" del /q "src\admin\services\api\areaApi.ts"
if exist "src\admin\services\api\cityApi.ts" del /q "src\admin\services\api\cityApi.ts"
if exist "src\admin\services\api\locationApi.ts" del /q "src\admin\services\api\locationApi.ts"
if exist "src\admin\services\api\propertyApi.ts" del /q "src\admin\services\api\propertyApi.ts"
if exist "src\admin\services\api\propertyAmenityApi.ts" del /q "src\admin\services\api\propertyAmenityApi.ts"
if exist "src\admin\services\api\propertyCategoryApi.ts" del /q "src\admin\services\api\propertyCategoryApi.ts"
if exist "src\admin\services\api\propertyTypeApi.ts" del /q "src\admin\services\api\propertyTypeApi.ts"
if exist "src\admin\services\api\subPropertyTypeApi.ts" del /q "src\admin\services\api\subPropertyTypeApi.ts"
if exist "src\admin\services\api\leadApi.ts" del /q "src\admin\services\api\leadApi.ts"
if exist "src\admin\services\api\leadFollowupApi.ts" del /q "src\admin\services\api\leadFollowupApi.ts"
if exist "src\admin\services\api\leadTimelineApi.ts" del /q "src\admin\services\api\leadTimelineApi.ts"
if exist "src\admin\services\api\leadSourceApi.ts" del /q "src\admin\services\api\leadSourceApi.ts"
if exist "src\admin\services\api\serviceApi.ts" del /q "src\admin\services\api\serviceApi.ts"
if exist "src\admin\services\api\reminderApi.ts" del /q "src\admin\services\api\reminderApi.ts"
if exist "src\admin\services\api\reportApi.ts" del /q "src\admin\services\api\reportApi.ts"
if exist "src\admin\services\api\dashboardApi.ts" del /q "src\admin\services\api\dashboardApi.ts"
echo [OK] Deleted unnecessary API services

REM Delete public test files
echo Deleting public test files...
if exist "public\test-role-api.html" del /q "public\test-role-api.html"
echo [OK] Deleted public test files

REM Delete root level test/example files
echo Deleting root level test files...
if exist "INTEGRATION_EXAMPLE_useErrorLogger.tsx" del /q "INTEGRATION_EXAMPLE_useErrorLogger.tsx"
echo [OK] Deleted integration examples

REM Delete frontend related files
if exist "src\logo.svg" del /q "src\logo.svg"
if exist "src\App.css" del /q "src\App.css"
echo [OK] Deleted frontend assets

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Remaining features:
echo - User Management (Users, Roles, Menus)
echo - Role-based Menu Permissions
echo - Admin Dashboard
echo - Profile and Settings
echo.
pause
