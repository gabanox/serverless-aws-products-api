# Descripción General de Laboratorios

Los Laboratorios AWS de TechModa están diseñados para proporcionar experiencia práctica con escenarios del mundo real que las empresas de comercio electrónico de moda enfrentan al implementar soluciones en la nube. Cada laboratorio se enfoca en aspectos específicos de alta disponibilidad y recuperación ante desastres en AWS.

## Laboratorios Disponibles

### Módulo de Alta Disponibilidad y Recuperación ante Desastres

Este módulo se centra en la construcción de sistemas resilientes que pueden resistir fallos y recuperarse rápidamente:

1. **[Configuración de Arquitectura Multi-AZ](ha-dr/lab1.md)** - Aprende a distribuir tu aplicación a través de múltiples Zonas de Disponibilidad para protegerla contra fallos en centros de datos.

2. **[Implementación de Auto Escalado](ha-dr/lab2.md)** - Configura el escalado automático de recursos basado en la demanda para mantener el rendimiento durante picos de tráfico.

3. **[Estrategias de Recuperación ante Desastres](ha-dr/lab3.md)** - Implementa estrategias de respaldo-restauración, luz piloto, espera activa y multi-sitio activo/activo para DR.

4. **[Monitorización con CloudWatch](ha-dr/lab4.md)** - Configura monitorización exhaustiva, alertas y respuestas automatizadas a eventos de infraestructura.

5. **[Proyecto Capstone: Solución Integral de Alta Disponibilidad](ha-dr/proyecto-capstone.md)** - Implementa una solución completa que integre todos los conceptos anteriores.

## Contexto Empresarial de TechModa

A lo largo de estos laboratorios, trabajarás con la API del catálogo de productos de TechModa, que es la columna vertebral de su plataforma de comercio electrónico. Esta API debe ser:

- **Altamente Disponible**: El catálogo de productos debe ser accesible 24/7, ya que cualquier tiempo de inactividad afecta directamente a las ventas.
- **Escalable**: Durante eventos de semana de la moda y ventas flash, el tráfico puede aumentar hasta un 1000%.
- **Resiliente**: El sistema debe poder recuperarse rápidamente de cualquier fallo.
- **Conforme**: Los datos de los clientes deben estar protegidos y disponibles según los requisitos regulatorios.

Al completar estos laboratorios, desarrollarás las habilidades necesarias para diseñar e implementar soluciones que cumplan con estos requisitos empresariales críticos utilizando servicios de AWS.