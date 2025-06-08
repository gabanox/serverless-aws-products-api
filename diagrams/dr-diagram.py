from diagrams import Diagram, Cluster
from diagrams.aws.network import APIGateway, Route53
from diagrams.aws.compute import Lambda
from diagrams.aws.database import DynamoDB
from diagrams.aws.general import Users

# Configuración del diagrama
diagram_attrs = {
    "fontsize": "24",
    "pad": "1.5",
    "filename": "../docs/assets/images/dr-architecture",
    "direction": "LR"  # Left to Right para mostrar dos regiones
}

with Diagram("TechModa Disaster Recovery Architecture", show=False, **diagram_attrs):
    # DNS Failover
    dns = Route53("Route 53\nDNS Failover")
    users = Users("Users")
    
    # Región primaria
    with Cluster("Primary Region (us-east-1)"):
        api_primary = APIGateway("API Gateway\nPrimary")
        
        with Cluster("Primary Services"):
            lambda_primary = Lambda("Lambda Functions\nPrimary")
            dynamodb_primary = DynamoDB("DynamoDB Table\nPrimary")
            
        lambda_primary >> dynamodb_primary
    
    # Región secundaria
    with Cluster("Secondary Region (us-west-2)"):
        api_secondary = APIGateway("API Gateway\nSecondary")
        
        with Cluster("Secondary Services"):
            lambda_secondary = Lambda("Lambda Functions\nSecondary")
            dynamodb_secondary = DynamoDB("DynamoDB Table\nSecondary")
            
        lambda_secondary >> dynamodb_secondary
    
    # Replicación de DynamoDB
    dynamodb_primary >> dynamodb_secondary
    
    # Flujo de solicitudes
    users >> dns
    dns >> api_primary
    dns >> api_secondary
    api_primary >> lambda_primary
    api_secondary >> lambda_secondary