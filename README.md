# MindfulU — Exam Preparation Wellness Companion

A production-quality web application helping students manage mental well-being during board exams, competitive entrance tests (NEET, JEE, CUET, CAT, GATE, UPSC), and result seasons — powered by Google Gemini AI.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aaaditya/hack2skill_main&env=GEMINI_API_KEY&envDescription=Gemini%20API%20key%20from%20Google%20AI%20Studio&envLink=https://aistudio.google.com/app/apikey&project-name=mindfulu&repository-name=mindfulu)

### One-click deploy

1. Click the button above
2. Connect your GitHub account
3. Set `GEMINI_API_KEY` — get it free at [aistudio.google.com](https://aistudio.google.com/app/apikey)
4. Deploy

### Manual deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Set environment variable
vercel env add GEMINI_API_KEY
```

### Required environment variables

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | ✅ Yes |

Get your free Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

---

## Features

- **Mood Check-ins** — Track daily mood, energy, and exam anxiety with 5-point emoji scales
- **Stress Trigger Intelligence** — Identify and analyse exam-specific stressors (mock test performance, syllabus backlog, results anxiety, and 5 more)
- **Study Reflection Journal** — Guided prompts with automatic AI insight on every entry
- **Exam Readiness Dashboard** — Wellness score, trend detection, trigger frequency, AI root-cause analysis
- **Results Season Support** — Dedicated mode for the waiting period after exams
- **Exam Prep Coach** — Real-time AI chat tailored to your exam type and phase
- **Board Exams** — Specific support for Class 10 and Class 12 board students
- **All 6 Competitive Exams** — NEET, JEE, CUET, CAT, GATE, UPSC

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode + `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| AI | Google Gemini 1.5 Flash |
| Validation | Zod |
| Forms | React Hook Form |
| Testing | Jest 30 + Testing Library |

---

## Local Development

### Prerequisites

- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com/) API key

### Setup

```bash
# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local
# Edit .env.local and add: GEMINI_API_KEY=your_key_here

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm start             # Production server
npm test              # Run 190 tests across 10 suites
npm run test:coverage # Coverage report
npm run type-check    # TypeScript strict check
npm run lint          # ESLint
```

---

## Architecture

```
src/
├── middleware.ts              # Edge rate limiting (20 req/min per IP)
├── app/
│   ├── api/
│   │   ├── chat/              # POST — exam prep wellness chat
│   │   ├── wellness/          # POST — AI wellness insights
│   │   ├── trigger-analysis/  # POST — root cause analysis
│   │   ├── results-anxiety/   # POST — result season support
│   │   └── journal-insight/   # POST — per-entry AI reflection
│   ├── dashboard/             # Exam readiness + trigger intelligence
│   ├── mood/                  # Daily check-ins
│   ├── journal/               # Study reflections
│   └── chat/                  # Exam prep coach
├── features/
│   ├── exam/                  # ExamContextSetup (type + phase)
│   ├── mood/                  # MoodTrackerForm, MoodHistory
│   ├── journal/               # JournalEntryForm, JournalList
│   ├── wellness/              # Dashboard cards, AI panels, store
│   └── ai/                    # WellnessChat
├── components/
│   ├── ui/                    # Button, Card, Input, Progress…
│   └── shared/                # Navigation, TriggerPicker, AiErrorAlert
├── lib/
│   ├── wellness.ts            # Score + exam readiness calculation
│   ├── trigger-analysis.ts    # Frequency, trend, insight pipeline
│   ├── gemini.ts              # Prompt builders + response parsing
│   └── validations.ts         # Zod schemas for all API inputs
└── types/
    └── index.ts               # ExamType, ExamPhase, MoodEntry…
```

---

## Security

- `GEMINI_API_KEY` is server-side only — never in the client bundle
- All API inputs validated with Zod before any AI call
- Prompt injection prevention via regex on all chat inputs (client + server)
- HTML tag stripping and character limits on all AI responses
- Rate limiting middleware: 20 requests/minute per IP on all `/api/*` routes
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`
- All user data stored locally in `localStorage` — no server-side persistence

## Accessibility

- Skip-to-content link (keyboard-only via `focus-visible`)
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<dl>`, `<time>`
- ARIA labels on all interactive elements, `aria-pressed` on toggles
- `role="log"` + `aria-live="polite"` for chat stream
- `role="alert"` + `aria-live="assertive"` for errors
- Full keyboard navigation; `focus-visible:ring` on every interactive element
- `prefers-reduced-motion` media query disables all animations and transitions
- Responsive navigation with hamburger menu for mobile viewports
