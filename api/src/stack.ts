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
 *  integrations
 *    - Lambda function - invokes when the route receives a request.
 *    - HTTP URI - sends the request to the URL specified using the HTTP method defined. ’ANY’ indicates that API Gateway uses the same method it receives from the caller to call your integration.
 *    - Private resource - sends the request through your VPC link to an Application Load Balancer, Network Load Balancer, or AWS Cloud Map service
 *    - EventBridge - put event
 *    - SQS - send, receive, or delete message or purge queue
 *    - AppConfig - get configuration
 *    - Kinesis Data Streams - put record
 *    - Step Functions - start, stop, start sync
 *  authorization for IAM + Cognito
 *  cross-origin resource sharing
 *  route metrics
 *  route throttling
 *  custom domain
 *  usage plans
 *  api keys
 *  client certificates
 *  portals
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

    // @todo understand stage variables
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

    new CfnOutput(this, "ApiId", {
      description: "API Gateway HTTP API ID (use for: aws apigatewayv2 export-api --api-id <id> ...)",
      value: gateway.apiId,
      exportName: `${this.stackName}-ApiId`,
    });

    new CfnOutput(this, "ApiUrl", {
      description: "Flanders HTTP API endpoint (stage: api)",
      value: gateway.apiEndpoint,
    });
  }
}
