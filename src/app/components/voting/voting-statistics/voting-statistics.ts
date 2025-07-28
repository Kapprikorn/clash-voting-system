import {Component, inject} from '@angular/core';
import {FirebaseService} from '../../../services/http/firebase.service';
import {SessionService} from '../../../services/session.service';
import {filter, switchMap} from 'rxjs/operators';
import {combineLatest, map} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-voting-statistics',
  imports: [
    AsyncPipe
  ],
  templateUrl: './voting-statistics.html',
  styleUrl: './voting-statistics.scss'
})
export class VotingStatistics {
  private firebaseService = inject(FirebaseService);
  private sessionService = inject(SessionService);

  protected user$ = this.firebaseService.getCurrentUser();

  protected champions$ = this.sessionService.currentSession$.pipe(
    filter(sessionId => !!sessionId),
    switchMap(sessionId => this.firebaseService.getChampions(sessionId))
  );

  // Computed statistics
  protected totalVotes$ = this.champions$.pipe(
    map(champions => champions.reduce((total, champion) =>
      total + (champion.votes?.length || 0), 0
    ))
  );

  protected leadingChampion$ = this.champions$.pipe(
    map(champions => {
      if (champions.length === 0) return null;
      return champions.reduce((leading, current) =>
        (current.votes?.length || 0) > (leading.votes?.length || 0) ? current : leading
      );
    })
  );

  protected userVoteCount$ = combineLatest([this.user$, this.champions$]).pipe(
    map(([user, champions]) => {
      if (!user) return 0;
      return champions.filter(champion =>
        champion.votes?.includes(user.uid)
      ).length;
    })
  );

}
