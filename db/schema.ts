import { pgTable, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  originalFilenames: text("original_filenames").array().notNull(),
  filePaths: text("file_paths").array().notNull(),
  extractedText: text("extracted_text").notNull(),
  audioUrl: text("audio_url"),
  explanationText: text("explanation_text"),
  glossary: jsonb("glossary"), // Array of { term: string, definition: string }
  focusSessionScript: jsonb("focus_session_script"), // Array of { speaker: string, text: string }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
