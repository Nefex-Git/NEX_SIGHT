import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
}

export default function VoiceButton({ 
  isRecording, 
  isTranscribing, 
  onClick, 
  disabled = false,
  size = "default"
}: VoiceButtonProps) {
  const getButtonClass = () => {
    if (isRecording) {
      return "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 voice-recording";
    }
    if (isTranscribing) {
      return "bg-gradient-to-r from-yellow-500 to-orange-500";
    }
    return "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600";
  };

  const sizeClasses = {
    sm: "p-2",
    default: "p-3", 
    lg: "p-4"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isTranscribing}
      className={cn(
        "relative rounded-full text-white transition-all duration-300",
        sizeClasses[size],
        getButtonClass()
      )}
      data-testid="button-voice-recording"
    >
      {isTranscribing ? (
        <Loader2 className={cn("animate-spin", iconSizes[size])} />
      ) : isRecording ? (
        <MicOff className={iconSizes[size]} />
      ) : (
        <Mic className={iconSizes[size]} />
      )}
      
      {isRecording && (
        <div className="absolute inset-0 rounded-full opacity-0 voice-recording animate-pulse" />
      )}
    </Button>
  );
}
