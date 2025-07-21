# Ollama Setup Instructions

## Prerequisites
1. Make sure you have Ollama installed on your system
2. If not installed, download from: https://ollama.ai

## Setup Steps

### 1. Start Ollama Service
```bash
# On macOS/Linux
ollama serve
```

### 2. Pull the Gemma Model
```bash
# Pull the gemma2:2b model (recommended for better performance)
ollama pull gemma2:2b

# Alternative: If you prefer the original gemma:1b (smaller but less capable)
ollama pull gemma:1b
```

### 3. Test the Model
```bash
# Test if the model works
ollama run gemma2:2b "Hello, how are you?"
```

### 4. Check if Ollama is Running
You can verify Ollama is running by visiting: http://localhost:11434

### 5. Start Your Server
```bash
cd server
npm run dev
```

## Environment Variables

Make sure your server `.env` file contains:
```
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
PORT=4000
```

## Troubleshooting

### Model Not Found Error
- Make sure you've pulled the model: `ollama pull gemma2:2b`
- Check available models: `ollama list`

### Connection Error
- Ensure Ollama service is running: `ollama serve`
- Check if port 11434 is accessible: `curl http://localhost:11434`

### Performance Issues
- Try using `gemma2:2b` instead of larger models for better performance
- Ensure you have enough RAM (at least 4GB free for gemma2:2b)

## Model Recommendations
- **gemma2:2b**: Best balance of performance and quality (recommended)
- **gemma:1b**: Smaller, faster, but less capable
- **gemma2:9b**: Higher quality but requires more resources
