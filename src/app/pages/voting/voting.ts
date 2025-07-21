import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove
} from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { LoginComponent } from '../../components/login/login';
import { Subscription } from 'rxjs';
import {Champion, Datadragon} from '../../services/http/datadragon';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.html',
  styleUrls: ['./voting.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, LoginComponent]
})
export class VotingComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private dataDragon = inject(Datadragon);
  private championsSubscription?: Subscription;

  championName: string = '';
  isLoading: boolean = false;
  isVoting: boolean = false;
  votingFor: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  currentSessionId: string = '';
  champions: any[] = [];
  isAdmin: boolean = false;
  currentUser: User | null = null;
  championNames: string[] = [];
  availableChampions: Champion[] = [];

  async ngOnInit() {
    // Listen to auth state changes
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
    });

    await this.loadCurrentSession();
    this.loadChampions();

    this.loadAvailableChampions();
  }

  ngOnDestroy() {
    this.championsSubscription?.unsubscribe();
  }

  onAdminStatusChange(isAdmin: boolean) {
    this.isAdmin = isAdmin;
  }

  async loadCurrentSession() {
    try {
      const currentSessionDoc = doc(this.firestore, 'settings/currentSession');
      const docSnap = await getDoc(currentSessionDoc);

      if (docSnap.exists()) {
        this.currentSessionId = docSnap.data()['sessionId'];
      } else {
        await this.createNewSession();
      }
    } catch (error) {
      console.error('Error loading current session:', error);
    }
  }

  loadChampions() {
    if (!this.currentSessionId) return;

    const championsRef = collection(this.firestore, `votingSessions/${this.currentSessionId}/champions`);
    const q = query(championsRef, orderBy('voteCount', 'desc'));

    this.championsSubscription = new Subscription();
    this.championsSubscription.add(
      onSnapshot(q, (snapshot) => {
        this.champions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      })
    );
  }

  hasUserVotedFor(championId: string): boolean {
    if (!this.currentUser) return false;

    const champion = this.champions.find(c => c.id === championId);
    return champion?.votes?.includes(this.currentUser.uid) || false;
  }

  async vote(championId: string, championName: string) {
    if (this.isVoting || !this.currentUser) {
      if (!this.currentUser) {
        this.errorMessage = 'Please sign in to vote';
      }
      return;
    }

    // Check if user already voted for this champion
    if (this.hasUserVotedFor(championId)) {
      this.errorMessage = `You have already voted for ${championName}`;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isVoting = true;
    this.votingFor = championId;
    this.errorMessage = '';

    try {
      const championRef = doc(this.firestore, `votingSessions/${this.currentSessionId}/champions/${championId}`);

      // Get current document to calculate new vote count
      const championDoc = await getDoc(championRef);
      if (championDoc.exists()) {
        const currentVotes = championDoc.data()['votes'] || [];
        if (!currentVotes.includes(this.currentUser.uid)) {
          await updateDoc(championRef, {
            votes: arrayUnion(this.currentUser.uid),
            voteCount: currentVotes.length + 1
          });
        }
      }

      this.successMessage = `Vote cast for ${championName}!`;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Error voting:', error);
      this.errorMessage = 'Error casting vote. Please try again.';
    } finally {
      this.isVoting = false;
      this.votingFor = '';
    }
  }

  async unvote(championId: string, championName: string) {
    if (!this.currentUser || !this.hasUserVotedFor(championId)) return;

    this.isVoting = true;
    this.errorMessage = '';

    try {
      const championRef = doc(this.firestore, `votingSessions/${this.currentSessionId}/champions/${championId}`);

      // Get current document to calculate new vote count
      const championDoc = await getDoc(championRef);
      if (championDoc.exists()) {
        const currentVotes = championDoc.data()['votes'] || [];
        if (currentVotes.includes(this.currentUser.uid)) {
          await updateDoc(championRef, {
            votes: arrayRemove(this.currentUser.uid),
            voteCount: currentVotes.length - 1
          });
        }
      }

      this.successMessage = `Vote removed for ${championName}!`;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Error removing vote:', error);
      this.errorMessage = 'Error removing vote. Please try again.';
    } finally {
      this.isVoting = false;
    }
  }

  getUserVoteCount(): number {
    if (!this.currentUser) return 0;

    return this.champions.filter(champion =>
      champion.votes?.includes(this.currentUser!.uid)
    ).length;
  }

  getTotalVotes(): number {
    return this.champions.reduce((total, champion) => total + (champion.voteCount || 0), 0);
  }

  getLeadingChampion(): any {
    if (this.champions.length === 0) return null;
    return this.champions.reduce((leading, current) =>
      (current.voteCount || 0) > (leading.voteCount || 0) ? current : leading
    );
  }

  getVotePercentage(voteCount: number): number {
    const total = this.getTotalVotes();
    return total === 0 ? 0 : (voteCount / total) * 100;
  }

  async addChampion() {
    if (!this.championName.trim()) {
      this.errorMessage = 'Please enter a champion name';
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'Please sign in to add champions';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const championsCollection = collection(this.firestore, `votingSessions/${this.currentSessionId}/champions`);
      await addDoc(championsCollection, {
        name: this.championName.trim(),
        votes: [], // Array of user IDs
        voteCount: 0, // Computed field for easier sorting/display
        createdAt: new Date(),
        createdBy: this.currentUser.uid
      });

      this.successMessage = `Champion "${this.championName}" added successfully!`;
      this.championName = '';
    } catch (error) {
      console.error('Error adding champion:', error);
      this.errorMessage = 'Error adding champion. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async createNewSession() {
    const timestamp = new Date();
    const sessionId = `session_${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}-${String(timestamp.getMinutes()).padStart(2, '0')}-${String(timestamp.getSeconds()).padStart(2, '0')}`;

    try {
      const currentSessionDoc = doc(this.firestore, 'settings/currentSession');
      await setDoc(currentSessionDoc, {
        sessionId: sessionId,
        createdAt: timestamp
      });

      const sessionDoc = doc(this.firestore, `votingSessions/${sessionId}`);
      await setDoc(sessionDoc, {
        createdAt: timestamp,
        status: 'active'
      });

      this.currentSessionId = sessionId;
      this.champions = [];
      this.successMessage = 'New voting session created!';

      this.loadChampions();
    } catch (error) {
      console.error('Error creating new session:', error);
      this.errorMessage = 'Error creating new session. Please try again.';
    }
  }

  async clearAllChampions() {
    if (!confirm('This will start a new voting session. All current votes will be archived. Continue?')) {
      return;
    }

    this.isLoading = true;
    try {
      await this.createNewSession();
    } catch (error) {
      console.error('Error clearing champions:', error);
      this.errorMessage = 'Error starting new session. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private loadAvailableChampions(): void {
    this.dataDragon.getAllChampions().subscribe({
      next: (champions) => {
        this.availableChampions = champions.sort(); // Sort alphabetically
      },
      error: (error) => {
        console.error('Failed to load champions:', error);
        this.availableChampions = []; // Fallback to empty array
      }
    });
  }
}
