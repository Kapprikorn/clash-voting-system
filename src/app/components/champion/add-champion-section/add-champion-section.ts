import {Component, inject, Input} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FirebaseService} from '../../../services/http/firebase.service';
import {combineLatest, map} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {SessionService} from '../../../services/session.service';

@Component({
  selector: 'app-add-champion-section',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe
  ],
  templateUrl: './add-champion-section.html',
  styleUrl: './add-champion-section.scss'
})
export class AddChampionSection {
  @Input({required: true}) isLoading!: boolean;
  @Input({required: true}) availableChampions: any[] = [];

  private firebaseService = inject(FirebaseService);
  private sessionService = inject(SessionService);

  protected championName: string = '';
  protected successMessage: string = '';
  protected errorMessage: string = '';
  protected sessionId = this.sessionService.getCurrentSessionId();

  // Combined observables for template usage
  protected user$ = this.firebaseService.getCurrentUser();
  protected isAdmin$ = this.firebaseService.isAdmin();

  // Check if user can add champions (is logged in and is admin)
  canAddChampion$ = combineLatest([
    this.user$,
    this.isAdmin$
  ]).pipe(
    map(([user, isAdmin]) => !!user && isAdmin)
  );

  addChampion() {
    if (!this.championName.trim()) {
      this.errorMessage = 'Please enter a champion name';
      this.successMessage = '';
      return;
    }

    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    this.firebaseService.createChampion(this.sessionId, {
      name: this.championName.trim()
    }).subscribe({
      next: () => {
        this.successMessage = `Champion "${this.championName}" added successfully!`;
        this.championName = '';
      },
      error: (error) => {
        console.error('Error adding champion:', error);
        this.errorMessage = 'Error adding champion. Please try again.';
      }
    });
  }
}
