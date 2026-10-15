# Stakeholder Orbit

A visual, local-first stakeholder mapping tool for project and product leaders. Plot people by influence and interest, capture sentiment and priorities, and turn the map into a practical engagement plan.

## Why I built it

Stakeholder maps are often created once and forgotten. Stakeholder Orbit connects the visual model to concrete actions: communication cadence, relationship ownership, attention signals, and an exportable executive brief.

## Features

- Interactive influence × interest map
- Four automatically assigned engagement strategies
- Sentiment and high-influence attention signals
- Relationship-owner coverage metric
- Editable stakeholder cards and example scenario
- Markdown executive brief and engagement-plan export
- Private by design: browser storage only, with no backend
- Responsive, accessible static interface

## Try it locally

No installation or dependencies are required. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Test

Requires Node.js 20 or later:

```bash
npm test
```

## What I learned

- Separating stakeholder status from engagement strategy
- Turning a familiar 2×2 framework into actionable recommendations
- Building an SVG data visualization with accessible controls
- Keeping business logic testable and independent from the UI
- Deploying a zero-dependency application through GitHub Actions and Pages

## Technology

HTML, CSS, modern JavaScript, SVG, localStorage, Node's built-in test runner, and GitHub Actions.

## License

MIT
