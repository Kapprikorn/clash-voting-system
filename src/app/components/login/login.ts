import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Auth, GoogleAuthProvider, signInWithPopup, signOut, Unsubscribe, User} from '@angular/fire/auth';
import {CommonModule} from '@angular/common';
import {FirebaseService} from '../../services/http/firebase.service';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firebaseService = inject(FirebaseService);

  user: User | null = null;
  isAdmin$: Observable<boolean> = this.firebaseService.isAdmin();
  private authSubscription?: Unsubscribe;

  ngOnInit() {
    // Listen to auth state changes
    this.authSubscription = this.auth.onAuthStateChanged((user) => {
      this.user = user;
    });
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.authSubscription) {
      this.authSubscription();
    }
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        console.log('Signed in as', result.user.displayName);
      })
      .catch((error) => {
        console.error('Login error:', error);
      });
  }

  logout() {
    signOut(this.auth)
      .then(() => {
        console.log('Logged out successfully');
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  }
}
