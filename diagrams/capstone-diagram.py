from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import APIGateway, Route53
from diagrams.aws.compute import Lambda
from diagrams.aws.database import DynamoDB
from diagrams.aws.management import Cloudwatch, AutoScaling
from diagrams.aws.integration import SNS
from diagrams.aws.general import Users
from diagrams.aws.storage import S3

# Configuración del diagrama
diagram_attrs = {
    "fontsize": "24",
    "pad": "1.5",
    "filename": "../docs/assets/images/capstone-architecture",
    "direction": "TB"
}

with Diagram("TechModa Integrated HA & DR Architecture", show=False, **diagram_attrs):
    # Usuario/Internet
    users = Users("Users")
    
    # DNS con failover
    route53 = Route53("Route 53\nDNS Failover")
    
    with Cluster("Comprehensive Monitoring"):
        cw_dashboard = Cloudwatch("CloudWatch\nDashboard")
        cw_alarms = Cloudwatch("CloudWatch\nAlarms")
        sns = SNS("Alert\nNotifications")
        
        cw_dashboard >> cw_alarms >> sns
    
    # Arquitectura Multi-Región
    with Cluster("Multi-Region Architecture"):
        # Región primaria
        with Cluster("Primary Region (us-east-1)"):
            # Multi-AZ en región primaria
            api_primary = APIGateway("API Gateway\nPrimary")
            
            with Cluster("Multi-AZ Deployment"):
                with Cluster("AZ 1"):
                    lambda1 = Lambda("Lambda\nAZ1")
                
                with Cluster("AZ 2"):
                    lambda2 = Lambda("Lambda\nAZ2")
                
                # Auto-scaling
                lambda_scaling = AutoScaling("Lambda\nAuto Scaling")
                
                # DynamoDB con replicación global
                dynamodb_primary = DynamoDB("DynamoDB\nGlobal Table\nPrimary")
                
                # Auto-scaling para DynamoDB
                db_scaling = AutoScaling("DynamoDB\nAuto Scaling")
        
        # Región secundaria  
        with Cluster("Secondary Region (us-west-2)"):
            api_secondary = APIGateway("API Gateway\nSecondary")
            lambda_secondary = Lambda("Lambda\nSecondary")
            dynamodb_secondary = DynamoDB("DynamoDB\nGlobal Table\nSecondary")
        
        # Backup Solution
        with Cluster("Backup & Recovery"):
            backup = S3("AWS Backup\nVault")
            
    # Conexiones
    users >> route53
    route53 >> api_primary
    route53 >> api_secondary
    
    api_primary >> lambda1
    api_primary >> lambda2
    
    lambda1 >> dynamodb_primary
    lambda2 >> dynamodb_primary
    
    # Conexiones de la región secundaria
    api_secondary >> lambda_secondary
    lambda_secondary >> dynamodb_secondary
    
    # Replicación
    dynamodb_primary - Edge(label="Replication") - dynamodb_secondary
    
    # Monitoreo
    cw_dashboard << api_primary
    cw_dashboard << lambda1
    cw_dashboard << lambda2
    cw_dashboard << dynamodb_primary
    
    # Auto-scaling
    cw_alarms >> lambda_scaling >> lambda1
    cw_alarms >> lambda_scaling >> lambda2
    cw_alarms >> db_scaling >> dynamodb_primary
    
    # Backup
    dynamodb_primary >> backup
    dynamodb_secondary >> backup