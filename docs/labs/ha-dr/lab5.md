# Lab 5: Implementing Backup Solutions

## Overview

In this lab, you will implement comprehensive backup solutions for TechModa's serverless product API to protect against data loss and ensure the ability to recover data in case of corruption, accidental deletion, or malicious actions. You'll configure automated backups, test restoration procedures, and establish a backup policy that meets TechModa's business requirements.

**Duration**: Approximately 75 minutes

**Objectives**:
- Configure DynamoDB point-in-time recovery (PITR)
- Implement AWS Backup for scheduled backups
- Set up cross-region backup copies
- Create and test restoration procedures
- Implement backup validation
- Develop a comprehensive backup policy

## Business Context

TechModa recently experienced a data corruption incident where a deployment error resulted in the partial loss of product information. It took the engineering team 8 hours to restore from manual backups and reconcile recent transactions, during which time the product catalog displayed incomplete information to customers.

The CTO wants to implement a robust backup solution that:
- Automates regular backups of all critical data
- Enables point-in-time recovery to minimize data loss
- Includes cross-region backup copies for disaster recovery
- Provides quick and reliable restoration procedures
- Ensures backup integrity through validation

## Architecture

![Backup Architecture](/assets/images/backup-architecture.png)

The architecture will include:
- DynamoDB point-in-time recovery
- AWS Backup plans and vaults
- Cross-region backup replication
- Backup validation procedures

## Step 1: Enable DynamoDB Point-in-Time Recovery

Begin by enabling point-in-time recovery for your DynamoDB table:

1. Update the `template.yaml` file to enable PITR:

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

3. Verify PITR is enabled:

```bash
aws dynamodb describe-continuous-backups \
  --table-name <your-table-name>
```

## Step 2: Set Up AWS Backup

Next, configure AWS Backup for scheduled backups:

1. Add AWS Backup resources to your `template.yaml`:

```yaml
Resources:
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: !Sub ${AWS::StackName}-vault

  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub ${AWS::StackName}-backup-plan
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 1 * * ? *)  # Daily at 1:00 AM UTC
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
          - RuleName: WeeklyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 0 ? * SUN *)  # Weekly on Sundays at midnight UTC
            StartWindowMinutes: 120
            CompletionWindowMinutes: 240
            Lifecycle:
              DeleteAfterDays: 90
              MoveToColdStorageAfterDays: 30
          - RuleName: MonthlyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 0 1 * ? *)  # Monthly on the 1st at midnight UTC
            StartWindowMinutes: 180
            CompletionWindowMinutes: 360
            Lifecycle:
              DeleteAfterDays: 365
              MoveToColdStorageAfterDays: 90

  BackupSelection:
    Type: AWS::Backup::BackupSelection
    Properties:
      BackupPlanId: !Ref BackupPlan
      BackupSelection:
        SelectionName: !Sub ${AWS::StackName}-backup-selection
        IamRoleArn: !GetAtt BackupRole.Arn
        Resources:
          - !Sub arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ProductsTable}

  BackupRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: backup.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup
```

## Step 3: Configure Cross-Region Backup Copies

Add cross-region backup copies for disaster recovery:

1. Update the backup plan to include cross-region copies:

```yaml
Resources:
  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: !Sub ${AWS::StackName}-backup-plan
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: cron(0 1 * * ? *)
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
            CopyActions:
              - DestinationBackupVaultArn: !Sub arn:aws:backup:us-west-2:${AWS::AccountId}:backup-vault:${AWS::StackName}-vault-dr
                Lifecycle:
                  DeleteAfterDays: 30
```

2. Create a backup vault in the secondary region:

```bash
aws backup create-backup-vault \
  --backup-vault-name <your-stack-name>-vault-dr \
  --region us-west-2
```

## Step 4: Create Restoration Procedures

Now, let's create procedures for restoring data:

1. Create a Lambda function for DynamoDB restoration:

