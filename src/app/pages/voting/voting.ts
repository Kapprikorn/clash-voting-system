import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {AsyncPipe, CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {catchError, combineLatest, map, of, Subscription} from 'rxjs';
import {DatadragonService} from '../../services/http/datadragon.service';
import {VotingSection} from '../../components/voting/voting-section/voting-section';
import {AddChampionSection} from '../../components/champion/add-champion-section/add-champion-section';
import {SessionService} from '../../services/session.service';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.html',
  styleUrls: ['./voting.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    AsyncPipe,
    VotingSection,
    AddChampionSection,
  ]
})
export class VotingComponent implements OnInit, OnDestroy {
  private datadragonService = inject(DatadragonService);
  private sessionService = inject(SessionService);
  private subscriptions = new Subscription();

  // Reactive data streams
  protected user$ = this.sessionService.currentUser$;

  protected userVoteCount$ = combineLatest([
    this.user$,
    this.sessionService.champions$ // Assuming this exists
  ]).pipe(
    map(([user, champions]) => {
      if (!user) return 0;
      return champions.filter(champion =>
        champion.votes?.includes(user.uid)
      ).length;
    })
  );

  protected availableChampions$ = this.datadragonService.getAllChampions().pipe(
    map(champions => champions.sort()),
    catchError(error => {
      console.error('Failed to load champions:', error);
      return of([]); // Return empty array on error
    })
  );

  // Local state
  protected isLoading = false;
  protected errorMessage = '';

  async ngOnInit() {
    // Initialize session
    try {
      await this.sessionService.initializeSession();
    } catch (error) {
      console.error('Error initializing session:', error);
      this.errorMessage = 'Error loading session. Please refresh the page.';
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.sessionService.destroy();
  }
}
