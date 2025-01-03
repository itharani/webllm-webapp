import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// Elements for UI interaction
const modelLoadingDiv = document.getElementById("modelLoading");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const responseDiv = document.getElementById("response");

// Utility function for logging status on the page
const logStatus = (message, append = false) => {
  if (append) {
    modelLoadingDiv.innerHTML += `<br>${message}`;
  } else {
    modelLoadingDiv.textContent = message;
  }
};

// Progress callback to update the loading status
const initProgressCallback = (progress) => {
  if (typeof progress === "number" && !isNaN(progress)) {
    logStatus(`Loading model... ${Math.round(progress * 100)}% completed.`, true);
  } else {
    logStatus("Loading model... Please wait.", true);
  }
};

// Define the model to load
const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

// Check for WebGPU support
const isWebGPUAvailable = () => "gpu" in navigator;

// Check for WebGL support
const isWebGLAvailable = () => typeof WebGLRenderingContext !== "undefined";

// Function to initialize the engine
async function setupEngine() {
  try {
    let engine;

    // Log device and support details
    logStatus(`Device Info: ${navigator.userAgent}`, true);
    logStatus(`WebGPU Supported: ${isWebGPUAvailable()}`, true);
    logStatus(`WebGL Supported: ${isWebGLAvailable()}`, true);

    // Attempt to initialize the engine with fallback
    try {
      if (isWebGPUAvailable()) {
        logStatus("Initializing model with WebGPU...", true);
        engine = await webllm.CreateMLCEngine(selectedModel, { runtime: "webgpu", initProgressCallback });
      } else if (isWebGLAvailable()) {
        logStatus("WebGPU not available. Falling back to WebGL...", true);
        engine = await webllm.CreateMLCEngine(selectedModel, { runtime: "webgl", initProgressCallback });
      } else {
        logStatus("WebGPU and WebGL not supported. Using CPU backend.", true);
        engine = await webllm.CreateMLCEngine(selectedModel, { runtime: "cpu", initProgressCallback });
      }
    } catch (error) {
      logStatus(`Error during initialization: ${error.message}`, true);
      console.error("Initialization Error Details:", error);
      throw error;
    }

    // Once engine is ready, enable the UI elements
    logStatus("Model loaded successfully.", true);
    modelLoadingDiv.style.display = "none";
    userInput.disabled = false;
    sendBtn.disabled = false;

    // Event listener for generating a response
    sendBtn.addEventListener("click", async () => {
      const userMessage = userInput.value.trim();
      if (!userMessage) return;

      // Show loading indicator
      responseDiv.innerHTML = `<div class="loading">Generating response...</div>`;

      const messages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: userMessage },
      ];

      try {
        const reply = await engine.chat.completions.create({ messages });
        responseDiv.textContent = reply.choices[0].message.content;
      } catch (err) {
        responseDiv.textContent = "Error: Unable to generate response.";
        logStatus(`Error generating response: ${err.message}`, true);
        console.error("Response Generation Error:", err);
      }
    });
  } catch (error) {
    logStatus("Error: Failed to load model.", true);
    console.error("Engine Setup Error:", error);
  }
}

// Start setting up the engine
setupEngine();
