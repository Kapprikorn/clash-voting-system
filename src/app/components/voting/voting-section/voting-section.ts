import {Component, inject} from '@angular/core';
import {VoteDetails} from "../vote-details/vote-details";
import {VotingStatistics} from "../voting-statistics/voting-statistics";
import {FirebaseChampion} from '../../../models/firebase.models';
import {SessionService} from '../../../services/session.service';
import {FirebaseService} from '../../../services/http/firebase.service';
import {filter, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-voting-section',
  imports: [
    VoteDetails,
    VotingStatistics,
    AsyncPipe
  ],
  templateUrl: './voting-section.html',
  styleUrl: './voting-section.scss'
})
export class VotingSection {
  private sessionService = inject(SessionService);
  private firebaseService = inject(FirebaseService);

  champions$: Observable<FirebaseChampion[]> = this.sessionService.currentSession$.pipe(
    filter(sessionId => !!sessionId),
    switchMap(sessionId => this.firebaseService.getChampions(sessionId))
  );
}
