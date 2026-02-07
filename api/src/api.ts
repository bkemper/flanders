import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEventV2,
  _context: Context,
): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath ?? event.requestContext?.http?.path ?? "/api";
  const method = event.requestContext?.http?.method ?? "GET";

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      message: "Flanders API",
      path,
      method,
      timestamp: new Date().toISOString(),
    }),
  };
}
