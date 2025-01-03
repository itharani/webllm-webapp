"use client";

import { CreateServiceWorkerMLCEngine, CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

// Select the model you want to use
const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

// Callback function to show model loading progress
const initProgressCallback = (initProgress) => {
  console.log(initProgress);
  // Optionally update a progress bar or display status to the user
  document.getElementById("modelLoading").textContent = `Loading: ${initProgress}`;
};

// Function to handle Web Worker setup
async function setupWebWorker() {
  // Create the Web Worker
  const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });

  // Create the engine using the Web Worker
  const engine = await CreateWebWorkerMLCEngine(worker, selectedModel, { initProgressCallback });
  
  return engine;
}

// Function to handle Service Worker setup
async function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Register the Service Worker script
    await navigator.serviceWorker.register(new URL('./sw.js', import.meta.url), { type: 'module' });

    // Create the engine using the Service Worker
    const engine = await CreateServiceWorkerMLCEngine(selectedModel, { initProgressCallback });
    
    return engine;
  } else {
    console.error('Service Workers are not supported in this browser.');
    return null;
  }
}

// Function to initialize the model with the correct engine
async function initializeModel() {
  let engine;

  // Attempt to use Service Worker first (for offline capabilities)
  engine = await setupServiceWorker();

  if (!engine) {
    // Fall back to Web Worker if Service Worker setup fails
    engine = await setupWebWorker();
  }

  if (!engine) {
    console.error("Model initialization failed.");
    return;
  }

  console.log("Model initialized successfully.");
  
  return engine;
}

// Event listener for user input
document.getElementById("sendBtn").addEventListener("click", async () => {
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  const engine = await initializeModel();
  if (!engine) return;

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: userInput },
  ];

  const chatOptions = {
    messages,
    temperature: 0.7,
    stream: true, // Enable streaming for incremental response generation
    stream_options: { include_usage: true },
    onUpdate: (message, chunk) => {
      document.getElementById("response").textContent += chunk; // Update the UI with each chunk of response
    },
    onError: (errorMessage) => {
      console.error("Error:", errorMessage);
      document.getElementById("response").textContent = `Error: ${errorMessage}`;
    },
    onFinish: (reply, stopReason, usage) => {
      console.log("Reply:", reply);
      console.log("Stop Reason:", stopReason);
      console.log("Usage:", usage);
      document.getElementById("response").textContent = reply;
    },
  };

  try {
    const chunks = await engine.chat.completions.create(chatOptions);
    let fullReply = "";
    for await (const chunk of chunks) {
      fullReply += chunk.choices[0]?.delta.content || "";
      console.log(fullReply);
      if (chunk.usage) {
        console.log(chunk.usage);
      }
    }
  } catch (err) {
    console.error("Chat Error:", err);
    document.getElementById("response").textContent = "Failed to generate response.";
  }
});

// Initialize the model when the page loads
initializeModel().catch((err) => {
  console.error("Model initialization failed:", err);
});
