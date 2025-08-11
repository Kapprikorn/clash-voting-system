import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {FirebaseChampion} from '../../../models/firebase.models';
import {FirebaseService} from '../../../services/http/firebase.service';
import {Subscription} from 'rxjs';
import {DatadragonService} from '../../../services/http/datadragon.service';
import {SessionService} from '../../../services/session.service';
import {User} from '@angular/fire/auth';

@Component({
  selector: 'app-vote-details',
  imports: [
    NgOptimizedImage,
    CommonModule
  ],
  templateUrl: './vote-details.html',
  styleUrl: './vote-details.scss'
})
export class VoteDetails implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private datadragonService = inject(DatadragonService);
  private sessionService = inject(SessionService);
  private subscriptions = new Subscription();

  @Input({required: true}) champion!: FirebaseChampion;

  protected currentUser: User | null = null;
  protected isVoting = false;
  protected successMessage: string = '';
  protected errorMessage: string = '';
  protected championImageUrl?: string;

  ngOnInit() {
    this.getChampionImageUrl();

    // Subscribe to user changes
    this.subscriptions.add(
      this.firebaseService.getCurrentUser().subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  protected hasUserVotedForChampion(): boolean {
    if (!this.currentUser) return false;

    return this.champion.votes?.includes(this.currentUser.uid) || false;
  }

  vote(championId: string, championName: string) {
    if (this.isVoting || !this.currentUser) {
      if (!this.currentUser) {
        this.errorMessage = 'Please sign in to vote';
      }
      return;
    }

    // Check if user already voted for this champion
    if (this.hasUserVotedForChampion()) {
      this.errorMessage = `You have already voted for ${championName}`;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.isVoting = true;
    this.errorMessage = '';

    this.firebaseService.voteForChampion({
      sessionId: this.sessionService.getCurrentSessionId(),
      championId: championId,
      userId: this.currentUser.uid
    }).subscribe({
      next: () => {
        this.successMessage = `Vote cast for ${championName}!`;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error voting:', error);
        this.errorMessage = 'Error casting vote. Please try again.';
      },
      complete: () => {
        this.isVoting = false;
      }
    });
  }

  unvote(championId: string, championName: string) {
    if (!this.currentUser || !this.hasUserVotedForChampion()) return;

    this.isVoting = true;
    this.errorMessage = '';

    this.firebaseService.removeVoteForChampion({
      sessionId: this.sessionService.getCurrentSessionId(),
      championId: championId,
      userId: this.currentUser.uid
    }).subscribe({
      next: () => {
        this.successMessage = `Vote removed for ${championName}!`;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error removing vote:', error);
        this.errorMessage = 'Error removing vote. Please try again.';
      },
      complete: () => {
        this.isVoting = false;
      }
    });
  }

  private getChampionImageUrl(): void {
    this.datadragonService.getChampionImageUrlByName(this.champion.name).subscribe({
      next: (imageUrl) => {
        this.championImageUrl = imageUrl;
      },
      error: (error) => {
        console.error('Error loading champion image:', error);
        this.championImageUrl = undefined;
      }
    });
  }

  protected getVoteFillGradient(voteCount: number): string {
    // Calculate fill percentage (20% per vote, max 100%)
    const fillPercentage = Math.min(voteCount * 20, 100);

    // Create a gradient that fills from left to right
    return `linear-gradient(to right, #28a745 0%, #28a745 ${fillPercentage}%, transparent ${fillPercentage}%, transparent 100%)`;
  }

}
