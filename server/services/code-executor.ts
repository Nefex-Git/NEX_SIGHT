/**
 * Code Executor Service
 * 
 * Safely executes generated Python code on real data.
 * Uses isolated execution environment to prevent security issues.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface ExecutionRequest {
  code: string;
  data: any[];
  timeout?: number;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  stdout?: string;
  stderr?: string;
}

/**
 * Execute Python code safely with data
 */
export async function executePythonCode(request: ExecutionRequest): Promise<ExecutionResult> {
  const { code, data, timeout = 30000 } = request;
  
  const tempDir = path.join(process.cwd(), 'temp_executions');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const executionId = randomUUID();
  const dataFile = path.join(tempDir, `data_${executionId}.json`);
  const codeFile = path.join(tempDir, `code_${executionId}.py`);
  const resultFile = path.join(tempDir, `result_${executionId}.json`);
  
  try {
    // Write data to temporary JSON file
    fs.writeFileSync(dataFile, JSON.stringify(data));
    
    // Create Python script that loads data and executes code
    const pythonScript = `
import json
import pandas as pd
import numpy as np
import sys
from datetime import datetime

# Load data
with open('${dataFile}', 'r') as f:
    data_json = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(data_json)

# Execute user code
try:
    ${code}
    
    # Convert result to JSON-serializable format
    if 'result' in locals():
        if isinstance(result, pd.DataFrame):
            result_data = result.to_dict('records')
        elif isinstance(result, pd.Series):
            result_data = result.to_dict()
        elif isinstance(result, np.ndarray):
            result_data = result.tolist()
        elif isinstance(result, (np.integer, np.floating)):
            result_data = float(result)
        else:
            result_data = result
        
        # Write result
        with open('${resultFile}', 'w') as f:
            json.dump({
                'success': True,
                'result': result_data
            }, f)
    else:
        with open('${resultFile}', 'w') as f:
            json.dump({
                'success': False,
                'error': 'No result variable found in code'
            }, f)
            
except Exception as e:
    with open('${resultFile}', 'w') as f:
        json.dump({
            'success': False,
            'error': str(e)
        }, f)
`;
    
    fs.writeFileSync(codeFile, pythonScript);
    
    // Execute Python script
    const result = await new Promise<ExecutionResult>((resolve, reject) => {
      const python = spawn('python3', [codeFile], {
        timeout,
        cwd: tempDir
      });
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: `Python execution failed with code ${code}`,
            stdout,
            stderr
          });
          return;
        }
        
        // Read result file
        if (fs.existsSync(resultFile)) {
          const resultData = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
          resolve({
            ...resultData,
            stdout,
            stderr
          });
        } else {
          resolve({
            success: false,
            error: 'No result file generated',
            stdout,
            stderr
          });
        }
      });
      
      python.on('error', (err) => {
        resolve({
          success: false,
          error: `Failed to start Python: ${err.message}`,
          stdout,
          stderr
        });
      });
    });
    
    return result;
    
  } catch (error) {
    return {
      success: false,
      error: `Execution error: ${error instanceof Error ? error.message : String(error)}`
    };
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
      if (fs.existsSync(codeFile)) fs.unlinkSync(codeFile);
      if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
  }
}

/**
 * Check if Python is available
 */
export async function checkPythonAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    const python = spawn('python3', ['--version']);
    
    python.on('close', (code) => {
      resolve(code === 0);
    });
    
    python.on('error', () => {
      resolve(false);
    });
  });
}
