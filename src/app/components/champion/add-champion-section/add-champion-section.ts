import {Component, inject, Input} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {User} from '@angular/fire/auth';
import {FirebaseService} from '../../../services/http/firebase.service';

@Component({
  selector: 'app-add-champion-section',
    imports: [
        FormsModule,
        ReactiveFormsModule
    ],
  templateUrl: './add-champion-section.html',
  styleUrl: './add-champion-section.scss'
})
export class AddChampionSection {
  @Input({required: true}) isAdmin!: boolean;
  @Input({required: true}) user!: User | null;
  @Input({required: true}) isLoading!: boolean;
  @Input({required: true}) sessionId!: string;
  @Input({required: true}) availableChampions: any[] = [];

  private firebaseService = inject(FirebaseService);

  championName: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  async addChampion() {
    if (!this.championName.trim()) {
      this.errorMessage = 'Please enter a vote-details name';
      return;
    }

    if (!this.user) {
      this.errorMessage = 'Please sign in to add champions';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.firebaseService.createChampion(this.sessionId, {
      name: this.championName.trim()
    }).subscribe({
      next: () => {
        this.successMessage = `Champion "${this.championName}" added successfully!`;
        this.championName = '';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error adding champion:', error);
        this.errorMessage = 'Error adding champion. Please try again.';
        this.isLoading = false;
      }
    });

  }
}
