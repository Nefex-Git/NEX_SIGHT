import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface DataAnalysisRequest {
  question: string;
  csvData?: any[];
  dataSourceMetadata?: any;
}

interface DataAnalysisResponse {
  answer: string;
  chartData?: any;
  chartType?: string;
  kpiValue?: string;
  unit?: string;
}

export async function analyzeDataWithAI(request: DataAnalysisRequest): Promise<DataAnalysisResponse> {
  try {
    const { question, csvData, dataSourceMetadata } = request;

    // Prepare context for AI
    let context = `You are a business intelligence assistant analyzing data. Answer the user's question about their data.

User Question: ${question}`;

    if (csvData && csvData.length > 0) {
      const sampleData = csvData.slice(0, 5); // First 5 rows as sample
      const columns = Object.keys(csvData[0]);
      
      context += `\n\nData Context:
- Total rows: ${csvData.length}
- Columns: ${columns.join(', ')}
- Sample data: ${JSON.stringify(sampleData, null, 2)}`;
    }

    if (dataSourceMetadata) {
      context += `\n\nData Source Info: ${JSON.stringify(dataSourceMetadata, null, 2)}`;
    }

    context += `\n\nProvide your response in JSON format with the following structure:
{
  "answer": "Clear, concise answer to the question",
  "chartData": "If applicable, provide chart data structure",
  "chartType": "If applicable: line, bar, pie, or table",
  "kpiValue": "If this is a KPI question, provide the numeric value",
  "unit": "If applicable, the unit of measurement"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert business intelligence analyst. Analyze data and provide insights in JSON format."
        },
        {
          role: "user",
          content: context
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      answer: result.answer || "I couldn't analyze this data.",
      chartData: result.chartData,
      chartType: result.chartType,
      kpiValue: result.kpiValue,
      unit: result.unit
    };

  } catch (error) {
    console.error("AI analysis error:", error);
    return {
      answer: "Sorry, I encountered an error while analyzing your data. Please try again."
    };
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Save audio buffer to temporary file
    const tempPath = path.join(process.cwd(), 'temp', `audio-${Date.now()}.wav`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempPath, audioBuffer);
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
    });

    // Clean up temp file
    fs.unlinkSync(tempPath);

    return transcription.text;
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

export async function parseCSVFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

export function generateKPIFromQuestion(question: string, answer: string): { value: string; unit?: string } {
  // Extract numeric values and units from the answer
  const numberMatch = answer.match(/₹?[\d,]+\.?\d*/);
  const percentMatch = answer.match(/\d+\.?\d*%/);
  
  if (numberMatch) {
    return {
      value: numberMatch[0],
      unit: answer.includes('₹') ? 'INR' : undefined
    };
  }
  
  if (percentMatch) {
    return {
      value: percentMatch[0],
      unit: '%'
    };
  }
  
  // For other types of answers, try to extract the main value
  const words = answer.split(' ');
  for (const word of words) {
    if (/^\d+/.test(word)) {
      return { value: word };
    }
  }
  
  return { value: answer.slice(0, 50) }; // Fallback to first 50 chars
}
