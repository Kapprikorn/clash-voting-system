import {Component, inject} from '@angular/core';
import {User} from '@angular/fire/auth';
import {FirebaseChampion} from '../../../models/firebase.models';
import {FirebaseService} from '../../../services/http/firebase.service';
import {SessionService} from '../../../services/session.service';

@Component({
  selector: 'app-voting-statistics',
  imports: [],
  templateUrl: './voting-statistics.html',
  styleUrl: './voting-statistics.scss'
})
export class VotingStatistics {
  private firebaseService = inject(FirebaseService);
  private sessionService = inject(SessionService);

  protected user: User | null;
  protected champions: FirebaseChampion[] = [];

  constructor() {
    this.user = this.sessionService.getCurrentUser();
    this.firebaseService.getChampions(this.sessionService.getCurrentSessionId()).subscribe({
      next: value => this.champions = value,
    });
  }

  protected getTotalVotes(): number {
    return this.champions.reduce((total, champion) => total + (champion.votes.length || 0), 0);
  }

  protected getLeadingChampion(): any {
    if (this.champions.length === 0) return null;

    return this.champions.reduce((leading, current) =>
      (current.votes.length || 0) > (leading.votes.length || 0) ? current : leading
    );
  }

  protected getUserVoteCount(): number {
    if (!this.user) return 0;

    return this.champions.filter(champion =>
      champion.votes?.includes(this.user!.uid)
    ).length;
  }
}
