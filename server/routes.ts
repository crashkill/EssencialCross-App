import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertWorkoutSchema, 
  insertPRSchema,
  workoutTypes,
  exerciseCategories
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import OpenAI from "openai";

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "EssentialCrossSecret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 86400000 }, // 24 hours
      store: new SessionStore({ checkPeriod: 86400000 }) // prune expired entries every 24h
    })
  );

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate inputs
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.session && req.session.userId) {
      return res.status(200).json({ 
        isAuthenticated: true, 
        userId: req.session.userId 
      });
    }
    return res.status(200).json({ isAuthenticated: false });
  });

  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Workout routes
  app.post("/api/workouts", requireAuth, async (req, res) => {
    try {
      const workoutData = insertWorkoutSchema
        .extend({
          type: z.enum(workoutTypes),
          date: z.string().transform(str => new Date(str)),
        })
        .parse({ ...req.body, userId: req.session.userId });
      
      const workout = await storage.createWorkout(workoutData);
      return res.status(201).json(workout);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/workouts", requireAuth, async (req, res) => {
    try {
      const { type } = req.query;
      
      if (type && typeof type === 'string') {
        const workouts = await storage.getWorkoutsByType(req.session.userId, type);
        return res.status(200).json(workouts);
      } else {
        const workouts = await storage.getWorkoutsByUserId(req.session.userId);
        return res.status(200).json(workouts);
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/workouts/recent", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const workouts = await storage.getRecentWorkouts(req.session.userId, limit);
      return res.status(200).json(workouts);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkout(id);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Check if workout belongs to authenticated user
      if (workout.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      return res.status(200).json(workout);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkout(id);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Check if workout belongs to authenticated user
      if (workout.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const workoutData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      };
      
      const updatedWorkout = await storage.updateWorkout(id, workoutData);
      return res.status(200).json(updatedWorkout);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/workouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkout(id);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Check if workout belongs to authenticated user
      if (workout.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteWorkout(id);
      return res.status(200).json({ message: "Workout deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Exercise routes
  app.get("/api/exercises", async (req, res) => {
    try {
      const { category, search } = req.query;
      
      if (category && typeof category === 'string') {
        const exercises = await storage.getExercisesByCategory(category);
        return res.status(200).json(exercises);
      } else if (search && typeof search === 'string') {
        const exercises = await storage.searchExercises(search);
        return res.status(200).json(exercises);
      } else {
        const exercises = await storage.getAllExercises();
        return res.status(200).json(exercises);
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const exercise = await storage.getExercise(id);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      return res.status(200).json(exercise);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Personal Record routes
  app.post("/api/prs", requireAuth, async (req, res) => {
    try {
      const prData = insertPRSchema
        .extend({
          date: z.string().transform(str => new Date(str)),
        })
        .parse({ ...req.body, userId: req.session.userId });
      
      // Ensure exercise exists
      const exercise = await storage.getExercise(prData.exerciseId);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      const pr = await storage.createPersonalRecord(prData);
      return res.status(201).json(pr);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/prs", requireAuth, async (req, res) => {
    try {
      const prs = await storage.getPersonalRecordsByUserId(req.session.userId);
      return res.status(200).json(prs);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/prs/recent", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      const prs = await storage.getRecentPersonalRecords(req.session.userId, limit);
      
      // Get exercise information for each PR
      const prsWithExerciseInfo = await Promise.all(
        prs.map(async (pr) => {
          const exercise = await storage.getExercise(pr.exerciseId);
          return {
            ...pr,
            exerciseName: exercise?.name || "Unknown Exercise"
          };
        })
      );
      
      return res.status(200).json(prsWithExerciseInfo);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/prs/exercise/:exerciseId", requireAuth, async (req, res) => {
    try {
      const exerciseId = parseInt(req.params.exerciseId);
      
      // Ensure exercise exists
      const exercise = await storage.getExercise(exerciseId);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      const prs = await storage.getPersonalRecordsByExerciseId(req.session.userId, exerciseId);
      return res.status(200).json(prs);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/prs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pr = await storage.getPersonalRecord(id);
      
      if (!pr) {
        return res.status(404).json({ message: "Personal record not found" });
      }
      
      // Check if PR belongs to authenticated user
      if (pr.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      return res.status(200).json(pr);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/prs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pr = await storage.getPersonalRecord(id);
      
      if (!pr) {
        return res.status(404).json({ message: "Personal record not found" });
      }
      
      // Check if PR belongs to authenticated user
      if (pr.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const prData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      };
      
      const updatedPR = await storage.updatePersonalRecord(id, prData);
      return res.status(200).json(updatedPR);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/prs/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pr = await storage.getPersonalRecord(id);
      
      if (!pr) {
        return res.status(404).json({ message: "Personal record not found" });
      }
      
      // Check if PR belongs to authenticated user
      if (pr.userId !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deletePersonalRecord(id);
      return res.status(200).json({ message: "Personal record deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // OpenAI API route for generating WODs
  app.post("/api/wod/generate", async (req, res) => {
    try {
      const openai = new OpenAI();
      const { type, duration, level, focus, equipment } = req.body;
      
      if (!type || !duration || !level) {
        return res.status(400).json({ message: "Type, duration and level are required" });
      }
      
      const prompt = `
        Crie um WOD (Workout of the Day) de CrossFit com as seguintes características:
        - Tipo: ${type} (ex: AMRAP, EMOM, For Time, etc)
        - Duração estimada: ${duration} minutos
        - Nível de dificuldade: ${level}
        ${focus ? `- Foco em: ${focus}` : ''}
        ${equipment && equipment.length > 0 ? `- Equipamentos disponíveis: ${equipment.join(', ')}` : ''}
        
        Por favor, retorne o resultado em formato JSON com a seguinte estrutura:
        {
          "type": "tipo do workout (AMRAP, EMOM, etc)",
          "name": "nome criativo para o WOD",
          "description": "descrição detalhada do workout, incluindo as repetições, tempos, etc",
          "movements": ["lista de movimentos incluídos"],
          "tips": ["2-3 dicas para realizar o workout com boa técnica"],
          "scaling": {
            "beginner": "como escalar o workout para iniciantes",
            "intermediate": "como escalar o workout para intermediários",
            "advanced": "como escalar o workout para avançados"
          }
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Você é um especialista em CrossFit e criação de WODs (Workout of the Day). Você conhece todos os movimentos, padrões de treino e metodologias do CrossFit." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const wodData = JSON.parse(response.choices[0].message.content || '{}');
      
      return res.status(200).json({
        type: wodData.type || type,
        name: wodData.name || 'WOD Personalizado',
        description: wodData.description || '',
        movements: wodData.movements || [],
        tips: wodData.tips || [],
        scaling: wodData.scaling || {
          beginner: '',
          intermediate: '',
          advanced: ''
        }
      });
    } catch (error) {
      console.error('Erro ao gerar WOD:', error);
      return res.status(500).json({ message: "Não foi possível gerar o WOD. Por favor, tente novamente." });
    }
  });

  // Data export route
  app.get("/api/export", requireAuth, async (req, res) => {
    try {
      const { format } = req.query;
      
      // Get user data for export
      const user = await storage.getUser(req.session.userId);
      const workouts = await storage.getWorkoutsByUserId(req.session.userId);
      const prs = await storage.getPersonalRecordsByUserId(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { password: _, ...userWithoutPassword } = user;
      
      const exportData = {
        user: userWithoutPassword,
        workouts,
        personalRecords: prs
      };
      
      if (format === 'csv') {
        // Simple CSV conversion for demo
        let csv = "User Info\n";
        csv += `ID,Username,Name,Email,Created At\n`;
        csv += `${user.id},${user.username},${user.name || ''},${user.email || ''},${user.createdAt}\n\n`;
        
        csv += "Workouts\n";
        csv += "ID,Date,Type,Description,Result,Completed\n";
        workouts.forEach(w => {
          csv += `${w.id},${w.date},${w.type},"${w.description.replace(/"/g, '""')}","${w.result?.replace(/"/g, '""') || ''}",${w.completed}\n`;
        });
        
        csv += "\nPersonal Records\n";
        csv += "ID,Exercise ID,Value,Unit,Date,Notes\n";
        prs.forEach(pr => {
          csv += `${pr.id},${pr.exerciseId},${pr.value},${pr.unit},${pr.date},"${pr.notes?.replace(/"/g, '""') || ''}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=essentialcross_export.csv');
        return res.send(csv);
      } else {
        // Default to JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=essentialcross_export.json');
        return res.json(exportData);
      }
    } catch (error) {
      return res.status(500).json({ message: "Export failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
