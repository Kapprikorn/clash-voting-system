import {Component, inject} from '@angular/core';
import {VoteDetails} from "../vote-details/vote-details";
import {VotingStatistics} from "../voting-statistics/voting-statistics";
import {SessionService} from '../../../services/session.service';
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

  champions$ = this.sessionService.champions$;
}
