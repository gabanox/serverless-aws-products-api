# Lab 3: Disaster Recovery Strategies

## Overview

In this lab, you will implement disaster recovery strategies for TechModa's serverless product API to ensure business continuity in the event of a regional AWS outage. You'll explore different DR approaches and implement a solution that meets TechModa's recovery time and recovery point objectives.

**Duration**: Approximately 90 minutes

**Objectives**:
- Understand different disaster recovery strategies (backup-restore, pilot light, warm standby, multi-site)
- Implement cross-region replication for DynamoDB
- Configure a cross-region API deployment
- Implement failover mechanisms
- Test disaster recovery procedures
- Document recovery processes and procedures

## Business Context

TechModa experienced a significant business disruption during a 3-hour regional AWS outage last quarter. With no cross-region recovery strategy in place, their e-commerce platform was completely unavailable, resulting in approximately $350,000 in lost sales and damaged customer trust.

The CTO has mandated implementing a disaster recovery solution with:
- Recovery Point Objective (RPO) of 15 minutes or less
- Recovery Time Objective (RTO) of 30 minutes or less

## Architecture

![Disaster Recovery Architecture](../../assets/images/dr-architecture.png)

The architecture will include:
- Primary region deployment (e.g., us-east-1)
- Secondary region deployment (e.g., us-west-2)
- DynamoDB global tables for cross-region replication
- Route 53 for DNS failover

## Step 1: Set Up DynamoDB Global Tables

Begin by configuring DynamoDB global tables to replicate data across regions:

1. Update the `template.yaml` file to enable DynamoDB streams, which are required for global tables:

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
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
```

2. Deploy the updated table in your primary region:

```bash
sam build
sam deploy --stack-name techmoda-api-primary --region us-east-1
```

3. Create a global table using the AWS CLI:

```bash
aws dynamodb create-global-table \
  --global-table-name techmoda-api-primary-products \
  --replication-group RegionName=us-east-1 RegionName=us-west-2 \
  --region us-east-1
```

## Step 2: Deploy API Stack to Secondary Region

Now, deploy the entire API stack to a secondary region:

1. Deploy the SAM template to the secondary region:

```bash
sam build
sam deploy --stack-name techmoda-api-secondary --region us-west-2
```

2. Verify that both deployments are working correctly:

```bash
# Test primary region
curl https://<primary-api-id>.execute-api.us-east-1.amazonaws.com/Prod/products

# Test secondary region
curl https://<secondary-api-id>.execute-api.us-west-2.amazonaws.com/Prod/products
```

## Step 3: Set Up DNS Failover with Route 53

Configure Route 53 for DNS failover between regions:

1. Create a Route 53 health check for the primary region API:

```bash
aws route53 create-health-check \
  --caller-reference $(date +%s) \
  --health-check-config "{\"Type\":\"HTTPS\",\"FullyQualifiedDomainName\":\"<primary-api-id>.execute-api.us-east-1.amazonaws.com\",\"Port\":443,\"ResourcePath\":\"/Prod/health\",\"RequestInterval\":30,\"FailureThreshold\":3}"
```

2. Create a Route 53 hosted zone (if you don't have one already):

```bash
aws route53 create-hosted-zone \
  --name api.techmoda-example.com \
  --caller-reference $(date +%s)
```

3. Configure DNS failover records:

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <your-hosted-zone-id> \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.techmoda-example.com",
          "Type": "A",
          "SetIdentifier": "primary",
          "Failover": "PRIMARY",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "<primary-api-id>.execute-api.us-east-1.amazonaws.com",
            "EvaluateTargetHealth": true
          },
          "HealthCheckId": "<your-health-check-id>"
        }
      },
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.techmoda-example.com",
          "Type": "A",
          "SetIdentifier": "secondary",
          "Failover": "SECONDARY",
          "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "<secondary-api-id>.execute-api.us-west-2.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'
```

## Step 4: Implement a Health Check Endpoint

Add a health check endpoint to your API for Route 53 to monitor:

1. Create a new Lambda function for the health check:

```javascript
// src/healthCheck.js
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ status: 'healthy' })
  };
};
```

2. Update the `template.yaml` file to add the health check endpoint:

```yaml
Resources:
  HealthCheckFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/healthCheck.handler
      Runtime: nodejs14.x
      Events:
        HealthCheck:
          Type: Api
          Properties:
            Path: /health
            Method: get
```

3. Deploy the updates to both regions:

```bash
sam build
sam deploy --stack-name techmoda-api-primary --region us-east-1
sam deploy --stack-name techmoda-api-secondary --region us-west-2
```

## Step 5: Test Disaster Recovery

Now, let's test the disaster recovery capabilities:

1. Create a script to continuously monitor both regions:

```bash
#!/bin/bash
PRIMARY_URL="https://<primary-api-id>.execute-api.us-east-1.amazonaws.com/Prod/health"
SECONDARY_URL="https://<secondary-api-id>.execute-api.us-west-2.amazonaws.com/Prod/health"
CUSTOM_DOMAIN="https://api.techmoda-example.com/Prod/health"

while true; do
  echo "$(date) - Testing primary region..."
  curl -s $PRIMARY_URL
  echo -e "\n"
  
  echo "$(date) - Testing secondary region..."
  curl -s $SECONDARY_URL
  echo -e "\n"
  
  echo "$(date) - Testing custom domain (should failover)..."
  curl -s $CUSTOM_DOMAIN
  echo -e "\n\n"
  
  sleep 10
done
```

2. Simulate a regional outage by either:
   - Disabling the primary region API Gateway stage
   - Modifying the health check Lambda to return a failure status in the primary region

3. Monitor the failover behavior:
   - How long does it take for Route 53 to detect the failure?
   - Does traffic successfully route to the secondary region?
   - Is data consistency maintained across regions?

## Step 6: Document Disaster Recovery Procedures

Create a comprehensive disaster recovery playbook:

1. Document the steps to manually initiate failover
2. Create procedures for validating the health of the secondary region
3. Outline steps for failing back to the primary region once it's available
4. Include contact information for key stakeholders
5. Document RPO and RTO measurements from your tests

## Conclusion

By completing this lab, you have implemented a cross-region disaster recovery strategy for TechModa's serverless product API that meets their RPO and RTO requirements. This configuration ensures business continuity even in the event of a complete regional outage.

In the next lab, you will learn how to implement comprehensive monitoring with CloudWatch to detect and respond to issues before they impact customers.

## Additional Resources

- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [Route 53 DNS Failover](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)
- [AWS Well-Architected Framework - Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [Disaster Recovery Strategies on AWS](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)