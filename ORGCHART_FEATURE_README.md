# Organizational Chart Visualization Feature

## Overview

The Organizational Chart Visualization feature transforms flat Excel/CSV organizational data into interactive, hierarchical visual diagrams. This feature integrates seamlessly with your existing HRAI Mining Industry HR Management System.

## ✨ Key Features

### 🔄 **Data Input Methods**
- **File Upload**: Support for Excel (.xlsx, .xls) and CSV files up to 50MB
- **Text Input**: Direct paste of CSV data for quick testing
- **Sample Data**: Pre-loaded organizational structure for demonstration

### 📊 **Data Processing**
- **Intelligent Parsing**: Flexible column mapping with case-insensitive header detection
- **Hierarchical Transformation**: Converts flat tabular data into tree structures
- **Position Integration**: Shows personnel directly within their organizational units
- **Error Handling**: Comprehensive validation and user-friendly error messages

### 🎨 **Interactive Visualization**
- **ReactFlow Integration**: Professional node-based diagrams with smooth animations
- **Expandable Nodes**: Click to show/hide positions within each department
- **Multi-level Hierarchy**: Supports unlimited organizational depth
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Required Data Format

Your Excel/CSV file must contain the following columns (flexible header naming):

| Column | Description | Example |
|--------|-------------|---------|
| **Object ID** | Unique identifier for each record | `60000003` |
| **Object Description** | Name of the organizational unit | `BERAU COAL` |
| **Object Type** | `O` for Organization, `S` for Staff/Position | `O` |
| **Parent Relationship Obj ID** | ID of the parent organization | `60020668` |
| **Relationship (Text)** | Type of relationship | `is Managed by` |
| **Relationship Obj (Text)** | Manager or position holder name | `PRESIDENT DIRECTOR` |

### Sample Data Structure
```csv
Object Description,Object Type,Object ID,Parent Relationship Obj ID,Relationship (Text),Relationship Obj (Text)
BERAU COAL,O,60000003,60020668,is Managed by,PRESIDENT DIRECTOR
HRGS DIRECTORATE,O,60005578,60000003,is Managed by,CHIEF HUMAN RESOURCES OFFICER
HRGS BC DIVISION,O,60013867,60005578,is Managed by,BUSINESS PARTNER HEAD & HR HEAD BC
Business Partner Head & HR Head BC,S,60082897,60013867,Holder,Agus Dani Ariyanto
HR OPERATIONS DEPT,O,60018884,60013867,is Managed by,HR INDUSTRIAL & PEOPLE SENIOR MANAGER
HR Industrial & People Senior Manager,S,60016583,60018884,Holder,Tomy Indarto
```

## 🚀 How to Use

### Method 1: File Upload
1. Navigate to **"Org Chart Visualization"** in the top navigation
2. Select the **"File Upload"** tab
3. Click **"Select File"** and choose your Excel/CSV file
4. Click **"Process File"** to upload and visualize

### Method 2: CSV Text Input
1. Navigate to **"Org Chart Visualization"**
2. Select the **"Paste CSV Data"** tab  
3. Paste your CSV data into the text area
4. Click **"Process CSV Data"** to visualize

### Method 3: Sample Data
1. Navigate to **"Org Chart Visualization"**
2. Select the **"Sample Data"** tab
3. Click **"Load Sample Data"** to see a demonstration

## 🔧 API Endpoints

### Upload File
```
POST /api/org-chart/upload
Content-Type: multipart/form-data

Body: FormData with 'orgFile' field
```

### Process CSV Text
```
POST /api/org-chart/parse-text
Content-Type: application/json

Body: { "csvText": "your,csv,data..." }
```

### Get Sample Data
```
GET /api/org-chart/sample
```

## 💡 Features & Benefits

### ✅ **Immediate Visualization**
- **No Drilling Required**: All positions and personnel are visible immediately
- **Hierarchical Layout**: Clear parent-child relationships with connecting lines
- **Professional Styling**: Material-UI components with consistent branding

### ✅ **Large Data Support**  
- **Efficient Processing**: Handles 154,000+ rows efficiently
- **Memory Optimization**: Streaming data processing for large files
- **Progress Feedback**: Loading states and progress indicators

### ✅ **Interactive Controls**
- **Pan & Zoom**: Navigate large organizational structures
- **MiniMap**: Overview navigation for complex hierarchies
- **Collapsible Positions**: Toggle personnel visibility per department
- **Responsive Nodes**: Adaptive sizing based on content

### ✅ **Error Prevention**
- **File Validation**: Checks file type, size, and format
- **Column Mapping**: Flexible header detection and mapping
- **Data Validation**: Identifies and reports data inconsistencies
- **User Guidance**: Clear error messages and suggestions

## 🏗️ Technical Architecture

### Backend (Node.js/Express)
- **File Processing**: Multer middleware for secure file uploads
- **Data Parsing**: XLSX library for Excel/CSV processing  
- **Hierarchy Builder**: Custom algorithm for tree structure creation
- **API Layer**: RESTful endpoints with comprehensive error handling

### Frontend (React)
- **Component Architecture**: Modular, reusable React components
- **State Management**: React hooks for efficient state updates
- **Visualization Engine**: ReactFlow for interactive diagrams
- **UI Framework**: Material-UI for consistent design

### Data Flow
```
Excel/CSV File → Upload → Parse → Transform → Visualize → Interact
```

## 🔍 Troubleshooting

### Common Issues

**File Upload Fails**
- Ensure file size is under 50MB
- Verify file format is .xlsx, .xls, or .csv
- Check that required columns are present

**Missing Organizational Units**  
- Verify Parent-Child ID relationships are correct
- Check for circular references in the data
- Ensure Object Type values are 'O' or 'S'

**Visualization Not Showing**
- Confirm data was processed successfully (check success message)
- Try refreshing the page
- Check browser console for JavaScript errors

### Performance Optimization
- For files over 10MB, use CSV format when possible
- Consider splitting very large datasets into departments
- Use the text input method for quick testing with small datasets

## 🚦 Development Status

### ✅ Completed Features
- [x] File upload with validation
- [x] Excel/CSV parsing with flexible headers
- [x] Hierarchical data transformation  
- [x] Interactive ReactFlow visualization
- [x] Position integration within organizations
- [x] Material-UI integration
- [x] Error handling and user feedback
- [x] Navigation integration with existing app

### 🔄 Future Enhancements
- [ ] Export to PNG/PDF functionality
- [ ] Advanced filtering and search
- [ ] Organizational metrics dashboard
- [ ] Drag-and-drop node repositioning
- [ ] Bulk editing capabilities

## 📁 File Structure

```
src/
├── components/
│   ├── OrgChartVisualization.js    # Main visualization component
│   └── ExcelLikeTable.js          # Original assessment component
├── services/
│   └── orgChartParser.js           # Data processing service
└── App.js                          # Updated with navigation

server.js                           # Enhanced with org chart APIs
```

---

**Ready to visualize your organizational structure!** 🎯

Navigate to the "Org Chart Visualization" tab and start exploring your data in a whole new way.