import { serve } from "bun";

const PORT = process.env.PORT || 3000;

// Route handlers for the API

const server = serve({
  error(error) {
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
  port: PORT,
  routes: {
    "/api/users/me": () => new Response("Current user"),
    "/api/users/:id": (req) => new Response(`User ${req.params.id}`),
    "/api/*": () => new Response("API catch-all"),
  
    "/error": () => { throw new Error('Oh no!'); },
    "/health": new Response("OK"),
    "/ready": new Response("Ready", {
      headers: {
        // Pass custom headers
        "X-Ready": "1",
      },
    }),
    "/blog": Response.redirect("https://bun.com/blog"),
    "/api/config": Response.json({
      version: "1.0.0",
      env: "production",
    }),

    "/profile.jpg": new Response(await Bun.file("./src/profile.jpg").bytes()),
    "/profile.jpg.zip": new Response(Bun.file("./src/profile.jpg.zip")),

    "/*": () => new Response("Global catch-all"),
  },
});

console.log(
  `🚀 Flanders API server running at http://localhost:${server.port}`,
);
