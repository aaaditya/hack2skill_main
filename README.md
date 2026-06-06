# MindfulU — Student Wellness Companion

A production-quality web application that helps students track mood, identify stress triggers, reflect on emotions, and receive AI-powered wellness support.

## Features

- **Mood Check-ins** — Track daily mood, energy, and anxiety with 5-point emoji scales, note-taking, and stress trigger tagging
- **Reflection Journal** — Guided journaling with reflection prompts to surface emotional patterns and stressors
- **Wellness Dashboard** — Composite wellness score (0–100), trend detection, and stress trigger frequency chart
- **AI Wellness Insights** — Gemini-powered analysis of patterns with actionable suggestions and trigger identification
- **Wellness Chat** — Conversational AI companion for real-time support and coping strategies

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **AI**: Google Gemini 1.5 Flash via `@google/generative-ai`
- **Validation**: Zod
- **Forms**: React Hook Form
- **Testing**: Jest + Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com/) API key

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file:

```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Testing

```bash
npm test                  # Run all tests
npm run test:coverage     # With coverage report
npm run type-check        # TypeScript strict type check
npm run lint              # ESLint
```

Test coverage includes:
- **Wellness score calculation** — trend detection, score weighting, edge cases
- **AI response parsing** — JSON extraction, sanitization, shape validation
- **Form validation schemas** — all Zod schemas including prompt injection prevention

## Architecture

```
src/
├── app/                   # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── wellness/      # POST /api/wellness — Gemini insight generation
│   │   └── chat/          # POST /api/chat — wellness chat
│   ├── dashboard/
│   ├── journal/
│   ├── mood/
│   └── chat/
├── features/              # Feature-based modules
│   ├── mood/              # Mood tracking components
│   ├── journal/           # Journaling components
│   ├── wellness/          # Score, insights, trigger chart + global store
│   └── ai/                # Wellness chat component
├── components/
│   ├── ui/                # shadcn/ui primitives
│   └── shared/            # Navigation, ErrorBoundary
├── lib/
│   ├── wellness.ts        # Score calculation, labels, formatting
│   ├── gemini.ts          # Prompt building, response parsing
│   ├── validations.ts     # Zod schemas
│   └── utils.ts           # cn() helper
└── types/
    └── index.ts           # Shared TypeScript types
```

## Security

- API key is **server-side only** — never exposed to the client
- All API inputs validated with Zod before processing
- User input sanitized (HTML stripped, character limits enforced)
- Prompt injection prevention via regex-based content checks
- All data stored locally in the browser (localStorage) — no server-side user data

## Accessibility

- Skip-to-content link
- Semantic HTML with proper heading hierarchy
- ARIA labels on all interactive elements
- `aria-pressed` for toggle buttons
- `role="log"` with `aria-live` for the chat feed
- `role="alert"` for error messages
- `aria-current="page"` for navigation
- Full keyboard navigation support
- WCAG 2.1 AA color contrast targets
