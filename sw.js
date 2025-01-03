import { ServiceWorkerMLCEngineHandler } from "https://esm.run/@mlc-ai/web-llm";

let handler;

self.addEventListener("activate", function (event) {
  handler = new ServiceWorkerMLCEngineHandler();
  console.log("Service Worker is ready");
});
