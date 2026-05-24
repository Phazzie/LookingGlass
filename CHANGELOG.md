# Changelog

All notable changes to the "Through the Looking Glass" academic companion will be documented in this file, adhering to the standard [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

---

## [0.2.0] - 2026-05-24
### Added
- Rebranded primary educational mode to **"The Mad Hatter's Tea Time" (A Focus-Boxed Study Session)**.
- Enhanced `CaterpillarsAdvice` Domain Model with `focusSessionScript` parameters to accommodate an interactive timeline representation.
- Added optional `focusTimeMinutes` payload configurations to the inbound port `ExplainTextUseCase` and outbound service contracts (`ExplanationPort`).
- Upgraded the unified `GeminiExplanationAdapter` to compile dialogue scripts using **"Narrator"** and **"Alice"** dynamic roles.
- Multi-voice speaking duration script length calculated directly using a natural conversational metric of **150 words per minute** (WPM) multiplied by desired minutes.

### Changed
- Refactored `DocumentService` outbound queries to pass focus parameters efficiently.

---

## [0.1.0] - 2026-05-24
### Added
- Created complete Hexagonal Core layout directory: `Domain`, `Ports` (Inbound/Outbound), `Adapters` (Outbound), `Services`, and `UseCases`.
- Implemented **"Drink Me" Upload** drag-and-drop potion file receiver.
- Designed **"The Looking Glass" Reader** open leather storybook dual-page interface.
- Built **"The Golden Hour" Pocket Watch Audio Player** representing circular progress timelines with HTML5 controls.
- Completed full integration of `@google/genai` (V2.5 API Models) resolving textbook OCR transcription and structured glossary parsing.