```javascript
// src/restoreBackup.js
const AWS = require('aws-sdk');
const backup = new AWS.Backup();
const dynamodb = new AWS.DynamoDB();

exports.handler = async (event) => {
  try {
    // For PITR restore
    if (event.restoreType === 'PITR') {
      const params = {
        SourceTableName: process.env.PRODUCTS_TABLE,
        TargetTableName: `${process.env.PRODUCTS_TABLE}-restored-${Date.now()}`,
        RestoreDateTime: new Date(event.restoreDateTime).toISOString(),
        UseLatestRestorableTime: event.useLatestRestorableTime || false
      };
      
      console.log('Initiating PITR restore with params:', params);
      const result = await dynamodb.restoreTableToPointInTime(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'PITR restore initiated',
          restoreDetails: result
        })
      };
    }
    
    // For AWS Backup restore
    if (event.restoreType === 'BACKUP') {
      const params = {
        RecoveryPointArn: event.recoveryPointArn,
        ResourceType: 'DynamoDB',
        NewResourceName: `${process.env.PRODUCTS_TABLE}-restored-${Date.now()}`
      };
      
      console.log('Initiating backup restore with params:', params);
      const result = await backup.startRestoreJob(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Backup restore initiated',
          restoreDetails: result
        })
      };
    }
    
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid restore type specified'
      })
    };
  } catch (error) {
    console.error('Restore error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error initiating restore',
        error: error.message
      })
    };
  }
};
```

2. Add the function to your `template.yaml`:

```yaml
Resources:
  RestoreBackupFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/restoreBackup.handler
      Runtime: nodejs14.x
      Environment:
        Variables:
          PRODUCTS_TABLE: !Ref ProductsTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ProductsTable
        - Statement:
            - Effect: Allow
              Action:
                - 'dynamodb:RestoreTableToPointInTime'
                - 'dynamodb:CreateTable'
                - 'dynamodb:DescribeTable'
              Resource: 
                - !GetAtt ProductsTable.Arn
                - !Sub arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ProductsTable}-restored-*
            - Effect: Allow
              Action:
                - 'backup:StartRestoreJob'
                - 'backup:DescribeRestoreJob'
              Resource: '*'
```

## Step 5: Test Backup and Restore

Let's test the backup and restore functionality:

1. Populate the DynamoDB table with test data:

```bash
#!/bin/bash
API_URL="<your-api-url>"

# Create 10 test products
for i in $(seq 1 10); do
  curl -X POST "$API_URL/products" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Product $i\",\"price\":$((10 * i)),\"description\":\"Description for product $i\",\"category\":\"Test\",\"stock\":$((5 * i))}"
  
  echo "Created product $i"
  sleep 1
done
```

2. Wait for the point-in-time recovery backup to be available (typically a few minutes)

3. Create a CloudFormation custom resource to test the PITR restoration:

```yaml
Resources:
  TestPITRRestore:
    Type: Custom::TestRestore
    Properties:
      ServiceToken: !GetAtt RestoreTestFunction.Arn
      RestoreType: 'PITR'
      UseLatestRestorableTime: true
      
  RestoreTestFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/restoreTest.handler
      Runtime: nodejs14.x
      Environment:
        Variables:
          RESTORE_FUNCTION_NAME: !Ref RestoreBackupFunction
      Policies:
        - LambdaInvokePolicy:
            FunctionName: !Ref RestoreBackupFunction
```

4. Create the test function:

```javascript
// src/restoreTest.js
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const response = require('cfn-response');

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Only run test for Create and Update events
  if (event.RequestType === 'Delete') {
    return response.send(event, context, response.SUCCESS);
  }
  
  try {
    // Invoke the restore function
    const params = {
      FunctionName: process.env.RESTORE_FUNCTION_NAME,
      Payload: JSON.stringify({
        restoreType: event.ResourceProperties.RestoreType,
        useLatestRestorableTime: event.ResourceProperties.UseLatestRestorableTime,
        restoreDateTime: event.ResourceProperties.RestoreDateTime
      })
    };
    
    console.log('Invoking restore function with params:', params);
    const result = await lambda.invoke(params).promise();
    console.log('Restore function result:', result);
    
    // Send success response
    return response.send(event, context, response.SUCCESS, {
      Message: 'Restore test completed successfully',
      Result: JSON.parse(result.Payload)
    });
  } catch (error) {
    console.error('Error during restore test:', error);
    return response.send(event, context, response.FAILED, {
      Message: 'Restore test failed',
      Error: error.message
    });
  }
};
```

5. Deploy the testing resources:

```bash
sam build
sam deploy
```

## Step 6: Implement Backup Validation

Create a Lambda function to validate backups:

1. Add a new function to validate backups:

