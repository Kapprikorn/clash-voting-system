import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SessionService} from '../../../services/session.service';
import {FirebaseService} from '../../../services/http/firebase.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-admin-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-section.html',
  styleUrl: './admin-section.scss'
})
export class AdminSection {
  private sessionService = inject(SessionService);
  private firebaseService = inject(FirebaseService);

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isAdmin$: Observable<boolean> = this.firebaseService.isAdmin();

  protected async clearAllChampions() {
    if (!confirm('This will start a new voting session. All current votes will be archived. Continue?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const newSessionId = await this.sessionService.createNewSession();
      this.successMessage = `New voting session created: ${newSessionId}`;
    } catch (error) {
      console.error('Error creating new session:', error);
      this.errorMessage = 'Error starting new session. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
