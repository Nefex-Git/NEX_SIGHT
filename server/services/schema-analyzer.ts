import { DataSource } from "@/lib/api";

export interface ColumnInfo {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface TableSchema {
  dataSourceId: string;
  tableName: string;
  schemaName?: string;
  columns: ColumnInfo[];
}

export interface TableRelationship {
  leftTable: string;
  leftColumn: string;
  rightTable: string;
  rightColumn: string;
  confidence: number; // 0-1 score
  type: 'primary-foreign' | 'name-match' | 'pattern';
}

export class SchemaAnalyzer {
  /**
   * Detect relationships between multiple table schemas
   */
  static detectRelationships(schemas: TableSchema[]): TableRelationship[] {
    const relationships: TableRelationship[] = [];

    // Compare each pair of tables
    for (let i = 0; i < schemas.length; i++) {
      for (let j = i + 1; j < schemas.length; j++) {
        const table1 = schemas[i];
        const table2 = schemas[j];
        
        // Find potential relationships
        const rels = this.findTableRelationships(table1, table2);
        relationships.push(...rels);
      }
    }

    // Sort by confidence and remove duplicates
    return this.deduplicateRelationships(relationships);
  }

  /**
   * Find relationships between two tables
   */
  private static findTableRelationships(
    table1: TableSchema,
    table2: TableSchema
  ): TableRelationship[] {
    const relationships: TableRelationship[] = [];

    // Strategy 1: Look for foreign key patterns
    // e.g., "product_id" in one table might relate to "id" in "products" table
    for (const col1 of table1.columns) {
      const normalizedCol1 = col1.name.toLowerCase();
      
      // Check if column name suggests it's a foreign key (ends with _id)
      if (normalizedCol1.endsWith('_id')) {
        const baseTableName = normalizedCol1.replace(/_id$/, '');
        const table2Name = this.getTableBaseName(table2.tableName);
        
        // Check if table2 name matches the base name
        if (table2Name.includes(baseTableName) || baseTableName.includes(table2Name)) {
          // Look for "id" column in table2
          const idColumn = table2.columns.find(c => c.name.toLowerCase() === 'id');
          if (idColumn) {
            relationships.push({
              leftTable: this.getFullTableName(table1),
              leftColumn: col1.name,
              rightTable: this.getFullTableName(table2),
              rightColumn: idColumn.name,
              confidence: 0.9,
              type: 'primary-foreign'
            });
          }
        }
      }
    }

    // Strategy 2: Exact column name matches (excluding common names)
    const commonColumns = new Set(['id', 'name', 'created_at', 'updated_at', 'status', 'type']);
    for (const col1 of table1.columns) {
      const normalizedCol1 = col1.name.toLowerCase();
      if (commonColumns.has(normalizedCol1)) continue;
      
      for (const col2 of table2.columns) {
        const normalizedCol2 = col2.name.toLowerCase();
        if (normalizedCol1 === normalizedCol2) {
          relationships.push({
            leftTable: this.getFullTableName(table1),
            leftColumn: col1.name,
            rightTable: this.getFullTableName(table2),
            rightColumn: col2.name,
            confidence: 0.7,
            type: 'name-match'
          });
        }
      }
    }

    // Strategy 3: Pattern-based matching
    // e.g., "category_id" relates to "id" if one table is named "categories"
    for (const col1 of table1.columns) {
      const normalizedCol1 = col1.name.toLowerCase();
      if (!normalizedCol1.includes('_id')) continue;
      
      for (const col2 of table2.columns) {
        const normalizedCol2 = col2.name.toLowerCase();
        
        // Extract the base name from col1 (e.g., "category" from "category_id")
        const parts1 = normalizedCol1.split('_');
        parts1.pop(); // Remove 'id'
        const baseName1 = parts1.join('_');
        
        // Check if col2 or table2 name contains this base
        const table2Name = this.getTableBaseName(table2.tableName);
        if ((normalizedCol2 === 'id' || normalizedCol2 === baseName1) &&
            (table2Name.includes(baseName1) || baseName1.includes(table2Name))) {
          relationships.push({
            leftTable: this.getFullTableName(table1),
            leftColumn: col1.name,
            rightTable: this.getFullTableName(table2),
            rightColumn: col2.name,
            confidence: 0.8,
            type: 'pattern'
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Remove duplicate relationships, keeping highest confidence
   */
  private static deduplicateRelationships(relationships: TableRelationship[]): TableRelationship[] {
    const seen = new Map<string, TableRelationship>();
    
    for (const rel of relationships) {
      const key = `${rel.leftTable}.${rel.leftColumn}-${rel.rightTable}.${rel.rightColumn}`;
      const reverseKey = `${rel.rightTable}.${rel.rightColumn}-${rel.leftTable}.${rel.leftColumn}`;
      
      const existing = seen.get(key) || seen.get(reverseKey);
      if (!existing || rel.confidence > existing.confidence) {
        seen.set(key, rel);
        seen.delete(reverseKey);
      }
    }
    
    return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get full table name with schema
   */
  private static getFullTableName(schema: TableSchema): string {
    return schema.schemaName ? `${schema.schemaName}.${schema.tableName}` : schema.tableName;
  }

  /**
   * Get base table name (without schema, lowercase)
   */
  private static getTableBaseName(tableName: string): string {
    const parts = tableName.split('.');
    const name = parts[parts.length - 1];
    return name.toLowerCase();
  }

  /**
   * Generate SQL JOIN clauses from relationships
   */
  static generateJoinClauses(relationships: TableRelationship[], primaryTable: string): string[] {
    const joins: string[] = [];
    const joinedTables = new Set<string>([primaryTable]);
    const pendingRelationships = [...relationships];

    // Build joins incrementally, starting from primary table
    while (pendingRelationships.length > 0) {
      const nextRel = pendingRelationships.find(rel => 
        joinedTables.has(rel.leftTable) && !joinedTables.has(rel.rightTable)
      ) || pendingRelationships.find(rel =>
        joinedTables.has(rel.rightTable) && !joinedTables.has(rel.leftTable)
      );

      if (!nextRel) break; // No more joinable tables

      // Determine which table to join
      if (joinedTables.has(nextRel.leftTable)) {
        joins.push(`LEFT JOIN ${nextRel.rightTable} ON ${nextRel.leftTable}.${nextRel.leftColumn} = ${nextRel.rightTable}.${nextRel.rightColumn}`);
        joinedTables.add(nextRel.rightTable);
      } else {
        joins.push(`LEFT JOIN ${nextRel.leftTable} ON ${nextRel.rightTable}.${nextRel.rightColumn} = ${nextRel.leftTable}.${nextRel.leftColumn}`);
        joinedTables.add(nextRel.leftTable);
      }

      // Remove processed relationship
      const index = pendingRelationships.indexOf(nextRel);
      pendingRelationships.splice(index, 1);
    }

    return joins;
  }

  /**
   * Create a description of relationships for AI context
   */
  static describeRelationships(relationships: TableRelationship[]): string {
    if (relationships.length === 0) {
      return "No relationships detected between tables.";
    }

    const descriptions = relationships.map(rel => 
      `- ${rel.leftTable}.${rel.leftColumn} relates to ${rel.rightTable}.${rel.rightColumn} (confidence: ${Math.round(rel.confidence * 100)}%)`
    );

    return `Detected Relationships:\n${descriptions.join('\n')}`;
  }
}
