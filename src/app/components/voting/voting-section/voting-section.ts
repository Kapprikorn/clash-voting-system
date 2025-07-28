import {Component, inject} from '@angular/core';
import {VoteDetails} from "../vote-details/vote-details";
import {VotingStatistics} from "../voting-statistics/voting-statistics";
import {FirebaseChampion} from '../../../models/firebase.models';
import {SessionService} from '../../../services/session.service';
import {FirebaseService} from '../../../services/http/firebase.service';
import {filter, switchMap} from 'rxjs/operators';

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
    // Wait for sessionId to be available, then fetch champions
    this.sessionService.currentSession$.pipe(
      filter(sessionId => !!sessionId), // Only proceed when sessionId is truthy
      switchMap(sessionId => this.firebaseService.getChampions(sessionId))
    ).subscribe({
      next: value => this.champions = value,
      error: error => console.error('Error fetching champions:', error)
    });
  }
}
