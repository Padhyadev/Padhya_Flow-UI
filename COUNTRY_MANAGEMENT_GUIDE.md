# Country Management - Quick Start Guide

## 🎯 What Was Built

A complete 3-level hierarchical master data management system:
- **Level 1**: Countries (with timezone dropdown)
- **Level 2**: States/Regions (linked to countries)
- **Level 3**: Cities (linked to states and countries)

## 📁 File Structure

```
src/admin/
├── services/api/
│   ├── countryApi.ts      ← Country CRUD operations
│   ├── regionApi.ts       ← State CRUD operations
│   └── cityApi.ts         ← City CRUD operations
│
└── pages/countries/
    ├── CountryList.tsx    ← List all countries + "View States" button
    ├── CountryForm.tsx    ← Add/Edit country (with timezone dropdown)
    ├── StateList.tsx      ← List states for a country + "Add City" button
    ├── StateForm.tsx      ← Add/Edit state
    ├── CityList.tsx       ← List cities for a state
    └── CityForm.tsx       ← Add/Edit city
```

## 🚀 How to Use

### Step 1: Access Country Management
1. Login to admin panel
2. Look for **"Country Management"** in the sidebar
3. Click on **"Countries"**

### Step 2: Manage Countries
- **Add Country**: Click "Add Country" button
  - Fill: Country Name, Country Code, Currency Code
  - Select Time Zone from dropdown (populated from API)
  - Click "Save"
- **Edit Country**: Click edit icon (pencil) on any row
- **Delete Country**: Click delete icon (trash) on any row
- **View States**: Click the map icon to see states for that country

### Step 3: Manage States
- From Country list, click the **map icon** (View States)
- You'll see all states for that country
- **Add State**: Click "Add State" button
  - Fill: State Name, State Code
  - Click "Save" (countryId is auto-assigned)
- **Edit/Delete**: Use the action buttons
- **View Cities**: Click the city icon to see cities for that state

### Step 4: Manage Cities
- From State list, click the **city icon** (Add City)
- You'll see all cities for that state
- **Add City**: Click "Add City" button
  - Fill: City Name
  - Click "Save" (countryId and regionId are auto-assigned)
- **Edit/Delete**: Use the action buttons

## 🔗 Navigation Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  Countries List                                      │
│  /admin/countries                                    │
│                                                      │
│  [Country 1] [Edit] [Delete] [View States 🗺️]      │
│  [Country 2] [Edit] [Delete] [View States 🗺️]      │
└─────────────────────────────────────────────────────┘
                    ↓ Click "View States"
┌─────────────────────────────────────────────────────┐
│  States List - India                                 │
│  /admin/countries/1/states                          │
│                                                      │
│  [State 1] [Edit] [Delete] [Add City 🏙️]           │
│  [State 2] [Edit] [Delete] [Add City 🏙️]           │
└─────────────────────────────────────────────────────┘
                    ↓ Click "Add City"
┌─────────────────────────────────────────────────────┐
│  Cities List - Maharashtra, India                   │
│  /admin/countries/1/states/1/cities                 │
│                                                      │
│  [City 1] [Edit] [Delete]                           │
│  [City 2] [Edit] [Delete]                           │
└─────────────────────────────────────────────────────┘
```

## 🎨 Design Features

✅ **Consistent Design**: Matches existing pages (LeaveTypeList, etc.)
✅ **Pagination**: All list pages support pagination (5/10/25/50/100 entries)
✅ **Search**: Search functionality on all list pages
✅ **Breadcrumbs**: Shows hierarchy (Country → State → City)
✅ **Validation**: Form validation with error messages
✅ **Confirmations**: Delete confirmation dialogs
✅ **Toast Notifications**: Success/error messages
✅ **Loading States**: Spinner while data loads
✅ **Empty States**: Friendly messages when no data

## 🔌 API Endpoints Used

### Country
- List: `GET /api/CountryMaster/GetAllPage?start=0&length=100&sortColumnDir=asc`
- Get: `GET /api/CountryMaster/GetById?id=1`
- Save: `POST /api/CountryMaster/Add`
- Delete: `DELETE /api/CountryMaster/Delete?id=12&operatedBy=12`

### State (Region)
- List: `GET /api/RegionMaster/GetAllPage?start=0&length=100&sortColumnDir=asc`
- Get: `GET /api/RegionMaster/GetById?id=1`
- Save: `POST /api/RegionMaster/Add`
- Delete: `DELETE /api/RegionMaster/Delete?id=10&operatedBy=10`

### City
- List: `GET /api/CityMaster/GetAllPage?start=0&length=100&sortColumnDir=asc`
- Get: `GET /api/CityMaster/GetById?id=1`
- Save: `POST /api/CityMaster/Add`
- Delete: `DELETE /api/CityMaster/Delete?id=20&operatedBy=20`

### Timezone Dropdown
- `GET /api/Dropdown/LovMaster?Lov_column=timeZone`

## 📝 Data Flow

### Adding a Country
```json
{
  "createdBy": 0,
  "lastModifiedBy": 0,
  "countryId": 0,
  "countryName": "India",
  "countryCode": "IN",
  "currencyCode": "INR",
  "timeZone": "Asia/Kolkata"
}
```

### Adding a State
```json
{
  "createdBy": 0,
  "lastModifiedBy": 0,
  "regionId": 0,
  "countryId": 1,  // ← Auto-filled from URL
  "regionName": "Maharashtra",
  "regionCode": "MH"
}
```

### Adding a City
```json
{
  "createdBy": 0,
  "lastModifiedBy": 0,
  "cityId": 0,
  "countryId": 1,  // ← Auto-filled from URL
  "regionId": 5,   // ← Auto-filled from URL
  "cityName": "Mumbai"
}
```

## 🎯 Key Highlights

1. **Hierarchical Navigation**: Seamlessly navigate from Countries → States → Cities
2. **Auto-Association**: Child records automatically link to parent (no manual selection needed)
3. **Context Preservation**: State and country information passed through navigation
4. **Custom Actions**: Extra buttons in action column for hierarchical navigation
5. **Sidebar Integration**: Appears under "Country Management" group in sidebar
6. **Admin Fallback**: Automatically visible for SA Admin and Admin roles

## 🐛 Troubleshooting

**Q: Country Management not showing in sidebar?**
- Make sure you're logged in as Admin or SA Admin
- Check browser console for errors
- Refresh the page

**Q: Timezone dropdown is empty?**
- Check API endpoint: `/api/Dropdown/LovMaster?Lov_column=timeZone`
- Ensure API is returning data in correct format

**Q: States not filtering by country?**
- The filtering is done client-side after fetching all states
- Ensure countryId is being passed correctly in the URL

## ✨ Next Steps

You can now:
1. Test the complete flow: Add Country → Add State → Add City
2. Verify data is being saved to the backend
3. Test edit and delete operations
4. Check pagination and search functionality
5. Customize styling if needed (all uses existing CSS classes)

---

**Need Help?** All components follow the same pattern as existing pages like `LeaveTypeList.tsx` and `OfficeExpenseCategorySummary.tsx`.
