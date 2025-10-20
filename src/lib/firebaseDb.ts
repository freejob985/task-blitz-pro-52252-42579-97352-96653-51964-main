// Firebase Firestore database service
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { AppData, Board, Task, FocusSession, AppSettings } from '@/types';

// Collection names
const COLLECTIONS = {
  BOARDS: 'boards',
  TASKS: 'tasks',
  SESSIONS: 'sessions',
  SETTINGS: 'settings'
} as const;

// Helper function to convert Firestore timestamps to ISO strings
const convertTimestamp = (timestamp: Timestamp | string | undefined): string => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as Timestamp).toDate().toISOString();
  }
  return (timestamp as string) || new Date().toISOString();
};

// Helper function to convert data for Firestore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prepareForFirestore = (data: any) => {
  const converted = { ...data };
  
  // Remove undefined values (Firestore doesn't allow undefined)
  Object.keys(converted).forEach(key => {
    if (converted[key] === undefined) {
      delete converted[key];
    }
  });
  
  // Convert date strings to Firestore timestamps
  if (converted.createdAt && typeof converted.createdAt === 'string') {
    converted.createdAt = Timestamp.fromDate(new Date(converted.createdAt));
  }
  if (converted.completedAt && typeof converted.completedAt === 'string') {
    converted.completedAt = Timestamp.fromDate(new Date(converted.completedAt));
  }
  if (converted.archivedAt && typeof converted.archivedAt === 'string') {
    converted.archivedAt = Timestamp.fromDate(new Date(converted.archivedAt));
  }
  if (converted.startedAt && typeof converted.startedAt === 'string') {
    converted.startedAt = Timestamp.fromDate(new Date(converted.startedAt));
  }
  if (converted.endedAt && typeof converted.endedAt === 'string') {
    converted.endedAt = Timestamp.fromDate(new Date(converted.endedAt));
  }
  
  return converted;
};

// Helper function to convert data from Firestore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertFromFirestore = (data: any) => {
  const converted = { ...data };
  
  // Convert Firestore timestamps to ISO strings
  converted.createdAt = convertTimestamp(converted.createdAt);
  if (converted.completedAt) {
    converted.completedAt = convertTimestamp(converted.completedAt);
  }
  if (converted.archivedAt) {
    converted.archivedAt = convertTimestamp(converted.archivedAt);
  }
  if (converted.startedAt) {
    converted.startedAt = convertTimestamp(converted.startedAt);
  }
  if (converted.endedAt) {
    converted.endedAt = convertTimestamp(converted.endedAt);
  }
  
  // Ensure required fields have default values if missing
  if (converted.archived === undefined || converted.archived === null) {
    converted.archived = false;
  }
  
  return converted;
};

// Initialize database (no-op for Firestore)
export async function initDB(): Promise<void> {
  // Firestore doesn't need initialization like IndexedDB
  // But we can check if we can connect to the database
  try {
    console.log('Firebase: Initializing database...');
    // Try to read from a collection to test connection
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app-settings');
    const settingsDoc = await getDoc(settingsRef);
    console.log('Firebase: Database connection successful, settings doc exists:', settingsDoc.exists());
  } catch (error) {
    console.error('Firebase connection error:', error);
    // Don't throw error, just log it and continue
    console.warn('Firebase connection failed, but continuing...');
  }
}

// Board functions
export async function getAllBoards(): Promise<Board[]> {
  try {
    const boardsRef = collection(db, COLLECTIONS.BOARDS);
    const q = query(boardsRef, orderBy('order'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    } as Board));
  } catch (error) {
    console.error('Error fetching boards:', error);
    return [];
  }
}

export async function saveBoard(board: Board): Promise<void> {
  try {
    const boardRef = doc(db, COLLECTIONS.BOARDS, board.id);
    const boardData = prepareForFirestore(board);
    await setDoc(boardRef, boardData);
  } catch (error) {
    console.error('Error saving board:', error);
    throw error;
  }
}

export async function deleteBoard(id: string): Promise<void> {
  try {
    const boardRef = doc(db, COLLECTIONS.BOARDS, id);
    await deleteDoc(boardRef);
  } catch (error) {
    console.error('Error deleting board:', error);
    throw error;
  }
}

