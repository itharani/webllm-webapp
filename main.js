import * as webllm from "https://esm.run/@mlc-ai/web-llm"; // Import WebLLM library for AI model handling

/*************** WebLLM logic ***************/
const messages = [
  {
    content: "You are a helpful AI agent helping users.", // System message to initialize the conversation
    role: "system" // The role of the system message
  }
];

// Get a list of available models from the WebLLM configuration
const availableModels = webllm.prebuiltAppConfig.model_list.map(
  (m) => m.model_id // Map the model list to extract model IDs
);

// Set default model for selection
let selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

// Callback function to track the progress of engine initialization
function updateEngineInitProgressCallback(report) {
  console.log("initialize", report.progress); // Log initialization progress to the console
  document.getElementById("download-status").textContent = report.text; // Update the UI with progress status
}

// Create a new instance of the WebLLM engine
const engine = new webllm.MLCEngine();
engine.setInitProgressCallback(updateEngineInitProgressCallback); // Set callback for progress updates

// Initialize WebLLM engine with selected model and configuration
async function initializeWebLLMEngine() {
  document.getElementById("download-status").classList.remove("hidden"); // Show download status on the UI
  selectedModel = document.getElementById("model-selection").value; // Get selected model from UI dropdown
  const config = {
    temperature: 1.0, // Set temperature for the model (creativity of responses)
    top_p: 1 // Set top-p for the model (probability of selecting tokens)
  };
  await engine.reload(selectedModel, config); // Reload the engine with the selected model and configuration
}

// Function to handle streaming generation of the AI's response
async function streamingGenerating(messages, onUpdate, onFinish, onError) {
  try {
    let curMessage = ""; // Initialize variable to accumulate AI's response
    const completion = await engine.chat.completions.create({
      stream: true, // Set to stream the model's response as it's generated
      messages // Pass the conversation messages
    });
    
    // Loop through the streamed response chunks
    for await (const chunk of completion) {
      const curDelta = chunk.choices[0].delta.content; // Extract new content from the chunk
      if (curDelta) {
        curMessage += curDelta; // Accumulate content in the current message
      }
      onUpdate(curMessage); // Update the UI with the current message
    }
    
    // Get the final response after streaming is complete
    const finalMessage = await engine.getMessage();
    onFinish(finalMessage); // Finalize and display the AI's response
  } catch (err) {
    onError(err); // Handle any errors that occur during streaming
  }
}

/*************** UI logic ***************/
// Function to handle the sending of a message from the user
function onMessageSend() {
  const input = document.getElementById("user-input").value.trim(); // Get user input and trim any whitespace
  const message = {
    content: input, // Create a message object with the user's input
    role: "user" // Assign the role as "user"
  };
  if (input.length === 0) {
    return; // Do nothing if input is empty
  }
  
  document.getElementById("send").disabled = true; // Disable the send button while processing

  messages.push(message); // Add the user message to the messages array
  appendMessage(message); // Display the user message in the UI

  document.getElementById("user-input").value = ""; // Clear the user input field
  document
    .getElementById("user-input")
    .setAttribute("placeholder", "Generating..."); // Set the placeholder to indicate generating response

  const aiMessage = {
    content: "typing...", // Display a "typing..." message from the AI while waiting for the response
    role: "assistant" // Set the role as "assistant"
  };
  appendMessage(aiMessage); // Append the AI's "typing..." message to the UI

  // Callback function that runs when AI finishes generating a message
  const onFinishGenerating = (finalMessage) => {
    updateLastMessage(finalMessage); // Update the last message with the AI's final response
    document.getElementById("send").disabled = false; // Re-enable the send button
    engine.runtimeStatsText().then((statsText) => {
      document.getElementById("chat-stats").classList.remove("hidden"); // Show runtime stats
      document.getElementById("chat-stats").textContent = statsText; // Update stats on the UI
    });
  };

  // Start streaming generation of the AI's response
  streamingGenerating(
    messages,
    updateLastMessage,
    onFinishGenerating,
    console.error // Log any errors to the console
  );
}

// Function to append a message to the chat box in the UI
function appendMessage(message) {
  const chatBox = document.getElementById("chat-box"); // Get the chat box element
  const container = document.createElement("div"); // Create a new container div for the message
  container.classList.add("message-container"); // Add styling class for message container
  const newMessage = document.createElement("div"); // Create a new div for the message text
  newMessage.classList.add("message"); // Add styling class for the message text
  newMessage.textContent = message.content; // Set the message content

  // Style the message based on the role (user or assistant)
  if (message.role === "user") {
    container.classList.add("user"); // Apply user-specific styles
  } else {
    container.classList.add("assistant"); // Apply assistant-specific styles
  }

  container.appendChild(newMessage); // Add the message to the container
  chatBox.appendChild(container); // Add the container to the chat box
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom of the chat box
}

// Function to update the last message in the UI
function updateLastMessage(content) {
  const messageDoms = document
    .getElementById("chat-box")
    .querySelectorAll(".message"); // Get all message DOM elements
  const lastMessageDom = messageDoms[messageDoms.length - 1]; // Get the last message
  lastMessageDom.textContent = content; // Update the message content
}

/*************** UI binding ***************/
// Populate the model selection dropdown with available models
availableModels.forEach((modelId) => {
  const option = document.createElement("option"); // Create an option element for each model
  option.value = modelId; // Set the model ID as the option's value
  option.textContent = modelId; // Set the display text of the option
  document.getElementById("model-selection").appendChild(option); // Add the option to the dropdown
});

// Set the default selected model
document.getElementById("model-selection").value = selectedModel;

// Add event listener to the "download" button to initialize the WebLLM engine
document.getElementById("download").addEventListener("click", function () {
  initializeWebLLMEngine().then(() => {
    document.getElementById("send").disabled = false; // Enable the send button once the engine is initialized
  });
});

// Add event listener to the "send" button to send a message
document.getElementById("send").addEventListener("click", function () {
  onMessageSend(); // Trigger message sending function
});
