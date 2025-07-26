import {Component, Input} from '@angular/core';
import {VoteDetails} from "../vote-details/vote-details";
import {VotingStatistics} from "../voting-statistics/voting-statistics";
import {FirebaseChampion} from '../../../models/firebase.models';
import {User} from '@angular/fire/auth';

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
  @Input({required: true}) champions!: FirebaseChampion[];
  @Input({required: true}) user!: User | null;
  @Input({required: true}) sessionId!: string;

}
