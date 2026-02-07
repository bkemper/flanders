import { test, expect } from "bun:test";

const BASE_URL = "http://localhost:3000";

test("health check endpoint", async () => {
  const response = await fetch(`${BASE_URL}/health`);
  expect(response.status).toBe(200);
  
  const data = await response.json();
  expect(data.status).toBe("ok");
});

test("hello endpoint", async () => {
  const response = await fetch(`${BASE_URL}/api/hello`);
  expect(response.status).toBe(200);
  
  const data = await response.json();
  expect(data.message).toBe("Hello from Flanders API!");
});

test("users GET endpoint", async () => {
  const response = await fetch(`${BASE_URL}/api/users`);
  expect(response.status).toBe(200);
  
  const data = await response.json();
  expect(data.users).toBeArray();
});

test("users POST endpoint", async () => {
  const response = await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Test User" }),
  });
  
  expect(response.status).toBe(201);
  const data = await response.json();
  expect(data.message).toBe("User created");
});
