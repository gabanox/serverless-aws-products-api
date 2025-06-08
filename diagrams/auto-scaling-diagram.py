from diagrams import Diagram, Cluster
from diagrams.aws.network import APIGateway
from diagrams.aws.compute import Lambda
from diagrams.aws.database import DynamoDB
from diagrams.aws.management import Cloudwatch, AutoScaling
from diagrams.aws.general import Users

# Configuración del diagrama
diagram_attrs = {
    "fontsize": "24",
    "pad": "1.5",
    "filename": "../docs/assets/images/auto-scaling-architecture",
    "direction": "TB"
}

with Diagram("TechModa Auto Scaling Architecture", show=False, **diagram_attrs):
    users = Users("Users")
    
    api = APIGateway("API Gateway")
    
    cloudwatch = Cloudwatch("CloudWatch\nAlarms & Metrics")
    
    with Cluster("AWS Region"):
        # Auto Scaling para Lambda
        with Cluster("Lambda Auto Scaling"):
            auto_scaling_lambda = AutoScaling("Lambda\nConcurrency Scaling")
            lambda_group = [Lambda("Lambda\nInstance 1"),
                           Lambda("Lambda\nInstance 2"),
                           Lambda("Lambda\nInstance n")]
        
        # DynamoDB con Auto Scaling
        with Cluster("DynamoDB Auto Scaling"):
            auto_scaling_dynamo = AutoScaling("DynamoDB\nCapacity Scaling")
            dynamodb = DynamoDB("DynamoDB Table")
    
    # Conexiones
    users >> api >> lambda_group >> dynamodb
    
    # Auto Scaling controlado por CloudWatch
    cloudwatch >> auto_scaling_lambda
    cloudwatch >> auto_scaling_dynamo
    
    # Monitoreo
    lambda_group << cloudwatch
    dynamodb << cloudwatch