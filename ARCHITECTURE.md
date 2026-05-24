# Software Architecture Document

This document provides a detailed overview of the system architecture of **Through the Looking Glass**, detailing the layout structure and the execution pipeline.

---

## 1. Directory Blueprint

```text
├── /core
│   ├── /domain                                 # Pure Business Objects
│   │   ├── Document.ts                         # Main entity carrying transcript and advices
│   │   └── CaterpillarsAdvice.ts               # Object representing glossary & study scripts
│   │
│   ├── /ports                                  # Contractual Interfaces
│   │   ├── /inbound                            # Inbound gateways (User Input triggers)
│   │   │   ├── ReadDocumentUseCase.ts
│   │   │   └── ExplainTextUseCase.ts
│   │   │
│   │   └── /outbound                           # Technical interfaces to systems
│   │       ├── OcrPort.ts                      # Vision screenshot OCR
│   │       ├── ExplanationPort.ts              # Caterpillar advice engine
│   │       ├── TtsPort.ts                      # Narrator speech adapter
│   │       └── StoragePort.ts                  # Document archive persistence
│   │
│   ├── /usecases                               # Inbound Port Implementations
│   │   └── ExplainTextUseCaseImpl.ts           
│   │
│   └── /adapters                               # Technical Implementations (Adapters)
│       └── /outbound
│           ├── GeminiOcrAdapter.ts             # Multimodal parsing
│           ├── GeminiExplanationAdapter.ts     # The Mad Hatter's script dialog generator
│           ├── GeminiTtsAdapter.ts             # Spoken audiobook output
│           └── LocalStorageAdapter.ts          # JSON local storage archive client
│
├── /app                                        # Inbound Adapters (Vite UI & API Routes)
│   ├── /api
│   │   ├── /documents                          # Express-style document routes
│   │   │   ├── route.ts                        
│   │   │   └── [id]/route.ts
│   │   └── /audio                              # Narrative stream endpoints
│   ├── page.tsx                                # Main Leather Book frontend interface
│   └── layout.tsx                              # Next.js global scaffolding
│
└── /components                                 # UI Presentation Primitives
    ├── DrinkMeUpload.tsx                       # Drag & Drop upload container
    ├── VintageAudioPlayer.tsx                  # Pocket watch controller
    └── CaterpillarSmokeLoader.tsx              # Glowing smoke hookah loader
```

---

## 2. Dynamic Execution Pipeline

The life cycle of an individual studying session proceeds as follows:

```
[ User drops Screenshot ]
           │
           ▼
[ app/api/documents: POST ] ─────────────────────► [ ReadDocumentUseCaseImpl ]
                                                           │
                                                           ▼ (Vision Translation)
[ Resulting document sent back ] ◄───────────────── [ GeminiOcrAdapter ]
           │
           ▼
[ Student clicks "Consult Caterpillar" ]
           │
           ▼
[ app/api/documents/[id]/explain: POST ] ────────► [ ExplainTextUseCaseImpl ]
                                                           │
                                                           ▼ (Dialogue Orchestrator)
[ Updated document details loaded ] ◄────────────── [ GeminiExplanationAdapter ]
```

---

## 3. Strict Boundary Guarantees
- Domain layers and port contracts contain **no references** to SQLite, React, Next.js, or external library imports.
- Dependency wiring takes place server-side to prevent memory state leaks or API security token exposure to the browser window.
