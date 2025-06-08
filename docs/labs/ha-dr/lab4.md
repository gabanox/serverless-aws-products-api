# Lab 4: Monitoring with CloudWatch

## Overview

In this lab, you will implement comprehensive monitoring for TechModa's serverless product API using Amazon CloudWatch. You'll set up metrics, alarms, dashboards, and automated responses to ensure that any potential issues are detected and addressed before they impact customers.

**Duration**: Approximately 90 minutes

**Objectives**:
- Configure detailed CloudWatch metrics for Lambda, API Gateway, and DynamoDB
- Create custom metrics for business-relevant indicators
- Set up CloudWatch alarms with appropriate thresholds
- Build a comprehensive CloudWatch dashboard
- Implement automated responses with CloudWatch Events and Lambda
- Create a notification system for critical alerts

## Business Context

TechModa has experienced several performance issues with their product API that weren't detected until customers reported problems. In one instance, a gradual increase in API latency went unnoticed for several hours, resulting in abandoned shopping carts and lost sales.

The CTO wants to implement proactive monitoring that can:
- Detect issues before they impact customers
- Provide real-time visibility into system performance
- Automatically respond to common issues
- Alert the operations team to critical problems

## Architecture

![Monitoring Architecture](/assets/images/monitoring-architecture.png)

The architecture will include:
- CloudWatch metrics and alarms
- Custom CloudWatch dashboard
- CloudWatch Events rules
- SNS topics for notifications
- Lambda functions for automated responses

## Step 1: Configure Enhanced CloudWatch Metrics

Begin by enabling detailed CloudWatch metrics for your Lambda functions:

1. Update the `template.yaml` file to enable detailed monitoring:

```yaml
Globals:
  Function:
    Tracing: Active  # Enables X-Ray tracing
```

2. Update individual function configurations:

```yaml
Resources:
  GetProductsFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/getProducts.handler
      Runtime: nodejs14.x
      Tracing: Active
      # Add additional monitoring configuration
      Environment:
        Variables:
          LOG_LEVEL: INFO
```

3. Deploy the updated configuration:

```bash
sam build
sam deploy
```

## Step 2: Create Custom Metrics

Next, modify your Lambda functions to publish custom metrics:

1. Update your Lambda function code to publish custom metrics:

```javascript
// src/getProducts.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  const startTime = new Date().getTime();
  
  try {
    // Existing function code to get products
    const dynamoDB = new AWS.DynamoDB.DocumentClient();
    const result = await dynamoDB.scan({ TableName: process.env.PRODUCTS_TABLE }).promise();
    
    // Calculate execution time
    const executionTime = new Date().getTime() - startTime;
    
    // Publish custom metrics
    await cloudwatch.putMetricData({
      Namespace: 'TechModa/ProductAPI',
      MetricData: [
        {
          MetricName: 'ProductsReturned',
          Value: result.Items.length,
          Unit: 'Count'
        },
        {
          MetricName: 'ExecutionTime',
          Value: executionTime,
          Unit: 'Milliseconds'
        }
      ]
    }).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    // Publish error metric
    await cloudwatch.putMetricData({
      Namespace: 'TechModa/ProductAPI',
      MetricData: [
        {
          MetricName: 'Errors',
          Value: 1,
          Unit: 'Count'
        }
      ]
    }).promise();
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to retrieve products' })
    };
  }
};
```

2. Update the IAM role to allow publishing metrics:

```yaml
Resources:
  GetProductsFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'dynamodb:Scan'
                Resource: !GetAtt ProductsTable.Arn
        - PolicyName: CloudWatchMetrics
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
```

## Step 3: Set Up CloudWatch Alarms

Create CloudWatch alarms to alert on critical metrics:

1. Add the following alarms to your `template.yaml`:

```yaml
Resources:
  APILatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-APILatencyAlarm
      AlarmDescription: Alarm when API latency exceeds threshold
      Namespace: AWS/ApiGateway
      MetricName: Latency
      Dimensions:
        - Name: ApiName
          Value: !Ref ServerlessRestApi
      Statistic: Average
      Period: 60
      EvaluationPeriods: 5
      Threshold: 500
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
        
  API5xxErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-API5xxErrorsAlarm
      AlarmDescription: Alarm when API returns 5xx errors
      Namespace: AWS/ApiGateway
      MetricName: 5XXError
      Dimensions:
        - Name: ApiName
          Value: !Ref ServerlessRestApi
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlertTopic
        - !Ref ErrorResponseFunction.Arn
        
  DynamoDBThrottlingAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-DynamoDBThrottlingAlarm
      AlarmDescription: Alarm when DynamoDB is throttling requests
      Namespace: AWS/DynamoDB
      MetricName: ThrottledRequests
      Dimensions:
        - Name: TableName
          Value: !Ref ProductsTable
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      AlarmActions:
        - !Ref AlertTopic
        
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${AWS::StackName}-Alerts
      
  AlertTopicSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref AlertTopic
      Protocol: email
      Endpoint: ops-team@techmoda-example.com
```

