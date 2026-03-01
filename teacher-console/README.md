# Autonomous Academy - Teacher Console MVP

This is a Next.js 14 application built to provide a Teacher Console for generating and modifying curriculum.

## Requirements

- Node.js 18+
- npm

## Setup & Run Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Setup Database**:
   ```bash
   npx prisma db push
   ```
3. **Seed Database**:
   This step populates the database with a mock Teacher user and an initial AI basics course.
   ```bash
   npx tsx prisma/seed.ts
   ```
4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Teacher Workflows

- Browse to `http://localhost:3000/teacher` to see the central dashboard.
- Select the `Course Creation` tab to simulate scaffolding a new course curriculum. Choose the target audience, duration, and topic, and an in-process deterministic backend script will populate course modules over time.
- Select the `Course Updation` tab to either browse the currently scaffolded courses or upload mock documentation (raw text up to 2000 chars) that the AI will automatically parse into a valid course map.
- Edit specific curriculum modules, recommendations, presentations, assignments, and adjust settings in real-time as a Teacher!

## Testing

```bash
npx vitest run
```
