import {EnvironmentInjector, inject, Injectable, runInInjectionContext} from '@angular/core';
import {collection, doc, Firestore, getDocs, limit, orderBy, query, setDoc} from '@angular/fire/firestore';
import {Auth, authState, User} from '@angular/fire/auth';
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
  private envInjector = inject(EnvironmentInjector);

  private currentSessionSubject = new BehaviorSubject<SessionInfo | null>(null);
  private championsSubject = new BehaviorSubject<Champion[]>([]);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private championsSubscription?: Subscription;

  // Public observables
  public currentSession$ = this.currentSessionSubject.asObservable();
  public champions$ = this.championsSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Use AngularFire's zone-aware authState observable instead of raw onAuthStateChanged
    authState(this.auth).subscribe((user) => {
      this.currentUserSubject.next(user);
    });

    // Set up champions listener when session changes
    this.setupChampionsListener();
  }

  /**
   * Get the current session ID
   */
  getCurrentSessionId(): string {
    const currentSession = this.currentSessionSubject.value;
    return currentSession?.sessionId || '';
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
   * Create a new voting session
   */
  async createNewSession(): Promise<string> {
    const timestamp = new Date();
    const sessionId = `session_${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}-${String(timestamp.getMinutes()).padStart(2, '0')}-${String(timestamp.getSeconds()).padStart(2, '0')}`;

    try {
      // Create only the session document
      const session: SessionInfo = {
        createdAt: timestamp,
        status: 'active',
        sessionId: sessionId
      };
      const sessionDoc = doc(this.firestore, `votingSessions/${sessionId}`);
      await setDoc(sessionDoc, session);

      this.currentSessionSubject.next(session);
      this.championsSubject.next([]); // Clear champions for new session

      return sessionId;
    } catch (error) {
      console.error('Error creating new session:', error);
      throw error;
    }
  }

  /**
   * Load the most recent session (by createdAt timestamp)
   * Wrap Firebase SDK call in Angular's injection context to avoid warnings.
   */
  private async loadCurrentSession(): Promise<void> {
    try {
      await runInInjectionContext(this.envInjector, async () => {
        const sessionsQuery = query(
          collection(this.firestore, 'votingSessions'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(sessionsQuery);

        if (!snapshot.empty) {
          const sessionDoc = snapshot.docs[0];
          const data = sessionDoc.data() as any;
          const session: SessionInfo = {
            sessionId: sessionDoc.id,
            createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(data['createdAt']),
            status: data['status']
          };
          this.currentSessionSubject.next(session);
        } else {
          this.currentSessionSubject.next(null);
        }
      });
    } catch (error) {
      console.error('Error loading current session:', error);
      this.currentSessionSubject.next(null);
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
      filter(session => !!session),
      switchMap(session => this.firebaseService.getChampions((session as SessionInfo).sessionId))
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
