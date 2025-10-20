const XLSX = require('xlsx');
const path = require('path');

/**
 * Analyze Excel file structure to understand column mapping
 * @param {string} filePath - Path to Excel file
 */
function analyzeExcelStructure(filePath) {
  console.log('🔍 Analyzing Excel File Structure');
  console.log('=================================');
  
  try {
    // Read workbook
    console.log(`📁 Reading file: ${filePath}`);
    const workbook = XLSX.read(require('fs').readFileSync(filePath), { type: 'buffer' });
    
    // Show all sheets
    console.log(`📋 Available sheets: ${workbook.SheetNames.join(', ')}`);
    
    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    console.log(`\n📊 Analyzing sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    
    // Get range
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`📐 Sheet range: ${worksheet['!ref']} (${range.e.r + 1} rows, ${range.e.c + 1} columns)`);
    
    // Get headers (first row)
    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? cell.v : '');
    }
    
    console.log(`\n📋 Headers found (${headers.length} columns):`);
    headers.forEach((header, index) => {
      console.log(`   ${index + 1}. "${header}"`);
    });
    
    // Show sample data rows
    console.log(`\n📄 Sample data (first 5 rows):`);
    for (let row = 1; row <= Math.min(5, range.e.r); row++) {
      console.log(`\n   Row ${row + 1}:`);
      for (let col = 0; col < Math.min(10, headers.length); col++) { // Show first 10 columns only
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        const value = cell ? cell.v : '';
        console.log(`      ${headers[col]}: "${value}"`);
      }
    }
    
    // Show data statistics
    console.log(`\n📊 Data Statistics:`);
    console.log(`   📁 Total rows (including header): ${range.e.r + 1}`);
    console.log(`   📝 Data rows: ${range.e.r}`);
    console.log(`   📋 Total columns: ${range.e.c + 1}`);
    
    return {
      headers,
      totalRows: range.e.r + 1,
      dataRows: range.e.r,
      totalColumns: range.e.c + 1,
      sheetName
    };
    
  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error.message);
    throw error;
  }
}

// Run analysis if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node analyze-excel.js <excel-file-path>');
    console.log('Example: node analyze-excel.js "EXPORT all OU(AutoRecovered).xlsx"');
    process.exit(0);
  }
  
  const excelFilePath = args[0];
  
  try {
    analyzeExcelStructure(excelFilePath);
  } catch (error) {
    console.error('💥 Analysis failed:', error.message);
    process.exit(1);
  }
}

module.exports = analyzeExcelStructure;