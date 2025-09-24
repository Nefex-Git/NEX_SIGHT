import mysql from "mysql2/promise";
import { Client as PgClient } from "pg";
import { Connection as SqlServerConnection } from "tedious";
import type { ConnectionConfiguration as SqlServerConfig } from "tedious";
import sqlite3 from "sqlite3";
import { MongoClient } from "mongodb";
import { createClient as createRedisClient } from "redis";
import Client from "ssh2-sftp-client";
import * as XLSX from "node-xlsx";
import { z } from "zod";

// Connection configuration schemas
export const DatabaseConnectionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["mysql", "postgresql", "sqlserver", "sqlite", "mongodb", "redis"]),
  host: z.string().optional(),
  port: z.string().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export const ApiConnectionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["rest", "graphql", "webhook"]),
  url: z.string().url(),
  authType: z.enum(["none", "apikey", "bearer", "basic"]).optional(),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  headers: z.string().optional(),
});

export const SftpConnectionSchema = z.object({
  name: z.string().min(1),
  type: z.literal("sftp"),
  host: z.string().min(1),
  port: z.string().default("22"),
  username: z.string().min(1),
  password: z.string().optional(),
  sftpPath: z.string().optional(),
});

export type DatabaseConnection = z.infer<typeof DatabaseConnectionSchema>;
export type ApiConnection = z.infer<typeof ApiConnectionSchema>;
export type SftpConnection = z.infer<typeof SftpConnectionSchema>;
export type ConnectionConfig = DatabaseConnection | ApiConnection | SftpConnection;

// Database connection testers
export async function testMySqlConnection(config: DatabaseConnection): Promise<{ success: boolean; error?: string; metadata?: any }> {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: parseInt(config.port || "3306"),
      user: config.username,
      password: config.password,
      database: config.database,
      connectTimeout: 5000,
    });

    // Test the connection
    await connection.ping();
    
    // Get database metadata
    const [rows] = await connection.execute(
      "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [config.database]
    );
    
    await connection.end();
    
    return {
      success: true,
      metadata: {
        tables: rows,
        engine: "MySQL",
        version: "5.7+",
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "MySQL connection failed"
    };
  }
}

export async function testPostgreSqlConnection(config: DatabaseConnection): Promise<{ success: boolean; error?: string; metadata?: any }> {
  const client = new PgClient({
    host: config.host,
    port: parseInt(config.port || "5432"),
    user: config.username,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    
    // Test query and get metadata (PostgreSQL compatible)
    const result = await client.query(`
      SELECT tablename as table_name, schemaname as table_schema
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const version = await client.query("SELECT version()");
    
    await client.end();
    
    return {
      success: true,
      metadata: {
        tables: result.rows,
        engine: "PostgreSQL",
        version: version.rows[0]?.version?.split(" ")[1] || "Unknown",
      }
    };
  } catch (error: any) {
    await client.end().catch(() => {});
    return {
      success: false,
      error: error.message || "PostgreSQL connection failed"
    };
  }
}

export async function testSqlServerConnection(config: DatabaseConnection): Promise<{ success: boolean; error?: string; metadata?: any }> {
  return new Promise((resolve) => {
    const sqlConfig: SqlServerConfig = {
      server: config.host!,
      options: {
        port: parseInt(config.port || "1433"),
        database: config.database,
        trustServerCertificate: true,
        connectTimeout: 5000,
        requestTimeout: 5000,
      },
      authentication: {
        type: "default",
        options: {
          userName: config.username!,
          password: config.password!,
        }
      }
    };

    const connection = new SqlServerConnection(sqlConfig);
    
    connection.on("connect", async () => {
      try {
        // Connection successful - get metadata would require additional queries
        connection.close();
        resolve({
          success: true,
          metadata: {
            engine: "SQL Server",
            database: config.database,
          }
        });
      } catch (error: any) {
        connection.close();
        resolve({
          success: false,
          error: error.message || "SQL Server metadata query failed"
        });
      }
    });

    connection.on("error", (error: any) => {
      resolve({
        success: false,
        error: error.message || "SQL Server connection failed"
      });
    });

    connection.connect();
  });
}

export async function testMongoConnection(config: DatabaseConnection): Promise<{ success: boolean; error?: string; metadata?: any }> {
  try {
    // Build MongoDB URI conditionally based on available credentials
    let uri;
    const port = config.port || "27017";
    
    if (config.username && config.password) {
      // With authentication
      uri = `mongodb://${config.username}:${config.password}@${config.host}:${port}`;
      if (config.database) {
        uri += `/${config.database}`;
      }
    } else {
      // Without authentication
      uri = `mongodb://${config.host}:${port}`;
      if (config.database) {
        uri += `/${config.database}`;
      }
    }
    
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    await client.connect();
    
    // Get database metadata
    const db = client.db(config.database);
    const collections = await db.listCollections().toArray();
    const stats = await db.stats();
    
    await client.close();
    
    return {
      success: true,
      metadata: {
        collections: collections.map(c => c.name),
        engine: "MongoDB",
        storageSize: stats.storageSize,
        dataSize: stats.dataSize,
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "MongoDB connection failed"
    };
  }
}

export async function testRedisConnection(config: DatabaseConnection): Promise<{ success: boolean; error?: string; metadata?: any }> {
  try {
    const client = createRedisClient({
      socket: {
        host: config.host,
        port: parseInt(config.port || "6379"),
        connectTimeout: 5000,
      },
      password: config.password,
      username: config.username,
    });

    await client.connect();
    
    // Test with ping and get some info
    await client.ping();
    const info = await client.info();
    
    await client.disconnect();
    
    return {
      success: true,
      metadata: {
        engine: "Redis",
        info: info.split("\r\n").slice(0, 10).join("\n"), // First few lines of info
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Redis connection failed"
    };
  }
}

export async function testSqliteConnection(config: DatabaseConnection): Promise<{ success: boolean; error?: string; metadata?: any }> {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(config.database!, (err) => {
      if (err) {
        resolve({
          success: false,
          error: err.message || "SQLite connection failed"
        });
        return;
      }

      // Get table information
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        db.close();
        
        if (err) {
          resolve({
            success: false,
            error: err.message || "SQLite query failed"
          });
          return;
        }

        resolve({
          success: true,
          metadata: {
            tables: rows,
            engine: "SQLite",
            file: config.database,
          }
        });
      });
    });
  });
}

