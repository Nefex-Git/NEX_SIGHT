/**
 * Data Masking Service
 * 
 * Generates dummy/masked data based on column schemas to preserve privacy.
 * This ensures real data is NEVER sent to external APIs like OpenAI.
 */

export interface ColumnSchema {
  name: string;
  type: string;
  sampleValues?: any[];
}

export interface DataSchema {
  columns: ColumnSchema[];
  rowCount: number;
}

/**
 * Infer column type from sample values
 */
export function inferColumnType(values: any[]): string {
  if (!values || values.length === 0) return 'string';
  
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'string';
  
  const sample = nonNullValues[0];
  
  // Check if it's a number
  if (typeof sample === 'number' || !isNaN(Number(sample))) {
    if (Number.isInteger(Number(sample))) {
      return 'integer';
    }
    return 'float';
  }
  
  // Check if it's a date
  if (sample instanceof Date || !isNaN(Date.parse(sample))) {
    return 'date';
  }
  
  // Check if it's a boolean
  if (typeof sample === 'boolean' || sample === 'true' || sample === 'false') {
    return 'boolean';
  }
  
  return 'string';
}

/**
 * Extract schema from real data without exposing actual values
 */
export function extractDataSchema(data: any[]): DataSchema {
  if (!data || data.length === 0) {
    return { columns: [], rowCount: 0 };
  }
  
  const columns: ColumnSchema[] = [];
  const columnNames = Object.keys(data[0]);
  
  for (const colName of columnNames) {
    const values = data.slice(0, 100).map(row => row[colName]); // Sample first 100 rows
    const type = inferColumnType(values);
    
    // Store sample values only for type inference, not actual data
    columns.push({
      name: colName,
      type,
      sampleValues: [] // Don't store real values
    });
  }
  
  return {
    columns,
    rowCount: data.length
  };
}

/**
 * Generate dummy data based on column type
 */
export function generateDummyValue(columnName: string, columnType: string, index: number): any {
  switch (columnType) {
    case 'integer':
      // Generate realistic integers based on column name
      if (columnName.toLowerCase().includes('id')) return index + 1;
      if (columnName.toLowerCase().includes('age')) return 20 + (index % 60);
      if (columnName.toLowerCase().includes('quantity') || columnName.toLowerCase().includes('count')) {
        return 10 + (index % 100);
      }
      if (columnName.toLowerCase().includes('price') || columnName.toLowerCase().includes('amount')) {
        return 100 + (index % 1000);
      }
      return Math.floor(Math.random() * 1000);
      
    case 'float':
      if (columnName.toLowerCase().includes('price') || columnName.toLowerCase().includes('amount')) {
        return parseFloat((50 + Math.random() * 500).toFixed(2));
      }
      if (columnName.toLowerCase().includes('rate') || columnName.toLowerCase().includes('percent')) {
        return parseFloat((Math.random() * 100).toFixed(2));
      }
      return parseFloat((Math.random() * 1000).toFixed(2));
      
    case 'date':
      const baseDate = new Date('2024-01-01');
      const daysOffset = index % 365;
      const date = new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
      
    case 'boolean':
      return index % 2 === 0;
      
    case 'string':
    default:
      // Generate realistic strings based on column name
      if (columnName.toLowerCase().includes('name')) {
        const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
        return names[index % names.length];
      }
      if (columnName.toLowerCase().includes('email')) {
        return `user${index}@example.com`;
      }
      if (columnName.toLowerCase().includes('city') || columnName.toLowerCase().includes('location')) {
        const cities = ['New York', 'London', 'Paris', 'Tokyo', 'Sydney', 'Berlin'];
        return cities[index % cities.length];
      }
      if (columnName.toLowerCase().includes('category') || columnName.toLowerCase().includes('type')) {
        const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
        return categories[index % categories.length];
      }
      if (columnName.toLowerCase().includes('status')) {
        const statuses = ['Active', 'Pending', 'Completed', 'Cancelled'];
        return statuses[index % statuses.length];
      }
      return `Value_${index}`;
  }
}

/**
 * Generate dummy dataset based on schema
 */
export function generateDummyData(schema: DataSchema, numRows: number = 10): any[] {
  const dummyData: any[] = [];
  
  for (let i = 0; i < numRows; i++) {
    const row: any = {};
    
    for (const column of schema.columns) {
      row[column.name] = generateDummyValue(column.name, column.type, i);
    }
    
    dummyData.push(row);
  }
  
  return dummyData;
}

/**
 * Create a privacy-safe data summary for AI
 */
export function createPrivacySafeDataSummary(data: any[]): string {
  const schema = extractDataSchema(data);
  const dummyData = generateDummyData(schema, 5); // Only 5 sample rows
  
  return `
Data Schema:
- Total rows: ${schema.rowCount}
- Columns: ${schema.columns.map(c => `${c.name} (${c.type})`).join(', ')}

Sample dummy data (for context only, not real data):
${JSON.stringify(dummyData, null, 2)}

NOTE: The sample data above is DUMMY DATA generated based on column types. Use it to understand the structure and write analysis code.
`;
}
