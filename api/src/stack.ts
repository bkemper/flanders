import * as path from "path";
import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib/core";
import { HttpApi, HttpMethod, LogGroupLogDestination, PayloadFormatVersion } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { AccessLogFormat } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";


/**
 *  folder based route definition
 *  integration configuration - region, timeout, payload format
 *  authorization for IAM + Cognito
 *  export OpenAPI spec for documentation
 * */ 
export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const accessLogGroup = new logs.LogGroup(this, "flanders-api-access-logs", {
      retention: logs.RetentionDays.FIVE_DAYS,
    });

    const gateway = new HttpApi(this, "flanders-api", {
      createDefaultStage: false,
      description: "Flanders API – routes mapped to separate Lambdas for per-route permissions",
    });

    gateway.addStage("default", {
      accessLogSettings: {
        destination: new LogGroupLogDestination(accessLogGroup),
        format: AccessLogFormat.clf(),
      },
      autoDeploy: true,
      stageName: "$default",
    });

    const apiLambda = new NodejsFunction(this, "ApiLambda", {
      description: "handles all api requests",
      entry: path.join(__dirname, "routes/v1/api.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
    });

    // @todo understand parameter mapping
    const apiIntegration = new HttpLambdaIntegration("ApiIntegration", apiLambda, {
      payloadFormatVersion: PayloadFormatVersion.VERSION_2_0,
      timeout: Duration.seconds(30)
    });

    gateway.addRoutes({
      path: "/{proxy+}",
      methods: [HttpMethod.GET],
      integration: apiIntegration,
    });

    new CfnOutput(this, "ApiUrl", {
      description: "Flanders HTTP API endpoint (stage: api)",
      value: gateway.apiEndpoint,
    });
  }
}
