import {Component, inject, Input, OnInit} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import {Champion} from '../../../models/firebase.models';
import {FirebaseService} from '../../../services/http/firebase.service';
import {User} from '@angular/fire/auth';
import {firstValueFrom} from 'rxjs';
import {DatadragonService} from '../../../services/http/datadragon.service';

@Component({
  selector: 'app-vote-details',
  imports: [
    NgOptimizedImage,
  ],
  templateUrl: './vote-details.html',
  styleUrl: './vote-details.scss'
})
export class VoteDetails implements OnInit {
  private firebaseService = inject(FirebaseService);
  private datadragonService = inject(DatadragonService);

  @Input({required: true}) champion!: Champion;
  @Input({required: true}) sessionId!: string;
  @Input({required: true}) user!: User | null;

  protected isVoting = false;
  protected successMessage: string = '';
  protected errorMessage: string = '';
  protected championImageUrl?: string;

  ngOnInit() {
    this.getChampionImageUrl();
  }

  protected hasUserVotedForChampion(): boolean {
    if (!this.user) return false;

    return this.champion.votes?.includes(this.user.uid);
  }

  async vote(championId: string, championName: string) {
    if (this.isVoting || !this.user) {
      if (!this.user) {
        this.errorMessage = 'Please sign in to vote';
      }
      return;
    }

    // Check if user already voted for this vote-details
    if (this.hasUserVotedForChampion()) {
      this.errorMessage = `You have already voted for ${championName}`;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isVoting = true;
    this.errorMessage = '';

    try {
      await firstValueFrom(this.firebaseService.voteForChampion({
        sessionId: this.sessionId,
        championId: championId,
        userId: this.user.uid
      }));

      this.successMessage = `Vote cast for ${championName}!`;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Error voting:', error);
      this.errorMessage = 'Error casting vote. Please try again.';
    } finally {
      this.isVoting = false;
    }
  }

  async unvote(championId: string, championName: string) {
    if (!this.user || !this.hasUserVotedForChampion()) return;

    this.isVoting = true;
    this.errorMessage = '';

    try {
      await firstValueFrom(this.firebaseService.removeVoteForChampion({
        sessionId: this.sessionId,
        championId: championId,
        userId: this.user.uid
      }));

      this.successMessage = `Vote removed for ${championName}!`;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Error removing vote:', error);
      this.errorMessage = 'Error removing vote. Please try again.';
    } finally {
      this.isVoting = false;
    }
  }

  private async getChampionImageUrl(): Promise<void> {
    try {
      this.championImageUrl = await firstValueFrom(
        this.datadragonService.getChampionImageUrlByName(this.champion.name)
      );
    } catch (error) {
      console.error('Error loading champion image:', error);
      this.championImageUrl = undefined;
    }
  }
}
