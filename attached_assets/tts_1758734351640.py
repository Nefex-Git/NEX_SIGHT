import edge_tts

def speak(text: str):
    # example implementation
    communicate = edge_tts.Communicate(text, "en-IN-NeerjaNeural")
    return communicate.save("output.mp3")
