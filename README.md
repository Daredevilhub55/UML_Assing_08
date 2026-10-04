# Interactive UML Class Diagram Builder

A browser based UML class diagram editor built with React and Vite. Model classes, attributes, operations, and relationships on a draggable canvas, then generate Java source code from the diagram.

## Features

- Create and edit UML classes, attributes, and methods.
- Drag classes to arrange the diagram and connect classes with association, inheritance, and dependency relationships.
- Edit relationship labels and multiplicity.
- Generate Java classes with inheritance and association fields.
- Copy generated code or download individual `.java` files.
- Save diagrams in browser local storage, load a sample, and arrange the canvas.
- Search classes, inspect selected elements, and undo or redo diagram changes.
- Responsive workspace for desktop, tablet, and mobile.

## Technologies

React, Vite, JavaScript, CSS, and Lucide React icons. Diagram rendering uses React components, HTML, and SVG.

## Installation

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Project structure

- `src/components/` reusable UI components (the main workspace is coordinated in `App.jsx`).
- `src/data/sampleDiagram.js` demonstration model.
- `src/utils/javaGenerator.js` Java source generation and identifier validation.
- `src/App.jsx` application state and diagram interactions.
- `src/index.css` responsive design system and application styles.

## How to use

1. Choose **New class** to add a class to the canvas.
2. Select a class and use the inspector to edit its name, attributes, and methods.
3. Drag class cards to arrange the canvas.
4. Choose a relationship type, then click its source and target classes.
5. Select a relationship to edit its label or multiplicity.
6. Review the live Java output, copy it, or download the `.java` files.
7. Save the diagram in this browser or use **Load example** to explore a sample model.

## Learning outcomes

This project demonstrates component-based React development, state and hooks, controlled inputs, event handling, dynamic rendering, SVG diagram drawing, UML class modeling, local persistence, and source code generation.

## Keyboard shortcuts

- `Ctrl/Cmd + S`: save diagram
- `Ctrl/Cmd + Z`: undo
- `Escape`: cancel relationship selection
- `Delete` / `Backspace`: delete the selected element
