# Through the Looking Glass ☕🐇

An elegant, Alice in Wonderland-themed educational companion designed to help adult non-traditional students re-entering academia digest intimidating, jargon-heavy textbooks without feeling overwhelmed.

---

## The Core Problem
Adult college students returning to school after a long break are frequently faced with severe **cognitive overwhelm** and **task initiation friction** when encountering dense scholastic literature. 

"Through the Looking Glass" resolves this pain point through:
1. **"Drink Me" Screenshot Potion:** Snap a textbook screenshot, drop it in, and let Gemini extract and format textual components cleanly using visual OCR.
2. **"The Mad Hatter's Tea Time" (A Focus-Boxed Study Session):** A duration-controlled study podcast dialogue. Instead of endless dry text, the tool outputs a perfectly paced conversation between **The Narrator** (who reads absolute core academic definitions) and **Alice** (who interjects with relatable, non-intimidating real-world analogies) to hold a student's attention.
3. **"Caterpillar's Advice" Translator:** Converts scholarly prose on-the-fly into simple, mature, encouraging translations without reducing intellectual rigor.

---

## Technology Stack
- **Framework:** Next.js 15+ App Router, TypeScript
- **Styling & Animations:** Tailwind CSS 4, Framer Motion
- **AI Integration:** Official modern Google GenAI SDK (`@google/genai`)
- **Icons:** `lucide-react` (Wonderland motif)
- **Persistence:** Local JSON system (for quick, robust data archiving)

---

## Quickstart & Setup

### 1. Prerequisites
Ensure you have Node.js (v18+) installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variable Setup
Create a `.env.local` file in the root of your application (see `.env.example` as reference) and add your Gemini API Key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser to start.

---

## Hexagonal Core Design Laws
To guarantee project sustainability, the codebase strictly decouples business requirements (`Domain`, `Ports`) from external machinery (`Adapters`). Refactoring database engines or updating to newer Gemini client libraries will never require altering any core educational use cases or entity classes.
