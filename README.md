# ContainerShare

A Progressive Web App (PWA) for fairly splitting shipping container freight costs among multiple owners/partners. If you share a container with others, ContainerShare calculates each person's freight share based on their proportional use of the container's cubic volume (CBM).

## What It Does

When multiple parties share a single shipping container, total freight costs need to be divided fairly. ContainerShare handles this by:

1. **Sessions** — each container shipment is a session with a total freight cost and container CBM capacity.
2. **Owners** — each party sharing the container is an owner, with their own list of items.
3. **Items** — each item has a carton count, CBM per carton, and USD price per carton.
4. **Freight allocation** — freight costs are split proportionally to each owner's total CBM relative to the full container.
5. **PDF reports** — a detailed cost breakdown PDF can be generated per owner.
6. **Audit system** — built-in checks flag rounding discrepancies or allocation warnings.

All data is stored locally in the browser (no backend, no accounts required). The app is fully installable as a PWA on desktop and mobile.

## Tech Stack

| Technology      | Version |
| --------------- | ------- |
| React           | 19      |
| TypeScript      | 5.9     |
| Vite            | 7       |
| Tailwind CSS    | 4       |
| React Router    | 7       |
| jsPDF           | 4       |
| vite-plugin-pwa | 1       |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/your-username/goods-splitter.git
cd goods-splitter
npm install
```

### Running Locally

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

The production-ready files will be output to the `dist/` directory. You can preview the build locally with:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI and session-specific components
│   ├── layout/       # BottomNav, PageHeader
│   ├── session/      # AuditSummary, ItemRow, OwnerCard, etc.
│   └── ui/           # Generic UI primitives (Button, Input, Toast, etc.)
├── context/          # React context: AppContext (state) + ToastContext
├── pages/            # Route-level page components
│   ├── Dashboard/    # Session list & creation
│   └── Session/      # Owner entry, hub, review, and session report
├── types/            # TypeScript interfaces and enums
└── utils/            # Pure functions: calculations, formatting, PDF, storage
```

## Key Concepts

- **Session** — represents one container shipment. Holds freight cost (USD), container capacity (CBM), and a list of owners.
- **Owner** — a party sharing the container. Has a list of goods items and a computed freight share.
- **Item** — a line of goods: carton quantity, CBM per carton, and unit price in USD.
- **Freight Share** — calculated as `(owner CBM / total allocated CBM) × total freight USD`.
- **Grand Total** — goods value plus freight share for each owner.

## License

This project is private and not licensed for redistribution.