## Step 4: Create an Automated Response

Implement an automated response to handle API errors:

1. Create a new Lambda function for automated error response:

```javascript
// src/errorResponse.js
exports.handler = async (event) => {
  console.log('Received alarm:', JSON.stringify(event, null, 2));
  
  // Parse the alarm data
  const message = JSON.parse(event.Records[0].Sns.Message);
  
  // Take automated action based on the alarm
  if (message.AlarmName.includes('API5xxErrorsAlarm')) {
    console.log('Detected 5xx errors, initiating automated response');
    
    // Here you would implement your automated response
    // Examples:
    // - Restart the API stage
    // - Scale up resources
    // - Clear caches
    // - Notify specific team members
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Automated response initiated' })
  };
};
```

2. Add the function to your `template.yaml`:

```yaml
Resources:
  ErrorResponseFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/errorResponse.handler
      Runtime: nodejs14.x
      Events:
        SNSEvent:
          Type: SNS
          Properties:
            Topic: !Ref AlertTopic
```

## Step 5: Create a CloudWatch Dashboard

Build a comprehensive dashboard to monitor your serverless API:

1. Add a CloudWatch dashboard to your `template.yaml`:

```yaml
Resources:
  ProductAPIDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub ${AWS::StackName}-ProductAPI
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ApiGateway", "Latency", "ApiName", "${ServerlessRestApi}", { "stat": "Average" } ],
                  [ ".", "IntegrationLatency", ".", ".", { "stat": "Average" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "API Latency",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/ApiGateway", "Count", "ApiName", "${ServerlessRestApi}", { "stat": "Sum" } ],
                  [ ".", "4XXError", ".", ".", { "stat": "Sum" } ],
                  [ ".", "5XXError", ".", ".", { "stat": "Sum" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "API Requests and Errors",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Invocations", "FunctionName", "${GetProductsFunction}", { "stat": "Sum" } ],
                  [ ".", ".", ".", "${CreateProductFunction}", { "stat": "Sum" } ],
                  [ ".", ".", ".", "${UpdateProductFunction}", { "stat": "Sum" } ],
                  [ ".", ".", ".", "${DeleteProductFunction}", { "stat": "Sum" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Invocations",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/Lambda", "Duration", "FunctionName", "${GetProductsFunction}", { "stat": "Average" } ],
                  [ ".", ".", ".", "${CreateProductFunction}", { "stat": "Average" } ],
                  [ ".", ".", ".", "${UpdateProductFunction}", { "stat": "Average" } ],
                  [ ".", ".", ".", "${DeleteProductFunction}", { "stat": "Average" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Lambda Duration",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 12,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${ProductsTable}", { "stat": "Sum" } ],
                  [ ".", "ConsumedWriteCapacityUnits", ".", ".", { "stat": "Sum" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "DynamoDB Capacity Consumption",
                "period": 60
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 12,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  [ "TechModa/ProductAPI", "ProductsReturned", { "stat": "Average" } ],
                  [ ".", "ExecutionTime", { "stat": "Average" } ],
                  [ ".", "Errors", { "stat": "Sum" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Custom Metrics",
                "period": 60
              }
            }
          ]
        }
```

## Step 6: Test the Monitoring System

Now, let's test the monitoring system:

1. Generate some traffic to the API:

```bash
#!/bin/bash
API_URL="<your-api-url>"

# Normal traffic
for i in $(seq 1 50); do
  curl -s "$API_URL/products" > /dev/null
  sleep 1
done

# Generate some errors
for i in $(seq 1 5); do
  curl -s -X POST "$API_URL/products" -d '{"invalid": "data"}' > /dev/null
  sleep 1
done

# Heavy traffic
for i in $(seq 1 20); do
  for j in $(seq 1 10); do
    curl -s "$API_URL/products" > /dev/null &
  done
  wait
  sleep 1
done
```

2. Monitor the CloudWatch dashboard to observe the metrics
3. Trigger an alarm to test the notification system and automated response

## Conclusion

By completing this lab, you have implemented comprehensive monitoring for TechModa's serverless product API, ensuring that potential issues can be detected and addressed before they impact customers. This monitoring system provides real-time visibility into system performance and can automatically respond to common issues.

In the next lab, you will learn how to implement backup solutions to protect against data loss and ensure that critical data can be recovered if needed.

## Additional Resources

- [CloudWatch Metrics and Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/working_with_metrics.html)
- [CloudWatch Dashboards](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)
- [AWS Lambda Monitoring](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-functions.html)
- [DynamoDB Monitoring](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/monitoring.html)