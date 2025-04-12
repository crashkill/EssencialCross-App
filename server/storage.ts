import { 
  users, 
  workouts, 
  exercises, 
  personalRecords,
  groups,
  groupMembers,
  scheduledWorkouts,
  workoutResults,
  type User, 
  type InsertUser,
  type Workout,
  type InsertWorkout,
  type Exercise,
  type InsertExercise,
  type PersonalRecord,
  type InsertPersonalRecord,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
  type ScheduledWorkout,
  type InsertScheduledWorkout,
  type WorkoutResult,
  type InsertWorkoutResult
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workout methods
  getWorkout(id: number): Promise<Workout | undefined>;
  getWorkoutsByUserId(userId: number): Promise<Workout[]>;
  getWorkoutsByType(userId: number, type: string): Promise<Workout[]>;
  getRecentWorkouts(userId: number, limit: number): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<Workout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;
  
  // Exercise methods
  getExercise(id: number): Promise<Exercise | undefined>;
  getExerciseByName(name: string): Promise<Exercise | undefined>;
  getAllExercises(): Promise<Exercise[]>;
  getExercisesByCategory(category: string): Promise<Exercise[]>;
  searchExercises(query: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Personal Record methods
  getPersonalRecord(id: number): Promise<PersonalRecord | undefined>;
  getPersonalRecordsByUserId(userId: number): Promise<PersonalRecord[]>;
  getPersonalRecordsByExerciseId(userId: number, exerciseId: number): Promise<PersonalRecord[]>;
  getRecentPersonalRecords(userId: number, limit: number): Promise<PersonalRecord[]>;
  createPersonalRecord(pr: InsertPersonalRecord): Promise<PersonalRecord>;
  updatePersonalRecord(id: number, pr: Partial<PersonalRecord>): Promise<PersonalRecord | undefined>;
  deletePersonalRecord(id: number): Promise<boolean>;
  
  // Group methods
  getGroup(id: number): Promise<Group | undefined>;
  getGroupsByCoachId(coachId: number): Promise<Group[]>;
  getGroupsForUser(userId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, group: Partial<Group>): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<boolean>;
  
  // Group Member methods
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(groupId: number, userId: number): Promise<boolean>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  
  // Scheduled Workout methods
  getScheduledWorkout(id: number): Promise<ScheduledWorkout | undefined>;
  getScheduledWorkoutsByGroupId(groupId: number): Promise<ScheduledWorkout[]>;
  getUpcomingWorkoutsForUser(userId: number): Promise<ScheduledWorkout[]>;
  createScheduledWorkout(workout: InsertScheduledWorkout): Promise<ScheduledWorkout>;
  updateScheduledWorkout(id: number, workout: Partial<ScheduledWorkout>): Promise<ScheduledWorkout | undefined>;
  deleteScheduledWorkout(id: number): Promise<boolean>;
  
  // Workout Result methods
  getWorkoutResult(id: number): Promise<WorkoutResult | undefined>;
  getWorkoutResultsByUserId(userId: number): Promise<WorkoutResult[]>;
  getWorkoutResultsByScheduledWorkout(scheduledWorkoutId: number): Promise<WorkoutResult[]>;
  createWorkoutResult(result: InsertWorkoutResult): Promise<WorkoutResult>;
  updateWorkoutResult(id: number, result: Partial<WorkoutResult>): Promise<WorkoutResult | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workouts: Map<number, Workout>;
  private exercises: Map<number, Exercise>;
  private personalRecords: Map<number, PersonalRecord>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private scheduledWorkouts: Map<number, ScheduledWorkout>;
  private workoutResults: Map<number, WorkoutResult>;
  
  private userIdCounter: number;
  private workoutIdCounter: number;
  private exerciseIdCounter: number;
  private prIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private scheduledWorkoutIdCounter: number;
  private workoutResultIdCounter: number;

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.exercises = new Map();
    this.personalRecords = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.scheduledWorkouts = new Map();
    this.workoutResults = new Map();
    
    this.userIdCounter = 1;
    this.workoutIdCounter = 1;
    this.exerciseIdCounter = 1;
    this.prIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.scheduledWorkoutIdCounter = 1;
    this.workoutResultIdCounter = 1;
    
    // Initialize with some exercises for demo purposes
    this.initializeExercises();
  }

  // Helper methods to initialize some default exercises
  private initializeExercises() {
    const defaultExercises: InsertExercise[] = [
      {
        name: "Back Squat",
        description: "A squat performed with a barbell across the shoulders behind the neck.",
        category: "Weightlifting",
        videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8"
      },
      {
        name: "Clean & Jerk",
        description: "Olympic weightlifting movement that combines lifting a barbell from the floor to the shoulders and then overhead.",
        category: "Weightlifting",
        videoUrl: "https://www.youtube.com/watch?v=9HyWjAk7fhY"
      },
      {
        name: "Deadlift",
        description: "A weight training exercise where a loaded barbell is lifted from the ground to hip level.",
        category: "Weightlifting",
        videoUrl: "https://www.youtube.com/watch?v=op9kVnSso6Q"
      },
      {
        name: "Pull-up",
        description: "An upper-body compound exercise where you hang from a bar and pull your body up until your chin is over the bar.",
        category: "Gymnastics",
        videoUrl: "https://www.youtube.com/watch?v=eGo4IYlbE5g"
      },
      {
        name: "Handstand Push-up",
        description: "A push-up performed while in a handstand position with the feet against a wall for balance.",
        category: "Gymnastics",
        videoUrl: "https://www.youtube.com/watch?v=hvoQiF0kBI8"
      },
      {
        name: "Muscle-up",
        description: "A movement that combines a pull-up with a dip to transition from below a bar or rings to above it.",
        category: "Gymnastics",
        videoUrl: "https://www.youtube.com/watch?v=rtF51pQB6Wc"
      },
      {
        name: "Double-Under",
        description: "A jump rope exercise where the rope passes under the feet twice in a single jump.",
        category: "Cardio",
        videoUrl: "https://www.youtube.com/watch?v=82jNjDS19lg"
      },
      {
        name: "Running",
        description: "Continuous movement on foot, used for cardiovascular endurance training.",
        category: "Cardio",
        videoUrl: "https://www.youtube.com/watch?v=brFHyOtTwH4"
      },
      {
        name: "Rowing",
        description: "Exercise on a rowing machine that provides a full-body workout.",
        category: "Cardio",
        videoUrl: "https://www.youtube.com/watch?v=H0r_ZPXJLtg"
      },
      {
        name: "Thruster",
        description: "A compound movement combining a front squat with a push press.",
        category: "Metcons",
        videoUrl: "https://www.youtube.com/watch?v=L219ltL15zk"
      },
      {
        name: "Wall Ball",
        description: "A movement where you throw a medicine ball to a target on the wall from a squat position.",
        category: "Metcons",
        videoUrl: "https://www.youtube.com/watch?v=fpUD0mcFp_0"
      },
      {
        name: "Burpee",
        description: "A full-body exercise that combines a squat, push-up, and jump.",
        category: "Metcons",
        videoUrl: "https://www.youtube.com/watch?v=dZgVxmf6jkA"
      }
    ];

    defaultExercises.forEach(exercise => {
      this.createExercise(exercise);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Workout methods
  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getWorkoutsByUserId(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getWorkoutsByType(userId: number, type: string): Promise<Workout[]> {
    return Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId && workout.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getRecentWorkouts(userId: number, limit: number): Promise<Workout[]> {
    return Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.workoutIdCounter++;
    const workout: Workout = { ...insertWorkout, id };
    this.workouts.set(id, workout);
    return workout;
  }

  async updateWorkout(id: number, workoutUpdate: Partial<Workout>): Promise<Workout | undefined> {
    const existingWorkout = this.workouts.get(id);
    if (!existingWorkout) {
      return undefined;
    }
    
    const updatedWorkout = { ...existingWorkout, ...workoutUpdate };
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }

  async deleteWorkout(id: number): Promise<boolean> {
    return this.workouts.delete(id);
  }

  // Exercise methods
  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async getExerciseByName(name: string): Promise<Exercise | undefined> {
    return Array.from(this.exercises.values()).find(
      exercise => exercise.name.toLowerCase() === name.toLowerCase()
    );
  }

  async getAllExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.category === category);
  }

  async searchExercises(query: string): Promise<Exercise[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.exercises.values())
      .filter(exercise => 
        exercise.name.toLowerCase().includes(lowercaseQuery) || 
        exercise.description.toLowerCase().includes(lowercaseQuery)
      );
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseIdCounter++;
    const exercise: Exercise = { ...insertExercise, id };
    this.exercises.set(id, exercise);
    return exercise;
  }

  // Personal Record methods
  async getPersonalRecord(id: number): Promise<PersonalRecord | undefined> {
    return this.personalRecords.get(id);
  }

  async getPersonalRecordsByUserId(userId: number): Promise<PersonalRecord[]> {
    return Array.from(this.personalRecords.values())
      .filter(pr => pr.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getPersonalRecordsByExerciseId(userId: number, exerciseId: number): Promise<PersonalRecord[]> {
    return Array.from(this.personalRecords.values())
      .filter(pr => pr.userId === userId && pr.exerciseId === exerciseId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getRecentPersonalRecords(userId: number, limit: number): Promise<PersonalRecord[]> {
    return Array.from(this.personalRecords.values())
      .filter(pr => pr.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createPersonalRecord(insertPR: InsertPersonalRecord): Promise<PersonalRecord> {
    const id = this.prIdCounter++;
    const pr: PersonalRecord = { ...insertPR, id };
    this.personalRecords.set(id, pr);
    return pr;
  }

  async updatePersonalRecord(id: number, prUpdate: Partial<PersonalRecord>): Promise<PersonalRecord | undefined> {
    const existingPR = this.personalRecords.get(id);
    if (!existingPR) {
      return undefined;
    }
    
    const updatedPR = { ...existingPR, ...prUpdate };
    this.personalRecords.set(id, updatedPR);
    return updatedPR;
  }

  async deletePersonalRecord(id: number): Promise<boolean> {
    return this.personalRecords.delete(id);
  }
  
  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupsByCoachId(coachId: number): Promise<Group[]> {
    return Array.from(this.groups.values())
      .filter(group => group.coachId === coachId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getGroupsForUser(userId: number): Promise<Group[]> {
    // Encontrar grupos onde o usuário é membro
    const membershipGroups = Array.from(this.groupMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.groupId);
      
    return Array.from(this.groups.values())
      .filter(group => membershipGroups.includes(group.id));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const createdAt = new Date();
    const group: Group = { ...insertGroup, id, createdAt };
    this.groups.set(id, group);
    return group;
  }

  async updateGroup(id: number, groupUpdate: Partial<Group>): Promise<Group | undefined> {
    const existingGroup = this.groups.get(id);
    if (!existingGroup) {
      return undefined;
    }
    
    const updatedGroup = { ...existingGroup, ...groupUpdate };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteGroup(id: number): Promise<boolean> {
    // Remover membros do grupo
    Array.from(this.groupMembers.values())
      .filter(member => member.groupId === id)
      .forEach(member => this.groupMembers.delete(member.id));
      
    // Remover workouts programados para o grupo
    Array.from(this.scheduledWorkouts.values())
      .filter(workout => workout.groupId === id)
      .forEach(workout => this.scheduledWorkouts.delete(workout.id));
      
    return this.groups.delete(id);
  }
  
  // Group Member methods
  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const joinedAt = new Date();
    const member: GroupMember = { ...insertMember, id, joinedAt };
    this.groupMembers.set(id, member);
    return member;
  }

  async removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    const member = Array.from(this.groupMembers.values())
      .find(m => m.groupId === groupId && m.userId === userId);
      
    if (!member) {
      return false;
    }
    
    return this.groupMembers.delete(member.id);
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId)
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
  }
  
  // Scheduled Workout methods
  async getScheduledWorkout(id: number): Promise<ScheduledWorkout | undefined> {
    return this.scheduledWorkouts.get(id);
  }

  async getScheduledWorkoutsByGroupId(groupId: number): Promise<ScheduledWorkout[]> {
    return Array.from(this.scheduledWorkouts.values())
      .filter(workout => workout.groupId === groupId)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  async getUpcomingWorkoutsForUser(userId: number): Promise<ScheduledWorkout[]> {
    // Encontrar grupos onde o usuário é membro
    const userGroups = await this.getGroupsForUser(userId);
    const userGroupIds = userGroups.map(group => group.id);
    
    const now = new Date();
    
    return Array.from(this.scheduledWorkouts.values())
      .filter(workout => 
        userGroupIds.includes(workout.groupId) && 
        new Date(workout.scheduledDate).getTime() >= now.getTime()
      )
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  async createScheduledWorkout(insertWorkout: InsertScheduledWorkout): Promise<ScheduledWorkout> {
    const id = this.scheduledWorkoutIdCounter++;
    const createdAt = new Date();
    const workout: ScheduledWorkout = { ...insertWorkout, id, createdAt };
    this.scheduledWorkouts.set(id, workout);
    return workout;
  }

  async updateScheduledWorkout(id: number, workoutUpdate: Partial<ScheduledWorkout>): Promise<ScheduledWorkout | undefined> {
    const existingWorkout = this.scheduledWorkouts.get(id);
    if (!existingWorkout) {
      return undefined;
    }
    
    const updatedWorkout = { ...existingWorkout, ...workoutUpdate };
    this.scheduledWorkouts.set(id, updatedWorkout);
    return updatedWorkout;
  }

  async deleteScheduledWorkout(id: number): Promise<boolean> {
    // Remover resultados relacionados a este workout
    Array.from(this.workoutResults.values())
      .filter(result => result.scheduledWorkoutId === id)
      .forEach(result => this.workoutResults.delete(result.id));
      
    return this.scheduledWorkouts.delete(id);
  }
  
  // Workout Result methods
  async getWorkoutResult(id: number): Promise<WorkoutResult | undefined> {
    return this.workoutResults.get(id);
  }

  async getWorkoutResultsByUserId(userId: number): Promise<WorkoutResult[]> {
    return Array.from(this.workoutResults.values())
      .filter(result => result.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  async getWorkoutResultsByScheduledWorkout(scheduledWorkoutId: number): Promise<WorkoutResult[]> {
    return Array.from(this.workoutResults.values())
      .filter(result => result.scheduledWorkoutId === scheduledWorkoutId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  async createWorkoutResult(insertResult: InsertWorkoutResult): Promise<WorkoutResult> {
    const id = this.workoutResultIdCounter++;
    const completedAt = new Date();
    const result: WorkoutResult = { ...insertResult, id, completedAt };
    this.workoutResults.set(id, result);
    return result;
  }

  async updateWorkoutResult(id: number, resultUpdate: Partial<WorkoutResult>): Promise<WorkoutResult | undefined> {
    const existingResult = this.workoutResults.get(id);
    if (!existingResult) {
      return undefined;
    }
    
    const updatedResult = { ...existingResult, ...resultUpdate };
    this.workoutResults.set(id, updatedResult);
    return updatedResult;
  }
}

export const storage = new MemStorage();
