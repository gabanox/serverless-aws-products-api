#!/bin/bash

# Instalar dependencias
pip install -r requirements.txt

# Verificar si Graphviz está instalado
if ! command -v dot &> /dev/null; then
    echo "Graphviz no está instalado. Instalando..."
    apt-get update && apt-get install -y graphviz
fi

# Generar todos los diagramas
echo "Generando diagrama de arquitectura Multi-AZ..."
python multi-az-diagram.py

echo "Generando diagrama de Auto Escalado..."
python auto-scaling-diagram.py

echo "Generando diagrama de Recuperación ante Desastres..."
python dr-diagram.py

echo "Generando diagrama de Monitorización..."
python monitoring-diagram.py

echo "Generando diagrama del Proyecto Capstone..."
python capstone-diagram.py

echo "Todos los diagramas han sido generados en el directorio docs/assets/images/"