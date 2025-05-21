import { serve } from "bun";
import homepage from "./index.html";

console.log("Starting server for Super Mario Bros Overworld example...");

const server = serve({
  port: 5524,
  routes: {
    "/": homepage,
  },
  development: true,
  error(error: Error) {
    console.error("Bun server error:", error);
    return new Response("Something went wrong!", { status: 500 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
console.log("Open http://localhost:5524 in your browser.");
