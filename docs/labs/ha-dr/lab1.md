# Lab 1: Setting up Multi-AZ Architecture

## Overview

In this lab, you will configure TechModa's serverless product API to operate across multiple Availability Zones (AZs) to ensure high availability. While AWS Lambda and API Gateway are inherently multi-AZ services, you will need to ensure that the DynamoDB table that stores product information is properly configured for high availability.

**Duration**: Approximately 60 minutes

**Objectives**:
- Understand AWS Availability Zone architecture
- Configure DynamoDB for multi-AZ operation
- Test failover scenarios
- Verify high availability of the entire API stack

## Business Context

TechModa's product catalog must be available 24/7 to serve customers across different time zones. A single AZ failure could potentially disrupt the entire e-commerce platform if the infrastructure is not properly designed for high availability.

In this lab, you will help TechModa ensure that their product catalog API can continue to function even if an entire Availability Zone becomes unavailable.

## Architecture

![Multi-AZ Architecture](/assets/images/multi-az-architecture.png)

The architecture will include:
- API Gateway (inherently multi-AZ)
- Lambda functions (automatically distributed across AZs)
- DynamoDB with point-in-time recovery enabled

## Step 1: Examine the Current Architecture

Begin by examining the current serverless API setup to understand its components.

1. Review the `template.yaml` file to understand how the DynamoDB table is currently configured:

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
```

## Step 2: Update DynamoDB Configuration for High Availability

Modify the SAM template to ensure the DynamoDB table is configured for high availability:

1. Update the `template.yaml` file to enable point-in-time recovery for the DynamoDB table:

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

2. Deploy the updated configuration:

```bash
sam build
sam deploy
```

## Step 3: Verify Multi-AZ Functionality

Now that you've configured the DynamoDB table for high availability, let's verify that the entire stack is resilient to AZ failures.

1. Use the AWS CLI to check that DynamoDB is configured correctly:

```bash
aws dynamodb describe-table --table-name <your-table-name> | grep PointInTimeRecoveryStatus
```

2. Verify that Lambda functions and API Gateway are deployed across multiple AZs (this is the default behavior):

```bash
aws lambda get-function --function-name <your-function-name>
```

## Step 4: Test High Availability

To test the high availability of your setup, you will simulate different failure scenarios:

1. Create a test script that continuously makes requests to your API:

```bash
#!/bin/bash
API_URL="<your-api-url>"

while true; do
  echo "Making request to $API_URL"
  curl -s "$API_URL/products"
  echo -e "\n"
  sleep 5
done
```

2. Run the test script while performing the following actions in the AWS Console:
   - View CloudWatch Logs for Lambda invocations
   - Monitor DynamoDB metrics
   - Observe any impact on API availability

## Step 5: Analyze and Document Results

Document the results of your high availability test:

1. Did the API remain available throughout the test?
2. How did the services respond to the simulated failures?
3. What improvements could be made to further enhance availability?

## Conclusion

By completing this lab, you have ensured that TechModa's product catalog API is configured for high availability across multiple Availability Zones. This configuration helps protect against infrastructure failures in any single AZ and ensures that customers can access the product catalog 24/7.

In the next lab, you will learn how to implement auto-scaling to handle variable traffic patterns, further enhancing the reliability of TechModa's e-commerce platform.

## Additional Resources

- [AWS Well-Architected Framework - Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [Understanding AWS Lambda Function Scaling](https://docs.aws.amazon.com/lambda/latest/dg/invocation-scaling.html)