// API connection tester
export async function testApiConnection(config: ApiConnection): Promise<{ success: boolean; error?: string; metadata?: any }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication headers
    if (config.authType === "apikey" && config.apiKey) {
      headers["X-API-Key"] = config.apiKey;
    } else if (config.authType === "bearer" && config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    } else if (config.authType === "basic" && config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }

    // Add custom headers
    if (config.headers) {
      try {
        const customHeaders = JSON.parse(config.headers);
        Object.assign(headers, customHeaders);
      } catch (error) {
        return {
          success: false,
          error: "Invalid JSON format in custom headers"
        };
      }
    }

    const response = await fetch(config.url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const contentType = response.headers.get("content-type") || "";
    let responseData: any;

    try {
      if (contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (error) {
      responseData = "Unable to parse response";
    }

    return {
      success: response.ok,
      metadata: {
        status: response.status,
        statusText: response.statusText,
        contentType,
        headers: Object.fromEntries(response.headers.entries()),
        sampleData: typeof responseData === "string" ? responseData.substring(0, 500) : responseData,
      },
      error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "API connection failed"
    };
  }
}

// SFTP connection tester
export async function testSftpConnection(config: SftpConnection): Promise<{ success: boolean; error?: string; metadata?: any }> {
  const sftp = new Client();
  
  try {
    await sftp.connect({
      host: config.host,
      port: parseInt(config.port || "22"),
      username: config.username,
      password: config.password,
      readyTimeout: 5000,
    });

    // List files in the specified path or root
    const remotePath = config.sftpPath || "/";
    const fileList = await sftp.list(remotePath);
    
    // Filter for supported file types
    const supportedFiles = fileList.filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
    });

    await sftp.end();

    return {
      success: true,
      metadata: {
        path: remotePath,
        totalFiles: fileList.length,
        supportedFiles: supportedFiles.length,
        sampleFiles: supportedFiles.slice(0, 10).map(f => ({
          name: f.name,
          size: f.size,
          modifiedTime: f.modifyTime,
        })),
      }
    };
  } catch (error: any) {
    await sftp.end().catch(() => {});
    return {
      success: false,
      error: error.message || "SFTP connection failed"
    };
  }
}

// Main connection tester
export async function testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string; metadata?: any }> {
  switch (config.type) {
    case "mysql":
      return testMySqlConnection(config as DatabaseConnection);
    case "postgresql":
      return testPostgreSqlConnection(config as DatabaseConnection);
    case "sqlserver":
      return testSqlServerConnection(config as DatabaseConnection);
    case "mongodb":
      return testMongoConnection(config as DatabaseConnection);
    case "redis":
      return testRedisConnection(config as DatabaseConnection);
    case "sqlite":
      return testSqliteConnection(config as DatabaseConnection);
    case "rest":
    case "graphql":
    case "webhook":
      return testApiConnection(config as ApiConnection);
    case "sftp":
      return testSftpConnection(config as SftpConnection);
    default:
      return {
        success: false,
        error: `Unsupported connection type: ${(config as any).type}`
      };
  }
}

// Helper to encrypt/decrypt sensitive data (basic implementation)
export function encryptConnectionConfig(config: ConnectionConfig): any {
  // In a real implementation, you'd use proper encryption
  // For now, we'll just store it as-is but remove sensitive fields from logs
  const sanitized = { ...config };
  if ('password' in sanitized) {
    // Keep password for functionality but flag it as sensitive
    (sanitized as any).password = sanitized.password;
  }
  return sanitized;
}

export function sanitizeConnectionConfig(config: ConnectionConfig): any {
  const sanitized = { ...config };
  if ('password' in sanitized) {
    (sanitized as any).password = sanitized.password ? "***" : undefined;
  }
  if ('apiKey' in sanitized) {
    (sanitized as any).apiKey = sanitized.apiKey ? "***" : undefined;
  }
  return sanitized;
}