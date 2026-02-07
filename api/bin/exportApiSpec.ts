#!/usr/bin/env node

import {
  ApiGatewayV2Client,
  GetApisCommand,
  ExportApiCommand,
} from "@aws-sdk/client-apigatewayv2";
import { fromIni } from "@aws-sdk/credential-providers";
import { Command } from "commander";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const API_NAME = "flanders-api";
const program = new Command();
const time = (new Date()).getTime();

program
  .name("export-api-spec")
  .option("-o, --output <string>", "where to write spec file")
  .requiredOption("-p, --profile <string>", "AWS profile")
  .action(async ({ profile, output }) => {
    const client = new ApiGatewayV2Client({
      credentials: fromIni({ profile }),
      region: "us-east-1",
    });

    const listApis = new GetApisCommand();

    const { Items } = await client.send(listApis);
    const { ApiId } = Items?.find((item) => item.Name === API_NAME) ?? {};

    const exportApi = new ExportApiCommand({
      ApiId,
      IncludeExtensions: false,
      OutputType: "JSON",
      Specification: "OAS30",
    });

    const { body } = await client.send(exportApi);
    const content = await body?.transformToString() ?? "";

    const outputPath = output
      ? (path.isAbsolute(output) ? output : path.resolve(process.cwd(), "..", output))
      : path.join(os.tmpdir(), `flanders-openapi.${time}.json`);

    fs.writeFileSync(outputPath, content, "utf-8");

    console.log(`OpenAPI spec was written to "${outputPath}".`);
  });

program.parse();
