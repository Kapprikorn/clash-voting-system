import {EnvironmentInjector, inject, Injectable, runInInjectionContext} from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  DocumentReference,
  Firestore,
  orderBy,
  query,
  updateDoc,
} from '@angular/fire/firestore';
import {Auth, authState} from '@angular/fire/auth';
import {from, map, Observable} from 'rxjs';
import {FirebaseChampion, Settings, VoteRequest, VotingSession} from '../../models/firebase.models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private env = inject(EnvironmentInjector);

  constructor() {
  }

  // Settings methods
  getSettings(): Observable<Settings[]> {
    return runInInjectionContext(this.env, () => {
      const ref = collection(this.firestore, 'settings');
      return collectionData(ref, {idField: 'id'}) as Observable<Settings[]>;
    });
  }

  getSetting(id: string): Observable<Settings | null> {
    return runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, 'settings', id);
      return docData(ref, {idField: 'id'}).pipe(
        map(d => (d as Settings) ?? null)
      );
    });
  }

  updateSetting(id: string, data: Partial<Settings>): Observable<void> {
    return from(runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, 'settings', id);
      return updateDoc(ref, data);
    }));
  }

  createSetting(data: Omit<Settings, 'id'>): Observable<DocumentReference> {
    return from(runInInjectionContext(this.env, () => {
      const ref = collection(this.firestore, 'settings');
      return addDoc(ref, data);
    }));
  }

  // Voting Sessions methods
  getVotingSessions(): Observable<VotingSession[]> {
    return runInInjectionContext(this.env, () => {
      const ref = collection(this.firestore, 'votingSessions');
      const q = query(ref, orderBy('createdAt', 'desc'));
      return collectionData(q, {idField: 'id'}).pipe(
        map((sessions: any[]) =>
          sessions.map(s => ({
            ...s,
            createdAt: s['createdAt']?.toDate ? s['createdAt'].toDate() : (s['createdAt'] ?? new Date()),
            endDate: s['endDate']?.toDate ? s['endDate'].toDate() : s['endDate']
          }) as VotingSession)
        )
      );
    });
  }

  getVotingSession(sessionId: string): Observable<VotingSession | null> {
    return runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, 'votingSessions', sessionId);
      return docData(ref, {idField: 'id'}).pipe(
        map((d: any | undefined) => {
          if (!d) return null;
          return {
            ...d,
            createdAt: d['createdAt']?.toDate ? d['createdAt'].toDate() : (d['createdAt'] ?? new Date()),
            endDate: d['endDate']?.toDate ? d['endDate'].toDate() : d['endDate']
          } as VotingSession;
        })
      );
    });
  }

  createVotingSession(data: Omit<VotingSession, 'id'>): Observable<DocumentReference> {
    return from(runInInjectionContext(this.env, () => {
      const ref = collection(this.firestore, 'votingSessions');
      const sessionData = {
        ...data,
        createdAt: new Date(),
        endDate: data.endDate || null
      };
      return addDoc(ref, sessionData);
    }));
  }

  updateVotingSession(sessionId: string, data: Partial<VotingSession>): Observable<void> {
    return from(runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, 'votingSessions', sessionId);
      const updateData: any = {...data};
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }
      return updateDoc(ref, updateData);
    }));
  }

  deleteVotingSession(sessionId: string): Observable<void> {
    return from(runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, 'votingSessions', sessionId);
      return deleteDoc(ref);
    }));
  }

  // Champions methods
  getChampions(sessionId: string): Observable<FirebaseChampion[]> {
    if (!sessionId) throw new Error('no sessionId given');
    return runInInjectionContext(this.env, () => {
      const ref = collection(this.firestore, `votingSessions/${sessionId}/champions`);
      return collectionData(ref, {idField: 'id'}) as Observable<FirebaseChampion[]>;
    });
  }

  getChampion(sessionId: string, championId: string): Observable<FirebaseChampion | null> {
    return runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, `votingSessions/${sessionId}/champions`, championId);
      return docData(ref, {idField: 'id'}).pipe(
        map(d => (d as FirebaseChampion) ?? null)
      );
    });
  }

  createChampion(
    sessionId: string,
    data: Omit<FirebaseChampion, 'id' | 'votes' | 'voteCount' | 'createdAt'>
  ): Observable<DocumentReference> {
    return from(runInInjectionContext(this.env, () => {
      const ref = collection(this.firestore, `votingSessions/${sessionId}/champions`);
      const championData = {
        ...data,
        votes: [],
        createdAt: new Date()
      };
      return addDoc(ref, championData);
    }));
  }

  updateChampion(sessionId: string, championId: string, data: Partial<FirebaseChampion>): Observable<void> {
    return from(runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, `votingSessions/${sessionId}/champions`, championId);
      const updateData = {...data} as Partial<FirebaseChampion>;
      delete (updateData as any).id;
      return updateDoc(ref, updateData as any);
    }));
  }

  deleteChampion(sessionId: string, championId: string): Observable<void> {
    return from(runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, `votingSessions/${sessionId}/champions`, championId);
      return deleteDoc(ref);
    }));
  }

  // Voting methods
  voteForChampion(voteRequest: VoteRequest): Observable<void> {
    return from(runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, `votingSessions/${voteRequest.sessionId}/champions`, voteRequest.championId);
      return updateDoc(ref, {votes: arrayUnion(voteRequest.userId)});
    }));
  }

  removeVoteForChampion(voteRequest: VoteRequest): Observable<void> {
    return from(runInInjectionContext(this.env, () => {
      const ref = doc(this.firestore, `votingSessions/${voteRequest.sessionId}/champions`, voteRequest.championId);
      return updateDoc(ref, {votes: arrayRemove(voteRequest.userId)});
    }));
  }

  // Utility methods
  getCurrentUser(): Observable<any> {
    return runInInjectionContext(this.env, () => authState(this.auth));
  }

  isAdmin(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => user?.email === '<admin@example.com>')
    );
  }

  hasUserVoted(sessionId: string, championId: string, userId: string): Observable<boolean> {
    return this.getChampion(sessionId, championId).pipe(
      map(champion => champion?.votes?.includes(userId) || false)
    );
  }

  getUserVotesInSession(sessionId: string, userId: string): Observable<string[]> {
    return this.getChampions(sessionId).pipe(
      map(champions =>
        champions
          .filter(champion => champion.votes?.includes(userId))
          .map(champion => champion.id!)
      )
    );
  }
}
