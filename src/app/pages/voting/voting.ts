import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from '../../components/login/login';
import { Subscription } from 'rxjs';
import { DataDragonChampion, DatadragonService } from '../../services/http/datadragon.service';
import { VotingSection } from '../../components/voting/voting-section/voting-section';
import { AddChampionSection } from '../../components/champion/add-champion-section/add-champion-section';
import { AdminSection } from '../../components/admin/admin-section/admin-section';
import { SessionService, Champion } from '../../services/session.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.html',
  styleUrls: ['./voting.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, LoginComponent, VotingSection, AddChampionSection, AdminSection]
})
export class VotingComponent implements OnInit, OnDestroy {
  protected datadragonService = inject(DatadragonService);
  private sessionService = inject(SessionService);
  private subscriptions = new Subscription();

  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  currentSessionId: string = '';
  champions: Champion[] = [];
  isAdmin: boolean = false;
  currentUser: User | null = null;
  availableChampions: DataDragonChampion[] = [];

  async ngOnInit() {
    // Subscribe to session service observables
    this.subscriptions.add(
      this.sessionService.currentSession$.subscribe(sessionId => {
        this.currentSessionId = sessionId;
      })
    );

    this.subscriptions.add(
      this.sessionService.champions$.subscribe(champions => {
        this.champions = champions;
      })
    );

    this.subscriptions.add(
      this.sessionService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Initialize session
    try {
      await this.sessionService.initializeSession();
    } catch (error) {
      console.error('Error initializing session:', error);
      this.errorMessage = 'Error loading session. Please refresh the page.';
    }

    this.loadAvailableChampions();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.sessionService.destroy();
  }

  onAdminStatusChange(isAdmin: boolean) {
    this.isAdmin = isAdmin;
  }

  getUserVoteCount(): number {
    return this.sessionService.getUserVoteCount();
  }

  async createNewSession() {
    try {
      this.isLoading = true;
      await this.sessionService.createNewSession();
      this.successMessage = 'New voting session created!';
      this.errorMessage = '';
    } catch (error) {
      console.error('Error creating new session:', error);
      this.errorMessage = 'Error creating new session. Please try again.';
      this.successMessage = '';
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
