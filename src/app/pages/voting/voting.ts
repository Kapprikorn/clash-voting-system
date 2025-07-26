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
} from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { LoginComponent } from '../../components/login/login';
import { Subscription } from 'rxjs';
import {DataDragonChampion, DatadragonService} from '../../services/http/datadragon.service';
import {VoteDetails} from '../../components/vote-details/vote-details';
import {VotingStatistics} from '../../components/voting-statistics/voting-statistics';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.html',
  styleUrls: ['./voting.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, LoginComponent, VoteDetails, VotingStatistics]
})
export class VotingComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  protected datadragonService = inject(DatadragonService);
  private championsSubscription?: Subscription;

  championName: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  currentSessionId: string = '';
  champions: any[] = [];
  isAdmin: boolean = false;
  currentUser: User | null = null;
  availableChampions: DataDragonChampion[] = [];

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

    this.championsSubscription = new Subscription();
    this.championsSubscription.add(
      onSnapshot(championsRef, (snapshot) => {
        this.champions = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            voteCount: data['votes']?.length || 0
          };
        }).sort((a,b) => b.voteCount - a.voteCount);
      })
    );
  }

  getUserVoteCount(): number {
    if (!this.currentUser) return 0;

    return this.champions.filter(champion =>
      champion.votes?.includes(this.currentUser!.uid)
    ).length;
  }

  async addChampion() {
    if (!this.championName.trim()) {
      this.errorMessage = 'Please enter a vote-details name';
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
        createdAt: new Date(),
        createdBy: this.currentUser.uid
      });

      this.successMessage = `Champion "${this.championName}" added successfully!`;
      this.championName = '';
    } catch (error) {
      console.error('Error adding vote-details:', error);
      this.errorMessage = 'Error adding vote-details. Please try again.';
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
    this.datadragonService.getAllChampions().subscribe({
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
