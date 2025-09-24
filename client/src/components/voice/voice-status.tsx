import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceStatusProps {
  isRecording: boolean;
  isTranscribing: boolean;
  onStop: () => void;
}

export default function VoiceStatus({ isRecording, isTranscribing, onStop }: VoiceStatusProps) {
  if (!isRecording && !isTranscribing) {
    return null;
  }

  return (
    <div className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-3 h-3 rounded-full",
          isRecording ? "bg-red-500 animate-pulse" : "bg-yellow-500"
        )} />
        <span className="text-sm">
          {isRecording ? "Listening... Speak your question" : "Processing your voice..."}
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onStop}
          className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          data-testid="button-stop-voice"
        >
          Stop
        </Button>
      </div>
    </div>
  );
}
