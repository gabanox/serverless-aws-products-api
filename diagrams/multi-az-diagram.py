from diagrams import Diagram, Cluster
from diagrams.aws.network import APIGateway, Route53
from diagrams.aws.compute import Lambda
from diagrams.aws.database import DynamoDB
from diagrams.aws.management import Cloudwatch
from diagrams.aws.general import Users

# Configuración del diagrama
diagram_attrs = {
    "fontsize": "24",
    "pad": "1.5",
    "filename": "../docs/assets/images/multi-az-architecture",
    "direction": "TB"  # Top to Bottom
}

with Diagram("TechModa Multi-AZ Architecture", show=False, **diagram_attrs):
    # Usuario/Internet
    users = Users("Users")
    
    # API Gateway
    api = APIGateway("API Gateway")
    
    # CloudWatch para monitoreo
    cloudwatch = Cloudwatch("CloudWatch\nMonitoring")
    
    # Zonas de disponibilidad
    with Cluster("AWS Region"):
        with Cluster("Availability Zone 1"):
            lambda1 = Lambda("Lambda Function\n(AZ1)")
            
        with Cluster("Availability Zone 2"):
            lambda2 = Lambda("Lambda Function\n(AZ2)")
    
        # DynamoDB abarcando ambas AZs
        dynamodb = DynamoDB("DynamoDB\nPoint-in-Time Recovery enabled")
    
    # Definir conexiones
    users >> api
    api >> lambda1
    api >> lambda2
    lambda1 >> dynamodb
    lambda2 >> dynamodb
    
    # Monitoreo con CloudWatch
    cloudwatch << api
    cloudwatch << lambda1
    cloudwatch << lambda2
    cloudwatch << dynamodb