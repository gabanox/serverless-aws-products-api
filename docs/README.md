# TechModa AWS Labs Documentation

This directory contains a MkDocs-based documentation site for the TechModa AWS Labs, focusing on High Availability and Disaster Recovery in AWS.

## Getting Started

To view and run the documentation site locally:

1. Install MkDocs and the Material theme:
   ```
   pip install mkdocs mkdocs-material
   ```

2. Serve the documentation site locally:
   ```
   mkdocs serve
   ```

3. Open your browser and navigate to http://localhost:8000

## Building the Site

To build a static version of the site:

```
mkdocs build
```

The built site will be in the `site` directory.

## Adding Diagrams

The labs reference diagram images that need to be created. Place diagram images in the `docs/assets/images/` directory.

Required diagrams:
- multi-az-architecture.png
- auto-scaling-architecture.png
- dr-architecture.png
- monitoring-architecture.png
- backup-architecture.png

## Content Structure

- `index.md`: Main landing page
- `labs/index.md`: Overview of all labs
- `labs/ha-dr/`: High Availability and Disaster Recovery labs
- `resources.md`: Additional resources and references