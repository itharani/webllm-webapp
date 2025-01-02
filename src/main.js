import * as webllm from "https://esm.run/@mlc-ai/web-llm";

const modelLoadingDiv = document.getElementById("modelLoading");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const responseDiv = document.getElementById("response");

const initProgressCallback = (progress) => {
  if (typeof progress === "number" && !isNaN(progress)) {
    modelLoadingDiv.textContent = `Loading model... ${Math.round(progress * 100)}% completed.`;
  } else {
    modelLoadingDiv.textContent = "Loading model... Please wait.";
  }
};

const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

async function setupEngine() {
  try {
    const engine = await webllm.CreateMLCEngine(selectedModel, { initProgressCallback });
    modelLoadingDiv.style.display = "none";
    userInput.disabled = false;
    sendBtn.disabled = false;

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

setupEngine();

