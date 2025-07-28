import {inject, Injectable} from '@angular/core';
import {doc, Firestore, getDoc, setDoc} from '@angular/fire/firestore';
import {Auth, User} from '@angular/fire/auth';
import {BehaviorSubject, filter, Subscription, switchMap} from 'rxjs';
import {FirebaseChampion} from '../models/firebase.models';
import {FirebaseService} from './http/firebase.service';

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
  private firebaseService = inject(FirebaseService);

  private currentSessionSubject = new BehaviorSubject<string>('');
  private championsSubject = new BehaviorSubject<Champion[]>([]);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private championsSubscription?: Subscription;

  // Public observables
  public currentSession$ = this.currentSessionSubject.asObservable();
  public champions$ = this.championsSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Listen to auth state changes
    this.auth.onAuthStateChanged((user) => {
      this.currentUserSubject.next(user);
    });

    // Set up champions listener when session changes
    this.setupChampionsListener();
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

      return sessionId;
    } catch (error) {
      console.error('Error creating new session:', error);
      throw error;
    }
  }

  /**
   * Set up champions listener using FirebaseService
   */
  private setupChampionsListener(): void {
    // Clean up previous subscription
    if (this.championsSubscription) {
      this.championsSubscription.unsubscribe();
    }

    this.championsSubscription = this.currentSession$.pipe(
      filter(sessionId => !!sessionId),
      switchMap(sessionId => this.firebaseService.getChampions(sessionId))
    ).subscribe(champions => {
      // Transform FirebaseChampion to Champion with voteCount and sorting
      const transformedChampions: Champion[] = champions.map(champion => ({
        ...champion,
        voteCount: champion.votes?.length || 0
      } as Champion)).sort((a, b) => {
        // Primary sort: by voteCount (descending - highest votes first)
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }
        // Secondary sort: by name (ascending - alphabetical order)
        return a.name.localeCompare(b.name);
      });

      this.championsSubject.next(transformedChampions);
    });
  }


  /**
   * Clean up subscriptions
   */
  destroy(): void {
    if (this.championsSubscription) {
      this.championsSubscription.unsubscribe();
    }
  }
}
