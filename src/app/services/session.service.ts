import {inject, Injectable} from '@angular/core';
import {collection, doc, Firestore, getDoc, onSnapshot, setDoc, Unsubscribe} from '@angular/fire/firestore';
import {Auth, User} from '@angular/fire/auth';
import {BehaviorSubject} from 'rxjs';
import {FirebaseChampion} from '../models/firebase.models';

export interface Champion extends FirebaseChampion {
  id: string;
  name: string;
  votes: string[];
  voteCount: number;

  [key: string]: any;
}

export interface SessionInfo {
  sessionId: string;
  createdAt: Date;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private currentSessionSubject = new BehaviorSubject<string>('');
  private championsSubject = new BehaviorSubject<Champion[]>([]);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private championsUnsubscribe?: Unsubscribe;

  // Public observables
  public currentSession$ = this.currentSessionSubject.asObservable();
  public champions$ = this.championsSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Listen to auth state changes
    this.auth.onAuthStateChanged((user) => {
      this.currentUserSubject.next(user);
    });
  }

  /**
   * Get the current session ID
   */
  getCurrentSessionId(): string {
    return this.currentSessionSubject.value;
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get the current champions array
   */
  getCurrentChampions(): Champion[] {
    return this.championsSubject.value;
  }

  /**
   * Initialize session management - loads current session and sets up listeners
   */
  async initializeSession(): Promise<void> {
    await this.loadCurrentSession();
    this.loadChampions();
  }

  /**
   * Load the current active session from Firestore
   */
  async loadCurrentSession(): Promise<void> {
    try {
      const currentSessionDoc = doc(this.firestore, 'settings/currentSession');
      const docSnap = await getDoc(currentSessionDoc);

      if (docSnap.exists()) {
        const sessionId = docSnap.data()['sessionId'];
        this.currentSessionSubject.next(sessionId);
      } else {
        await this.createNewSession();
      }
    } catch (error) {
      console.error('Error loading current session:', error);
      throw error;
    }
  }

  /**
   * Create a new voting session
   */
  async createNewSession(): Promise<string> {
    const timestamp = new Date();
    const sessionId = `session_${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}-${String(timestamp.getMinutes()).padStart(2, '0')}-${String(timestamp.getSeconds()).padStart(2, '0')}`;

    try {
      // Update current session reference
      const currentSessionDoc = doc(this.firestore, 'settings/currentSession');
      await setDoc(currentSessionDoc, {
        sessionId: sessionId,
        createdAt: timestamp
      });

      // Create the new session document
      const sessionDoc = doc(this.firestore, `votingSessions/${sessionId}`);
      await setDoc(sessionDoc, {
        createdAt: timestamp,
        status: 'active'
      });

      this.currentSessionSubject.next(sessionId);
      this.championsSubject.next([]); // Clear champions for new session
      this.loadChampions(); // Start listening to the new session's champions

      return sessionId;
    } catch (error) {
      console.error('Error creating new session:', error);
      throw error;
    }
  }

  /**
   * Load and listen to champions for the current session
   */
  private loadChampions(): void {
    const currentSessionId = this.currentSessionSubject.value;
    if (!currentSessionId) return;

    // Unsubscribe from previous listener if exists
    if (this.championsUnsubscribe) {
      this.championsUnsubscribe();
    }

    const championsRef = collection(this.firestore, `votingSessions/${currentSessionId}/champions`);

    this.championsUnsubscribe = onSnapshot(championsRef, (snapshot) => {
      const champions: Champion[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          voteCount: data['votes']?.length || 0
        } as Champion;
      }).sort((a, b) => b.voteCount - a.voteCount);

      this.championsSubject.next(champions);
    });
  }

  /**
   * Get the number of votes the current user has cast
   */
  getUserVoteCount(): number {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return 0;

    const champions = this.getCurrentChampions();
    return champions.filter(champion =>
      champion.votes?.includes(currentUser.uid)
    ).length;
  }

  /**
   * Get session information
   */
  async getSessionInfo(sessionId?: string): Promise<SessionInfo | null> {
    const targetSessionId = sessionId || this.getCurrentSessionId();
    if (!targetSessionId) return null;

    try {
      const sessionDoc = doc(this.firestore, `votingSessions/${targetSessionId}`);
      const docSnap = await getDoc(sessionDoc);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          sessionId: targetSessionId,
          createdAt: data['createdAt']?.toDate() || new Date(),
          status: data['status'] || 'unknown'
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting session info:', error);
      return null;
    }
  }

  /**
   * Check if a user has voted for a specific champion
   */
  hasUserVotedForChampion(championId: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const champions = this.getCurrentChampions();
    const champion = champions.find(c => c.id === championId);
    return champion?.votes?.includes(currentUser.uid) || false;
  }

  /**
   * Get a specific champion by ID
   */
  getChampionById(championId: string): Champion | undefined {
    const champions = this.getCurrentChampions();
    return champions.find(c => c.id === championId);
  }

  /**
   * Clean up subscriptions
   */
  destroy(): void {
    if (this.championsUnsubscribe) {
      this.championsUnsubscribe();
    }
  }
}
