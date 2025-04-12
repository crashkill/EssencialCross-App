import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const userRoles = ["athlete", "coach", "admin"] as const;

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").$type<typeof userRoles[number]>().default("athlete").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
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

// Grupos de treino
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coachId: integer("coach_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  coachId: true,
});

// Membros do grupo
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Um usuário só pode pertencer a um grupo uma vez
    uniqMembership: uniqueIndex("uniq_membership").on(table.groupId, table.userId),
  };
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
});

// Workouts programados
export const scheduledWorkouts = pgTable("scheduled_workouts", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  workoutId: integer("workout_id").notNull().references(() => workouts.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScheduledWorkoutSchema = createInsertSchema(scheduledWorkouts).pick({
  groupId: true,
  workoutId: true,
  scheduledDate: true,
  createdBy: true,
});

// Resultados de workouts
export const workoutResults = pgTable("workout_results", {
  id: serial("id").primaryKey(),
  scheduledWorkoutId: integer("scheduled_workout_id").notNull().references(() => scheduledWorkouts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  result: text("result").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertWorkoutResultSchema = createInsertSchema(workoutResults).pick({
  scheduledWorkoutId: true,
  userId: true,
  result: true,
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

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type ScheduledWorkout = typeof scheduledWorkouts.$inferSelect;
export type InsertScheduledWorkout = z.infer<typeof insertScheduledWorkoutSchema>;

export type WorkoutResult = typeof workoutResults.$inferSelect;
export type InsertWorkoutResult = z.infer<typeof insertWorkoutResultSchema>;