```javascript
// src/validateBackup.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const backup = new AWS.Backup();

exports.handler = async (event) => {
  try {
    // Get list of recent backup jobs
    const backupJobs = await backup.listBackupJobs({
      ResourceType: 'DynamoDB',
      ByResource: { TableName: process.env.PRODUCTS_TABLE }
    }).promise();
    
    console.log('Recent backup jobs:', JSON.stringify(backupJobs, null, 2));
    
    // Check if recent backups completed successfully
    const recentSuccessfulBackups = backupJobs.BackupJobs.filter(job => 
      job.State === 'COMPLETED' && 
      new Date(job.CompletionDate) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentSuccessfulBackups.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'No successful backups found in the last 24 hours',
          status: 'FAILED'
        })
      };
    }
    
    // Optionally, you could also perform a test restore to a temporary table
    // and validate the data integrity
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Backup validation successful',
        status: 'SUCCESS',
        recentBackups: recentSuccessfulBackups.length
      })
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error validating backups',
        error: error.message,
        status: 'FAILED'
      })
    };
  }
};
```

2. Schedule the validation function to run daily:

```yaml
Resources:
  ValidateBackupFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/validateBackup.handler
      Runtime: nodejs14.x
      Environment:
        Variables:
          PRODUCTS_TABLE: !Ref ProductsTable
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - 'backup:ListBackupJobs'
                - 'backup:DescribeBackupJob'
              Resource: '*'
              
  DailyBackupValidationRule:
    Type: AWS::Events::Rule
    Properties:
      Description: 'Triggers daily backup validation'
      ScheduleExpression: 'cron(0 5 * * ? *)'  # Daily at 5:00 AM UTC
      State: ENABLED
      Targets:
        - Arn: !GetAtt ValidateBackupFunction.Arn
          Id: ValidateBackupTarget
```

## Step 7: Document Backup Policy

Create a comprehensive backup policy document:

1. Write a backup policy document:

```markdown
# TechModa Backup Policy

## Overview
This document outlines the backup policy for TechModa's product catalog API, defining the backup strategy, retention periods, and restoration procedures.

## Backup Strategy
- **Daily Backups**: Automated backups taken daily at 1:00 AM UTC
  - Retention: 30 days
  - Purpose: Recovery from recent data corruption or accidental deletion

- **Weekly Backups**: Automated backups taken weekly on Sundays at midnight UTC
  - Retention: 90 days (moved to cold storage after 30 days)
  - Purpose: Recovery from major incidents, with longer retention

- **Monthly Backups**: Automated backups taken monthly on the 1st at midnight UTC
  - Retention: 365 days (moved to cold storage after 90 days)
  - Purpose: Long-term archiving and compliance requirements

- **Point-in-Time Recovery**: Continuous backups allowing restoration to any point within the last 35 days
  - Purpose: Minimize data loss by enabling recovery to a specific point in time

- **Cross-Region Backup Copies**: Daily backups are automatically copied to a secondary region
  - Purpose: Disaster recovery in case of regional outage

## Recovery Procedures

### DynamoDB Point-in-Time Recovery
1. Identify the point in time to restore to
2. Use the AWS Console or invoke the RestoreBackupFunction Lambda with the appropriate timestamp
3. Monitor the restoration progress
4. Validate the restored data
5. Update application configuration to use the restored table if needed

### AWS Backup Restoration
1. Identify the backup recovery point to restore from
2. Use the AWS Console or invoke the RestoreBackupFunction Lambda with the recovery point ARN
3. Monitor the restoration progress
4. Validate the restored data
5. Update application configuration to use the restored table if needed

## Backup Validation
- Automated daily validation checks are performed at 5:00 AM UTC
- Validation failures trigger alerts to the operations team
- Monthly test restores are performed to verify recoverability

## Responsibilities
- **Development Team**: Implement and maintain backup infrastructure as code
- **Operations Team**: Monitor backup status and respond to validation failures
- **Security Team**: Review backup configurations and access controls quarterly
- **Compliance Team**: Ensure backup retention meets regulatory requirements
```

2. Save this document in your project:

```bash
mkdir -p docs/policies
echo "# Backup Policy content here..." > docs/policies/backup-policy.md
```

## Conclusion

By completing this lab, you have implemented a comprehensive backup solution for TechModa's serverless product API, including automated backups, cross-region replication, restoration procedures, and validation checks. This configuration ensures that critical data is protected and can be recovered quickly in case of data loss or corruption.

You have now completed all five labs in the High Availability and Disaster Recovery track, giving you the skills to implement robust, resilient, and recoverable systems on AWS.

## Additional Resources

- [DynamoDB Backup and Restore](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/BackupRestore.html)
- [AWS Backup Documentation](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html)
- [Point-in-Time Recovery for DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html)
- [AWS Well-Architected Framework - Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)