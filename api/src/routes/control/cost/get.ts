import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from "aws-lambda";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const client = new CostExplorerClient({ region: "us-east-1" });
const granularity = "MONTHLY";
const metric = "UnblendedCost";

export async function handler(
  event: APIGatewayProxyEventV2,
  _context: Context,
): Promise<APIGatewayProxyResultV2> {
  //   const path = event.rawPath ?? event.requestContext?.http?.path ?? "/api";
  //   const method = event.requestContext?.http?.method ?? "GET";

  const start =
    event.queryStringParameters?.start ??
    dayjs.utc().subtract(1, "year").startOf("month").format("YYYY-MM-DD");
  const end =
    event.queryStringParameters?.end ??
    dayjs.utc().add(1, "day").format("YYYY-MM-DD");

  const command = new GetCostAndUsageCommand({
    Granularity: granularity,
    Metrics: [metric],
    TimePeriod: { Start: start, End: end },
  });

  try {
    const { ResultsByTime } = await client.send(command);
    const data = ResultsByTime?.map((item) => {
      if (item.TimePeriod === undefined) {
        throw new Error(`Missing TimePeriod`);
      }

      if (item.Total === undefined) {
        throw new Error(`Missing Total`);
      }

      return {
        cost: item.Total[metric].Amount,
        end: item.TimePeriod.End,
        start: item.TimePeriod.Start,
      };
    });

    return {
      body: JSON.stringify({ data }),
      statusCode: 200
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: "Error fetching billing data" };
  }
}
