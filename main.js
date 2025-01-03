import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// Elements for UI interaction
const modelLoadingDiv = document.getElementById("modelLoading");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const responseDiv = document.getElementById("response");
const statusDiv = document.getElementById("status"); // New element for logging status

// Utility function to log messages to the status section
const logStatus = (message, isError = false) => {
  const logMessage = document.createElement("div");
  logMessage.textContent = message;
  logMessage.style.color = isError ? "red" : "black"; // Red text for errors
  statusDiv.appendChild(logMessage);
  statusDiv.scrollTop = statusDiv.scrollHeight; // Auto-scroll to the latest log
};

// Progress callback to update the loading status
const initProgressCallback = (progress) => {
  if (typeof progress === "number" && !isNaN(progress)) {
    const message = `Loading model... ${Math.round(progress * 100)}% completed.`;
    modelLoadingDiv.textContent = message;
    logStatus(message);
  } else {
    const message = "Loading model... Please wait.";
    modelLoadingDiv.textContent = message;
    logStatus(message);
  }
};

const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

// Check for WebGPU support (modern browsers)
const isWebGPUAvailable = () => {
  return "gpu" in navigator; // WebGPU check
};

// Check for WebGL support (fallback for older browsers or environments)
const isWebGLAvailable = () => {
  return typeof WebGLRenderingContext !== "undefined"; // WebGL check
};

// Function to initialize the engine with fallbacks
async function setupEngine() {
  try {
    let engine;

    // Check WebGPU support and fallback to WebGL or CPU if not available
    if (isWebGPUAvailable()) {
      logStatus("WebGPU supported. Initializing model with WebGPU.");
      engine = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
    } else if (isWebGLAvailable()) {
      logStatus("WebGL supported. Initializing model with WebGL.");
      engine = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
    } else {
      logStatus("WebGPU and WebGL not supported. Falling back to CPU.");
      engine = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
    }

    // Once engine is ready, enable the UI elements
    modelLoadingDiv.style.display = "none";
    userInput.disabled = false;
    sendBtn.disabled = false;
    logStatus("Model successfully loaded. You can now interact with the chatbot.");

    // Event listener for generating a response
    sendBtn.addEventListener("click", async () => {
      const userMessage = userInput.value.trim();
      if (!userMessage) {
        logStatus("Error: Empty input message.", true);
        return;
      }

      // Show loading indicator
      responseDiv.innerHTML = `<div class="loading">Generating response...</div>`;
      logStatus(`User input: "${userMessage}"`);

      const messages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userMessage },
      ];

      try {
        const reply = await engine.chat.completions.create({ messages });
        const responseText = reply.choices[0].message.content;
        responseDiv.textContent = responseText;
        logStatus(`Response received: "${responseText}"`);
      } catch (err) {
        const errorMessage = `Error: Unable to generate response. ${err.message || err}`;
        responseDiv.textContent = errorMessage;
        logStatus(errorMessage, true);
        console.error(err);
      }
    });
  } catch (error) {
    const errorMessage = `Error: Failed to load model. ${error.message || error}`;
    modelLoadingDiv.textContent = errorMessage;
    logStatus(errorMessage, true);
    console.error(error);
  }
}

// Start setting up the engine
setupEngine();
