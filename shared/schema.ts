import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

// Workout types
export const workoutTypes = [
  "AMRAP", 
  "EMOM", 
  "For Time", 
  "Tabata", 
  "Strength", 
  "Skill", 
  "Other"
] as const;

// Workouts
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  type: text("type").$type<typeof workoutTypes[number]>().notNull(),
  description: text("description").notNull(),
  result: text("result"),
  completed: boolean("completed").default(false),
});

export const insertWorkoutSchema = createInsertSchema(workouts).pick({
  userId: true,
  date: true,
  type: true,
  description: true,
  result: true,
  completed: true,
});

// Exercise categories
export const exerciseCategories = [
  "Weightlifting",
  "Gymnastics",
  "Cardio",
  "Metcons"
] as const;

// Exercises
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").$type<typeof exerciseCategories[number]>().notNull(),
  videoUrl: text("video_url"),
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  name: true,
  description: true,
  category: true,
  videoUrl: true,
});

// Personal Records
export const personalRecords = pgTable("personal_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  value: text("value").notNull(),
  unit: text("unit").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertPRSchema = createInsertSchema(personalRecords).pick({
  userId: true,
  exerciseId: true,
  value: true,
  unit: true,
  date: true,
  notes: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type PersonalRecord = typeof personalRecords.$inferSelect;
export type InsertPersonalRecord = z.infer<typeof insertPRSchema>;
