import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { submitAiQuery, transcribeAudio, getDataSources, createKpiFromQuery } from "@/lib/api";
import { VoiceRecorder, SpeechRecognition } from "@/lib/voice";
import VoiceButton from "@/components/voice/voice-button";
import VoiceStatus from "@/components/voice/voice-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Brain, Send, User, Pin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ChartContainer from "@/components/dashboard/chart-container";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  chartData?: any;
  chartType?: string;
  kpiValue?: string;
  unit?: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedDataSource, setSelectedDataSource] = useState("all");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dataSources = [] } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => getDataSources(),
  });

  const aiQueryMutation = useMutation({
    mutationFn: ({ question, dataSourceId, isVoiceQuery }: { 
      question: string; 
      dataSourceId?: string; 
      isVoiceQuery?: boolean;
    }) => submitAiQuery(question, dataSourceId, isVoiceQuery),
    onSuccess: (response) => {
      const assistantMessage: ChatMessage = {
        id: response.id,
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(response.createdAt),
        chartData: response.chartData,
        chartType: response.chartType,
        kpiValue: response.kpiValue,
        unit: response.unit,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/ai/queries"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const kpiMutation = useMutation({
    mutationFn: ({ question, answer }: { question: string; answer: string }) => 
      createKpiFromQuery(question, answer),
    onSuccess: () => {
      toast({
        title: "KPI Created",
        description: "Question has been saved as a KPI on your dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
    },
    onError: (error) => {
      toast({
        title: "Error creating KPI",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    voiceRecorderRef.current = new VoiceRecorder();
    speechRecognitionRef.current = new SpeechRecognition();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (question: string, isVoiceQuery = false) => {
    if (!question.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
      isVoice: isVoiceQuery,
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Submit to AI
    aiQueryMutation.mutate({
      question: question.trim(),
      dataSourceId: selectedDataSource === "all" ? undefined : selectedDataSource,
      isVoiceQuery,
    });

    setInputValue("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  const handleVoiceRecording = async () => {
    if (!voiceRecorderRef.current) return;

    try {
      if (isRecording) {
        // Stop recording
        setIsRecording(false);
        setIsTranscribing(true);

        const audioBlob = await voiceRecorderRef.current.stopRecording();
        const { transcription } = await transcribeAudio(audioBlob);
        
        setIsTranscribing(false);
        
        if (transcription.trim()) {
          handleSubmit(transcription, true);
        } else {
          toast({
            title: "No speech detected",
            description: "Please try speaking again.",
            variant: "destructive",
          });
        }
      } else {
        // Start recording
        await voiceRecorderRef.current.startRecording();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setIsRecording(false);
      setIsTranscribing(false);
      
      // Try speech recognition as fallback only if available
      if (speechRecognitionRef.current?.isAvailable()) {
        try {
          const transcription = await speechRecognitionRef.current.startListening();
          if (transcription && transcription.trim()) {
            handleSubmit(transcription, true);
            return; // Success - exit early
          }
        } catch (speechError) {
          console.error('Speech recognition fallback error:', speechError);
        }
      }
      
      // Show error toast only if all methods failed
      toast({
        title: "Voice input failed",
        description: "Please check your microphone permissions and try typing instead.",
        variant: "destructive",
      });
    }
  };

  const handleCreateKpi = (question: string, answer: string) => {
    kpiMutation.mutate({ question, answer });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">NEX AI</h2>
        <p className="text-muted-foreground">
          Ask questions about your data using voice or text
        </p>
      </div>

      {/* Dataset Selection */}
      {dataSources.length > 0 && (
        <div className="mb-6">
          <Card className="p-4">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base">Dataset Selection</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose which datasets to analyze. Questions will be answered based on selected data only.
              </p>
            </CardHeader>
            <div className="space-y-3">
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource} data-testid="select-data-source">
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select target dataset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Available Datasets</SelectItem>
                  {dataSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} ({source.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedDataSource !== "all" && (
                <div className="text-sm p-3 bg-muted/50 rounded-lg border" data-testid="selected-dataset-info">
                  <div className="font-medium text-primary">
                    Analyzing: {dataSources.find(ds => ds.id === selectedDataSource)?.name}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Type: {dataSources.find(ds => ds.id === selectedDataSource)?.type} • 
                    Records: {dataSources.find(ds => ds.id === selectedDataSource)?.rowCount || 'Unknown'}
                  </div>
                </div>
              )}
              
              {selectedDataSource === "all" && dataSources.length > 1 && (
                <div className="text-sm p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800" data-testid="all-datasets-info">
                  <div className="font-medium text-blue-700 dark:text-blue-300">
                    Analyzing All Datasets ({dataSources.length} sources)
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 mt-1">
                    Questions will be answered using data from all available sources
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Voice Status */}
      <VoiceStatus 
        isRecording={isRecording} 
        isTranscribing={isTranscribing}
        onStop={handleVoiceRecording}
      />

      {/* Chat Interface */}
      <Card className="overflow-hidden">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="mx-auto h-12 w-12 mb-4 text-primary" />
              <p className="text-lg font-medium mb-2">Welcome to NEX AI</p>
              <p>Ask me anything about your data. I can help you analyze trends, create charts, and generate insights.</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                {message.type === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.type === 'user' ? 'You' : 'NEX-AI'}
                  </span>
                  {message.isVoice && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                      Voice
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-sm">{message.content}</div>
                
                {/* Chart Visualization */}
                {message.chartData && message.chartType && (
                  <div className="mt-4">
                    <ChartContainer
                      title="Generated Chart"
                      type={message.chartType as any}
                      data={message.chartData}
                    />
                  </div>
                )}
                
                {/* Action Buttons for Assistant Messages */}
                {message.type === 'assistant' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateKpi(
                        messages[messages.indexOf(message) - 1]?.content || '',
                        message.content
                      )}
                      disabled={kpiMutation.isPending}
                      data-testid="button-create-kpi"
                    >
                      <Pin className="h-3 w-3 mr-1" />
                      Pin as KPI
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {aiQueryMutation.isPending && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
            <VoiceButton
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              onClick={handleVoiceRecording}
            />
            
            <div className="flex-1">
              <Input
                placeholder="Ask anything about your data..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={aiQueryMutation.isPending}
                data-testid="input-ai-query"
              />
            </div>
            
            <Button
              type="submit"
              disabled={!inputValue.trim() || aiQueryMutation.isPending}
              data-testid="button-send-query"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
