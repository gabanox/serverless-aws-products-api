# Lab 2: Implementing Auto Scaling

## Overview

In this lab, you will configure auto scaling for TechModa's serverless product API to handle variable traffic patterns. You'll learn how to optimize the performance and cost-efficiency of Lambda functions and DynamoDB while ensuring the system can handle traffic spikes during promotional events.

**Duration**: Approximately 75 minutes

**Objectives**:
- Configure Lambda concurrency settings
- Set up DynamoDB on-demand capacity
- Implement DynamoDB auto scaling with provisioned capacity
- Test the auto scaling behavior under load
- Monitor and analyze scaling metrics

## Business Context

TechModa regularly runs flash sales and participates in fashion events that can cause traffic to spike by 500-1000% within minutes. During a recent promotional event, their product API experienced throttling and high latency due to Lambda concurrency limits and DynamoDB throughput constraints.

In this lab, you will implement auto scaling to ensure TechModa's API can smoothly handle these traffic patterns without service degradation.

## Architecture

![Auto Scaling Architecture](../../assets/images/auto-scaling-architecture.png)

The architecture will include:
- Lambda functions with reserved concurrency
- DynamoDB with auto scaling policies
- CloudWatch alarms for monitoring scaling events

## Step 1: Configure Lambda Concurrency

Begin by setting appropriate concurrency settings for your Lambda functions:

1. Review the current Lambda concurrency configuration:

```bash
aws lambda get-function-concurrency --function-name <function-name>
```

2. Update the `template.yaml` file to configure reserved concurrency for critical functions:

```yaml
Resources:
  GetProductsFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/getProducts.handler
      Runtime: nodejs14.x
      ReservedConcurrentExecutions: 100  # Reserve 100 concurrent executions
      Events:
        GetProducts:
          Type: Api
          Properties:
            Path: /products
            Method: get
```

3. For other functions, set provisioned concurrency to ensure fast response times:

```yaml
Resources:
  CreateProductFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/createProduct.handler
      Runtime: nodejs14.x
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 10
      Events:
        CreateProduct:
          Type: Api
          Properties:
            Path: /products
            Method: post
```

## Step 2: Configure DynamoDB Auto Scaling

Next, set up DynamoDB to automatically scale based on demand:

1. Update the `template.yaml` file to configure DynamoDB with provisioned capacity and auto scaling:

```yaml
Resources:
  ProductsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${AWS::StackName}-products
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      
  ProductsTableReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: ReadAutoScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ProductsTableReadScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization
          
  ProductsTableReadScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 100
      MinCapacity: 5
      ResourceId: !Sub table/${ProductsTable}
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb
      RoleARN: !GetAtt ScalingRole.Arn
      
  # Similar configuration for Write Capacity
  
  ScalingRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: application-autoscaling.amazonaws.com
            Action: "sts:AssumeRole"
      ManagedPolicyArns:
        - "arn:aws:iam::aws:policy/service-role/AmazonDynamoDBFullAccess"
```

2. Alternatively, for simplicity, you can use on-demand capacity mode:

```yaml
Resources:
  ProductsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${AWS::StackName}-products
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
```

3. Deploy the updated configuration:

```bash
sam build
sam deploy
```

## Step 3: Create CloudWatch Alarms for Scaling Events

Set up CloudWatch alarms to monitor scaling events:

1. Add the following CloudWatch alarm to your `template.yaml`:

```yaml
Resources:
  DynamoDBThrottleEventsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-DynamoDBThrottleEvents
      AlarmDescription: Alarm when DynamoDB requests are throttled
      MetricName: ReadThrottleEvents
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: TableName
          Value: !Ref ProductsTable
```

## Step 4: Test Auto Scaling Behavior

Now let's test how the system responds to increased load:

1. Create a load testing script that simulates traffic spikes:

```bash
#!/bin/bash
API_URL="<your-api-url>"

# Function to make requests in parallel
make_requests() {
  local parallel_requests=$1
  
  for i in $(seq 1 $parallel_requests); do
    curl -s "$API_URL/products" > /dev/null &
  done
  wait
}

# Start with low traffic
echo "Starting with low traffic (5 RPS)..."
for i in $(seq 1 30); do
  make_requests 5
  sleep 1
done

# Medium traffic
echo "Increasing to medium traffic (20 RPS)..."
for i in $(seq 1 30); do
  make_requests 20
  sleep 1
done

# High traffic spike
echo "Simulating traffic spike (100 RPS)..."
for i in $(seq 1 60); do
  make_requests 100
  sleep 1
done

# Cool down
echo "Returning to normal traffic..."
for i in $(seq 1 30); do
  make_requests 5
  sleep 1
done
```

2. Run the load testing script and monitor the following in the AWS Console:
   - DynamoDB metrics in CloudWatch
   - Lambda concurrency
   - API Gateway requests and latency
   - Any throttling events

## Step 5: Analyze and Optimize

Based on the test results, optimize your auto scaling configuration:

1. Review CloudWatch metrics to identify any bottlenecks
2. Adjust provisioned concurrency settings if needed
3. Tune DynamoDB auto scaling parameters based on observed scaling behavior
4. Document your findings and recommendations

## Conclusion

By completing this lab, you have implemented auto scaling for TechModa's serverless product API, ensuring it can handle variable traffic patterns, including sudden spikes during promotional events. This configuration helps maintain performance and availability while optimizing costs during periods of lower traffic.

In the next lab, you will learn how to implement disaster recovery strategies to protect against regional outages and ensure business continuity.

## Additional Resources

- [Lambda Scaling and Performance](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html)
- [DynamoDB Auto Scaling](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/AutoScaling.html)
- [AWS Well-Architected Framework - Performance Efficiency Pillar](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/welcome.html)