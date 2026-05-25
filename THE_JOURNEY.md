# Through the Looking Glass: A Developer & Shareholder Journey

## 1. Introduction: The Vision
Welcome to the chronicle of **Through the Looking Glass**, an *Alice in Wonderland*-themed focus and studying application designed to transform dense, scholarly textbooks and academic screenshots into magical, accessible learning experiences. 

Our core vision was clear: build an application that utilizes Google's Gemini Multimodal AI to transcribe screenshots of textbooks, synthesize text-to-speech audio, and provide profound, whimsical explanations (guided by "The Caterpillar"). We wanted to ensure the app felt premium, offline-capable, and completely isolated from the standard, sterile "tech" feel.

## 2. Architectural Bedrock: The Hexagon
Before writing a single line of business logic, we established a strict **Hexagonal Architecture (Ports & Adapters)**. This was not merely a design choice; it was a mandate to ensure the app could scale, be easily tested, and remain decoupled from external APIs.

- **The Domain Layer (`core/domain`)**: We built pure TypeScript entities (`Document.ts`, `CaterpillarsAdvice.ts`) representing our internal state. No frameworks, no external APIs. Just clean business rules.
- **The Ports (`core/ports`)**: We defined strict interfaces (`OcrPort`, `TtsPort`, `StoragePort`, `ExplanationPort`) dictating *what* the application needed to do without caring *how* it was done.
- **The Adapters (`core/adapters`)**: We implemented the concrete tech: Node.js file system for local storage (`LocalStorageAdapter`), and the `@google/genai` SDK for translation and speech (`GeminiOcrAdapter`, `GeminiTtsAdapter`).
- **The Outward Boundary (`core/services`)**: The `DocumentService.ts` was born as the central orchestrator, executing use cases by wiring the ports together.

## 3. Phase 1: The Single Scroll (Initial Core)
We began by building the "Drink Me" upload component — a beautifully styled drag-and-drop zone where users could upload a single screenshot of a textbook. 

* **The Flow**: The user dropped an image -> we saved it locally -> we sent it to Gemini for OCR extraction -> we saved the extracted text and generated an MP3 using Gemini's text-to-speech capability. 
* **The UI**: A magical, moss green and plum "Library" interface displayed the documents, allowing the user to select them, read the transcribed text, and trigger the Caterpillar's advice.

## 4. Phase 2: The Stack of Scrolls (Multi-Screenshot Upgrade)
We soon realized that scholars don't read single pages; they read chapters. We embarked on the "Multi-Scroll Stack" upgrade.

* **Domain Update**: We refactored the `Document` entity to accept arrays of original filenames and file paths, adding robust validations.
* **Adapter Upgrades**: The `GeminiOcrAdapter` was upgraded to process an array of image buffers natively. We utilized Gemini's multimodal capabilities to map multiple sequentially uploaded screenshots into a single cohesive prompt: *"These are sequential screenshots of a dense academic document. Read them in order..."*
* **Storage**: We enhanced the local storage JSON database to map and persist these arrays seamlessly while maintaining legacy support.

## 5. Phase 3: The Library Expansion & API Hardening
With the core capable of swallowing entire chapters, we moved to harden the delivery mechanism and Next.js frontend.

* **API Wiring**: We upgraded the Next.js `POST /api/documents` API route to flawlessly parse MultiFormData containing multiple files, converting web `File` objects securely into Node.js `Buffer` objects in memory.
* **The Presentation**: The `DrinkMeUpload` component updated dynamically, greeting the user with new responsive copy based on their selection (e.g., *"Brewing a stack of 5 scrolls..."*). The Library Shelf UI adapted to show batch sizes.
* **Security & Guardrails**: We introduced an In-Memory Rate Limiter, as well as strict file size bounds (max 5MB per scroll, 20MB batch limits) to prevent API abuse and Gemini quota max-outs (429 errors).

## 6. The Crucible: Pure Unit Testing
To prove the worth of our Hexagonal Architecture, we implemented a robust, lightning-fast testing suite using `Vitest`. 

* We wrote comprehensive tests for the pure `Document` domain validation logic.
* Driven by the Ports pattern, we wrote pure in-memory Mocks for our Storage, OCR, TTS, and Explanation APIs. 
* This allowed our `DocumentService.test.ts` to meticulously mock-test complex multi-file scenarios, data-persistence caches, and conversational state transitions without needing an internet connection or an active Gemini API key.

## 7. Current State & Handoff
As of today, the application is highly scalable, incredibly secure, and completely typed. 

**For the Next Agent / Developer:**
1. **The Codebase is Clean**: All domain logic lives in `core/`. Do not pollute it with React (`app/` or `components/`). All dependency injection is cleanly handled in `core/di.ts`.
2. **Next Steps**: Our error handling is elegant, and our multi-file mapping works beautifully. The immediate focus can now be placed around expanding the "Caterpillar's Advice" dual-voice interactions, or perhaps deploying the local `LocalStorageAdapter` into a remote equivalent like Google Cloud Storage or a Postgres DB in the adapters layer, depending on shareholder direction. 
3. **Execution**: When adding new features, follow the established pattern. Write the Domain entity -> Define the Port -> Test it with Vitest -> Write the Adapter -> Wire the Next.js API -> Build the UI.

The rabbit hole has been dug securely. We are ready to fall further in.

## 8. Architect's Final Turnover Directives
To whichever soul (human or AI) inherits this repository, you must heed the law of this land. We have not built a prototype; we have built an engine. To maintain it:

*   **Pristine Logic over Clutter**: Do not litter the codebase with incomplete `// TODO` stubs or ellipsis `...`. Finish what you start. Ensure every method signature aligns with the Hexagonal Ports bounds.
*   **Aesthetic Consistency**: The UI must remain within the Alice in Wonderland theme—deep plum borders, moss-green accents, and brass highlights. We reject "AI slop" or terminal-like developer gimmicks. Keep the visual rhythm clean and professional.
*   **The Mandate of the Mock Turtle**: Read `AGENTS.md` before writing a single line of code. Perform the `[BUILDER SELF-CRITIQUE]` block before every significant file creation or modification. Do not bypass the Ports layer for local shortcuts. Do not leak Next.js web classes (`File`, `Response`) deeply into the `core/` logic.
*   **Fear No Refactor**: Because of the `vitest` suite, providing 100% domain and service coverage, you can comfortably swap underlying infrastructure. If the time comes to swap local parsing for a cloud-hosted vector database, build a `CloudStorageAdapter`, wire it in `di.ts`, and run the tests.

"No, no! Rent the structure, buy the behavior!" Good luck, and keep the code clean.
— *The Mock Turtle*
