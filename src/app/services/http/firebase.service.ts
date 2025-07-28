import {inject, Injectable} from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  Firestore,
  onSnapshot,
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

  // Collection references
  private settingsCollection = collection(this.firestore, 'settings');
  private votingSessionsCollection = collection(this.firestore, 'votingSessions');

  constructor() {
  }

  // Settings methods
  getSettings(): Observable<Settings[]> {
    return new Observable(observer => {
      const unsubscribe = onSnapshot(this.settingsCollection, snapshot => {
        const settings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Settings));
        observer.next(settings);
      }, error => observer.error(error));

      return () => unsubscribe();
    });
  }

  getSetting(id: string): Observable<Settings | null> {
    const settingDoc = doc(this.firestore, 'settings', id);
    return new Observable(observer => {
      const unsubscribe = onSnapshot(settingDoc, snapshot => {
        if (snapshot.exists()) {
          observer.next({id: snapshot.id, ...snapshot.data()} as Settings);
        } else {
          observer.next(null);
        }
      }, error => observer.error(error));

      return () => unsubscribe();
    });
  }

  updateSetting(id: string, data: Partial<Settings>): Observable<void> {
    const settingDoc = doc(this.firestore, 'settings', id);
    return from(updateDoc(settingDoc, data));
  }

  createSetting(data: Omit<Settings, 'id'>): Observable<DocumentReference> {
    return from(addDoc(this.settingsCollection, data));
  }

  // Voting Sessions methods
  getVotingSessions(): Observable<VotingSession[]> {
    const q = query(this.votingSessionsCollection, orderBy('createdAt', 'desc'));
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const sessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate() || new Date(),
          endDate: doc.data()['endDate']?.toDate()
        } as VotingSession));
        observer.next(sessions);
      }, error => observer.error(error));

      return () => unsubscribe();
    });
  }

  getVotingSession(sessionId: string): Observable<VotingSession | null> {
    const sessionDoc = doc(this.firestore, 'votingSessions', sessionId);
    return new Observable(observer => {
      const unsubscribe = onSnapshot(sessionDoc, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          observer.next({
            id: snapshot.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date(),
            endDate: data['endDate']?.toDate()
          } as VotingSession);
        } else {
          observer.next(null);
        }
      }, error => observer.error(error));

      return () => unsubscribe();
    });
  }

  createVotingSession(data: Omit<VotingSession, 'id'>): Observable<DocumentReference> {
    const sessionData = {
      ...data,
      createdAt: new Date(),
      endDate: data.endDate || null
    };
    return from(addDoc(this.votingSessionsCollection, sessionData));
  }

  updateVotingSession(sessionId: string, data: Partial<VotingSession>): Observable<void> {
    const sessionDoc = doc(this.firestore, 'votingSessions', sessionId);
    const updateData = {...data};
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    return from(updateDoc(sessionDoc, updateData));
  }

  deleteVotingSession(sessionId: string): Observable<void> {
    const sessionDoc = doc(this.firestore, 'votingSessions', sessionId);
    return from(deleteDoc(sessionDoc));
  }

  // Champions methods
  getChampions(sessionId: string): Observable<FirebaseChampion[]> {
    if (!sessionId) throw new Error("no sessionId given");
    const championsCollection = collection(this.firestore, `votingSessions/${sessionId}/champions`);
    const q = query(championsCollection, orderBy('voteCount', 'desc'));

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, snapshot => {
        const champions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as FirebaseChampion));
        observer.next(champions);
      }, error => observer.error(error));

      return () => unsubscribe();
    });
  }

  getChampion(sessionId: string, championId: string): Observable<FirebaseChampion | null> {
    const championDoc = doc(this.firestore, `votingSessions/${sessionId}/champions`, championId);
    return new Observable(observer => {
      const unsubscribe = onSnapshot(championDoc, snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          observer.next({
            id: snapshot.id,
            ...data,
          } as FirebaseChampion);
        } else {
          observer.next(null);
        }
      }, error => observer.error(error));

      return () => unsubscribe();
    });
  }

  createChampion(sessionId: string, data: Omit<FirebaseChampion, 'id' | 'votes' | 'voteCount' | 'createdAt'>): Observable<DocumentReference> {
    const championsCollection = collection(this.firestore, `votingSessions/${sessionId}/champions`);
    const championData = {
      ...data,
      votes: [],
      createdAt: new Date()
    };
    return from(addDoc(championsCollection, championData));
  }

  updateChampion(sessionId: string, championId: string, data: Partial<FirebaseChampion>): Observable<void> {
    const championDoc = doc(this.firestore, `votingSessions/${sessionId}/champions`, championId);
    const updateData = {...data};
    delete updateData.id;
    return from(updateDoc(championDoc, updateData));
  }

  deleteChampion(sessionId: string, championId: string): Observable<void> {
    const championDoc = doc(this.firestore, `votingSessions/${sessionId}/champions`, championId);
    return from(deleteDoc(championDoc));
  }

  // Voting methods
  voteForChampion(voteRequest: VoteRequest): Observable<void> {
    const championDoc = doc(this.firestore, `votingSessions/${voteRequest.sessionId}/champions`, voteRequest.championId);
    return from(updateDoc(championDoc, {
      votes: arrayUnion(voteRequest.userId)
    }));
  }

  removeVoteForChampion(voteRequest: VoteRequest): Observable<void> {
    const championDoc = doc(this.firestore, `votingSessions/${voteRequest.sessionId}/champions`, voteRequest.championId);
    return from(updateDoc(championDoc, {
      votes: arrayRemove(voteRequest.userId)
    }));
  }

  // Utility methods
  getCurrentUser(): Observable<any> {
    return authState(this.auth);
  }

  isAdmin(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => user?.email === 'sjorsje11@gmail.com')
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
