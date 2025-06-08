from diagrams import Diagram, Cluster
from diagrams.aws.network import APIGateway
from diagrams.aws.compute import Lambda
from diagrams.aws.database import DynamoDB
from diagrams.aws.management import Cloudwatch
from diagrams.aws.integration import SNS
from diagrams.aws.general import Users

# Configuración del diagrama
diagram_attrs = {
    "fontsize": "24",
    "pad": "1.5",
    "filename": "../docs/assets/images/monitoring-architecture",
    "direction": "TB"
}

with Diagram("TechModa Monitoring Architecture", show=False, **diagram_attrs):
    # Usuarios y servicios principales
    users = Users("Users")
    
    # Dashboard y alarmas
    with Cluster("CloudWatch Monitoring"):
        dashboard = Cloudwatch("CloudWatch\nDashboard")
        alarms = Cloudwatch("CloudWatch\nAlarms")
        events = Cloudwatch("CloudWatch\nEvents")
    
    # Notificaciones
    sns = SNS("SNS Topic\nAlerts")
    
    # Arquitectura de aplicación
    with Cluster("Application Architecture"):
        api = APIGateway("API Gateway")
        lambda_func = Lambda("Lambda\nFunctions")
        db = DynamoDB("DynamoDB")
        
        api >> lambda_func >> db
    
    # Flujo de monitoreo
    users >> api
    
    # Métricas
    api >> dashboard
    lambda_func >> dashboard
    db >> dashboard
    
    # Alarmas
    dashboard >> alarms
    alarms >> sns
    alarms >> events
    
    # Respuesta automatizada
    events >> Lambda("Error Response\nLambda")