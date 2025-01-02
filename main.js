// import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// const modelLoadingDiv = document.getElementById("modelLoading");
// const sendBtn = document.getElementById("sendBtn");
// const userInput = document.getElementById("userInput");
// const responseDiv = document.getElementById("response");

// const initProgressCallback = (progress) => {
//   if (typeof progress === "number" && !isNaN(progress)) {
//     modelLoadingDiv.textContent = `Loading model... ${Math.round(progress * 100)}% completed.`;
//   } else {
//     modelLoadingDiv.textContent = "Loading model... Please wait.";
//   }
// };

// const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

// async function setupEngine() {
//   try {
//     const engine = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
//     modelLoadingDiv.style.display = "none";
//     userInput.disabled = false;
//     sendBtn.disabled = false;

//     sendBtn.addEventListener("click", async () => {
//       const userMessage = userInput.value.trim();
//       if (!userMessage) return;

//       // Show loading indicator
//       responseDiv.innerHTML = `<div class="loading">Generating response...</div>`;

//       const messages = [
//         { role: "system", content: "You are a helpful assistant." },
//         { role: "user", content: userMessage },
//       ];

//       try {
//         const reply = await engine.chat.completions.create({ messages });
//         responseDiv.textContent = reply.choices[0].message.content;
//       } catch (err) {
//         responseDiv.textContent = "Error: Unable to generate response.";
//         console.error(err);
//       }
//     });
//   } catch (error) {
//     modelLoadingDiv.textContent = "Error: Failed to load model.";
//     console.error(error);
//   }
// }

// setupEngine();

import * as webllm from "https://esm.run/@mlc-ai/web-llm";

// Elements for UI interaction
const modelLoadingDiv = document.getElementById("modelLoading");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const responseDiv = document.getElementById("response");

// Progress callback to update the loading status
const initProgressCallback = (progress) => {
  if (typeof progress === "number" && !isNaN(progress)) {
    modelLoadingDiv.textContent = `Loading model... ${Math.round(progress * 100)}% completed.`;
  } else {
    modelLoadingDiv.textContent = "Loading model... Please wait.";
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
      console.log("WebGPU supported. Initializing model with WebGPU.");
      engine = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
    } else if (isWebGLAvailable()) {
      console.log("WebGL supported. Initializing model with WebGL.");
      // You can modify this part to explicitly use WebGL if WebGPU is unavailable
      engine = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
    } else {
      console.log("WebGPU and WebGL not supported. Falling back to CPU.");
      // CPU fallback (You can implement an alternative engine setup here)
      engine = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
    }

    // Once engine is ready, enable the UI elements
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
        console.error(err);
      }
    });
  } catch (error) {
    modelLoadingDiv.textContent = "Error: Failed to load model.";
    console.error(error);
  }
}

// Start setting up the engine
setupEngine();

