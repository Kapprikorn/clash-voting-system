import {Component, Input} from '@angular/core';
import {User} from '@angular/fire/auth';
import {Champion} from '../../models/firebase.models';

@Component({
  selector: 'app-voting-statistics',
  imports: [],
  templateUrl: './voting-statistics.html',
  styleUrl: './voting-statistics.scss'
})
export class VotingStatistics {
  @Input({required: true}) champions!: Champion[];
  @Input({required: true}) user!: User | null;

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
