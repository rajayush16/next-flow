# NextFlow

NextFlow is a Next.js workflow builder for composing AI and media-processing pipelines on a visual canvas. Users can create, save, import, export, and run workflows made from text, upload, image-crop, video-frame, and LLM nodes.

The app uses Clerk for authentication, Prisma with PostgreSQL for workflow and run history, Trigger.dev for background execution, Transloadit for media uploads, FFmpeg for media processing, and Google Gemini for LLM output.

## Features

- Visual workflow editor powered by React Flow.
- Authenticated workspace with per-user workflow storage.
- Workflow create, edit, delete, import, export, and sample reset actions.
- Node types for text input, image upload, video upload, Gemini LLM calls, image cropping, and video frame extraction.
- Full, selected, and single-node workflow execution.
- Run history with workflow-level and node-level status, logs, outputs, and errors.
- Background execution through Trigger.dev tasks.

## Tech Stack

- Next.js 16 and React 19
- TypeScript
- Prisma and PostgreSQL
- Clerk
- Trigger.dev
- Transloadit
- Google Generative AI SDK
- FFmpeg
- Tailwind CSS
- Zustand

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL database
- Clerk application keys
- Trigger.dev project and secret key
- Transloadit account credentials
- Google Generative AI API key

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the required values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

GOOGLE_GENERATIVE_AI_API_KEY=""

TRIGGER_SECRET_KEY=""
TRIGGER_PROJECT_ID=""

TRANSLOADIT_KEY=""
TRANSLOADIT_SECRET=""
NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID=""
```

Generate the Prisma client and apply database migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Start the Next.js development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Trigger.dev Worker

Workflow execution is implemented in `trigger/workflow.ts`. Run the Trigger.dev development worker in a separate terminal while testing workflow runs locally:

```bash
npx trigger.dev@latest dev
```

Trigger.dev uses `trigger.config.ts`, including the FFmpeg and Prisma build extensions required by media-processing tasks.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

- `dev`: starts the local Next.js development server.
- `build`: creates a production build.
- `start`: starts the production server after a build.
- `lint`: runs ESLint.

## Project Structure

```text
prisma/
  schema.prisma              Database schema and migrations
src/app/
  (auth)/                    Clerk sign-in and sign-up routes
  (app)/workflow/            Authenticated workflow workspace
  (marketing)/               Public landing route
  api/uploads/               Transloadit upload API route
src/components/
  layout/                    Workspace shell, sidebars, run history UI
  ui/                        Shared UI components
src/features/
  nodes/                     Node templates and node helpers
  workflow/                  Sample workflow and execution planning
src/lib/
  clerk.ts                   Auth helpers
  db.ts                      Prisma client
  env.ts                     Environment validation
  gemini.ts                  Gemini client
  media.ts                   FFmpeg and asset utilities
  transloadit.ts             Upload client helpers
src/server/
  actions/                   Server actions for workflows and runs
  schemas/                   Zod schemas
  workflow-run-service.ts    Run persistence helpers
trigger/
  workflow.ts                Trigger.dev workflow and node tasks
```

## Workflow Nodes

- `Text Node`: provides plain text output.
- `Upload Image`: uploads and passes through image assets.
- `Upload Video`: uploads and passes through video assets.
- `Run Any LLM`: sends text and optional images to Gemini.
- `Crop Image`: crops an input image with FFmpeg.
- `Extract Frame`: captures a frame from an input video with FFmpeg.

## Database

The Prisma schema defines:

- `AppUser`: maps Clerk users to application users.
- `Workflow`: stores workflow metadata, graph state, and viewport.
- `WorkflowRun`: stores each workflow execution.
- `WorkflowNodeRun`: stores node-level execution results, logs, inputs, outputs, and errors.

Useful Prisma commands:

```bash
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

## Production

Build the app:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Before deploying, configure the production environment variables, apply Prisma migrations to the production database, and deploy the Trigger.dev tasks for the configured `TRIGGER_PROJECT_ID`.