// Task functions
export async function getAllTasks(): Promise<Task[]> {
  try {
    const tasksRef = collection(db, COLLECTIONS.TASKS);
    const querySnapshot = await getDocs(tasksRef);
    
    console.log('Firebase: Fetched', querySnapshot.docs.length, 'task documents');
    
    const tasks = querySnapshot.docs
      .map(doc => {
        const data = convertFromFirestore(doc.data());
        console.log('Firebase: Task data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data
        } as Task;
      })
      .filter(task => !task.archived); // Filter out archived tasks in JavaScript
    
    console.log('Firebase: Returning', tasks.length, 'non-archived tasks');
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export async function getArchivedTasks(): Promise<Task[]> {
  try {
    const tasksRef = collection(db, COLLECTIONS.TASKS);
    const q = query(tasksRef, where('archived', '==', true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    } as Task));
  } catch (error) {
    console.error('Error fetching archived tasks:', error);
    return [];
  }
}

export async function archiveTask(id: string): Promise<void> {
  try {
    const taskRef = doc(db, COLLECTIONS.TASKS, id);
    await setDoc(taskRef, {
      archived: true,
      archivedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error archiving task:', error);
    throw error;
  }
}

export async function unarchiveTask(id: string): Promise<void> {
  try {
    const taskRef = doc(db, COLLECTIONS.TASKS, id);
    await setDoc(taskRef, {
      archived: false,
      archivedAt: null
    }, { merge: true });
  } catch (error) {
    console.error('Error unarchiving task:', error);
    throw error;
  }
}

export async function getTasksByBoard(boardId: string): Promise<Task[]> {
  try {
    const tasksRef = collection(db, COLLECTIONS.TASKS);
    const q = query(
      tasksRef, 
      where('boardId', '==', boardId),
      orderBy('order')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Task))
      .filter(task => !task.archived); // Filter out archived tasks in JavaScript
  } catch (error) {
    console.error('Error fetching tasks by board:', error);
    return [];
  }
}

export async function saveTask(task: Task): Promise<void> {
  try {
    console.log('Firebase: Saving task:', task);
    const taskRef = doc(db, COLLECTIONS.TASKS, task.id);
    const taskData = prepareForFirestore({
      ...task,
      archived: task.archived || false // Ensure archived is always a boolean
    });
    console.log('Firebase: Prepared task data for Firestore:', taskData);
    await setDoc(taskRef, taskData);
    console.log('Firebase: Task saved successfully');
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    const taskRef = doc(db, COLLECTIONS.TASKS, id);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    tasks.forEach(task => {
      const taskRef = doc(db, COLLECTIONS.TASKS, task.id);
      const taskData = prepareForFirestore({
        ...task,
        archived: task.archived || false // Ensure archived is always a boolean
      });
      batch.set(taskRef, taskData);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw error;
  }
}

// Session functions
export async function getAllSessions(): Promise<FocusSession[]> {
  try {
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const q = query(sessionsRef, orderBy('startedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    } as FocusSession));
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

export async function saveSession(session: FocusSession): Promise<void> {
  try {
    const sessionRef = doc(db, COLLECTIONS.SESSIONS, session.id);
    const sessionData = prepareForFirestore(session);
    await setDoc(sessionRef, sessionData);
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}

// Settings functions
export async function getSettings(): Promise<AppSettings | null> {
  try {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app-settings');
    const docSnap = await getDoc(settingsRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    }
    
    // Return default settings if none exist
    const defaultSettings: AppSettings = {
      soundsEnabled: true,
      notificationsEnabled: true,
      theme: 'light',
      currentSound: 'default',
      showCompletedTasks: true,
    };
    
    await saveSettings(defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app-settings');
    await setDoc(settingsRef, settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

// Export and import functions
export async function exportAllData(): Promise<AppData> {
  const [boards, tasks, sessions, settings] = await Promise.all([
    getAllBoards(),
    getAllTasks(),
    getAllSessions(),
    getSettings(),
  ]);
  
  return {
    boards,
    tasks,
    settings: settings || {
      soundsEnabled: true,
      notificationsEnabled: true,
      theme: 'light',
      currentSound: 'default',
      showCompletedTasks: true,
    },
    focusSessions: sessions,
  };
}

export async function importAllData(data: AppData): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Import boards
    data.boards.forEach(board => {
      const boardRef = doc(db, COLLECTIONS.BOARDS, board.id);
      const boardData = prepareForFirestore(board);
      batch.set(boardRef, boardData);
    });
    
    // Import tasks
    data.tasks.forEach(task => {
      const taskRef = doc(db, COLLECTIONS.TASKS, task.id);
      const taskData = prepareForFirestore(task);
      batch.set(taskRef, taskData);
    });
    
    // Import sessions
    data.focusSessions.forEach(session => {
      const sessionRef = doc(db, COLLECTIONS.SESSIONS, session.id);
      const sessionData = prepareForFirestore(session);
      batch.set(sessionRef, sessionData);
    });
    
    // Import settings
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app-settings');
    batch.set(settingsRef, data.settings);
    
    await batch.commit();
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

// Delete all data
export async function deleteAllData(): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Get all documents and delete them
    const [boardsSnapshot, tasksSnapshot, sessionsSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.BOARDS)),
      getDocs(collection(db, COLLECTIONS.TASKS)),
      getDocs(collection(db, COLLECTIONS.SESSIONS))
    ]);
    
    // Delete boards
    boardsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete tasks
    tasksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete sessions
    sessionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete settings
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app-settings');
    batch.delete(settingsRef);
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting all data:', error);
    throw error;
  }
}

// Real-time listeners (optional - for future use)
export function subscribeToBoards(callback: (boards: Board[]) => void) {
  const boardsRef = collection(db, COLLECTIONS.BOARDS);
  const q = query(boardsRef, orderBy('order'));
  
  return onSnapshot(q, (querySnapshot) => {
    const boards = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFromFirestore(doc.data())
    } as Board));
    callback(boards);
  });
}

export function subscribeToTasks(callback: (tasks: Task[]) => void) {
  const tasksRef = collection(db, COLLECTIONS.TASKS);
  
  return onSnapshot(tasksRef, (querySnapshot) => {
    const tasks = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Task))
      .filter(task => !task.archived); // Filter out archived tasks in JavaScript
    callback(tasks);
  });
}

export function subscribeToTasksByBoard(boardId: string, callback: (tasks: Task[]) => void) {
  const tasksRef = collection(db, COLLECTIONS.TASKS);
  const q = query(
    tasksRef, 
    where('boardId', '==', boardId),
    orderBy('order')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...convertFromFirestore(doc.data())
      } as Task))
      .filter(task => !task.archived); // Filter out archived tasks in JavaScript
    callback(tasks);
  });
}
