# Labs Overview

The TechModa AWS Labs are designed to provide hands-on experience with real-world scenarios that fashion e-commerce businesses face when implementing cloud solutions. Each lab focuses on specific aspects of high availability and disaster recovery in AWS.

## Available Labs

### High Availability & Disaster Recovery Track

This track focuses on building resilient systems that can withstand failures and recover quickly:

1. **[Setting up Multi-AZ Architecture](ha-dr/lab1.md)** - Learn how to distribute your application across multiple Availability Zones to protect against data center failures.

2. **[Implementing Auto Scaling](ha-dr/lab2.md)** - Configure automatic scaling of resources based on demand to maintain performance during traffic spikes.

3. **[Disaster Recovery Strategies](ha-dr/lab3.md)** - Implement backup-restore, pilot light, warm standby, and multi-site active/active DR strategies.

4. **[Monitoring with CloudWatch](ha-dr/lab4.md)** - Set up comprehensive monitoring, alerting, and automated responses to infrastructure events.

5. **[Proyecto Capstone: Solución Integral de Alta Disponibilidad](ha-dr/proyecto-capstone.md)** - Implementar una solución completa que integre todos los conceptos anteriores.

## TechModa Business Context

Throughout these labs, you'll be working with TechModa's product catalog API, which is the backbone of their e-commerce platform. This API must be:

- **Highly Available**: The product catalog must be accessible 24/7, as any downtime directly impacts sales.
- **Scalable**: During fashion week events and flash sales, traffic can increase by 1000%.
- **Resilient**: The system must be able to recover quickly from any failures.
- **Compliant**: Customer data must be protected and available according to regulatory requirements.

By completing these labs, you'll build the skills needed to design and implement solutions that meet these critical business requirements using AWS services.