import * as path from "path";
import * as cdk from "aws-cdk-lib/core";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const httpApi = new HttpApi(this, "flanders-api", {
      createDefaultStage: true,
      description: "Flanders API – routes mapped to separate Lambdas for per-route permissions",
    });

    const apiLambda = new NodejsFunction(this, "ApiLambda", {
      description: "handles all api requests",
      entry: path.join(__dirname, "api.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
    });

    httpApi.addRoutes({
      path: "/",
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration("ApiIntegration", apiLambda),
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      description: "Flanders HTTP API endpoint (stage: api)",
      value: httpApi.apiEndpoint,
    });
  }
}
