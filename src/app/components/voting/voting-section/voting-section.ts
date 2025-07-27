import {Component, inject} from '@angular/core';
import {VoteDetails} from "../vote-details/vote-details";
import {VotingStatistics} from "../voting-statistics/voting-statistics";
import {FirebaseChampion} from '../../../models/firebase.models';
import {SessionService} from '../../../services/session.service';
import {FirebaseService} from '../../../services/http/firebase.service';

@Component({
  selector: 'app-voting-section',
  imports: [
    VoteDetails,
    VotingStatistics
  ],
  templateUrl: './voting-section.html',
  styleUrl: './voting-section.scss'
})
export class VotingSection {
  private sessionService = inject(SessionService);
  private firebaseService = inject(FirebaseService);

  champions: FirebaseChampion[] = [];

  constructor() {
    this.firebaseService.getChampions(this.sessionService.getCurrentSessionId()).subscribe({
      next: value => this.champions = value,
    });
  }
}
