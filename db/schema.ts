import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  originalFilenames: text("original_filenames").array().notNull(),
  filePaths: text("file_paths").array().notNull(),
  extractedText: text("extracted_text"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  explanationText: text("explanation_text"),
  glossary: jsonb("glossary").$type<Array<{ term: string; definition: string }>>(),
  focusSessionScript: jsonb("focus_session_script").$type<
    Array<{ speaker: "Narrator" | "Alice"; text: string }>
  >(),
});
