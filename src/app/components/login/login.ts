import { Component, inject, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, User, Unsubscribe } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (user) {
      <div class="logged-in-container">
        <span>Logged in as: {{ user.displayName }}</span>
        @if (isAdmin) {
          <span class="badge bg-warning text-dark ms-2">Admin</span>
        }
        <button (click)="logout()" class="logout-btn ms-2">Logout</button>
      </div>
    } @else {
      <button (click)="signInWithGoogle()" class="btn btn-outline-primary">Sign in with Google</button>
    }
  `
})
export class LoginComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);

  @Output() adminStatusChange = new EventEmitter<boolean>();

  user: User | null = null;
  isAdmin: boolean = false;
  private authSubscription?: Unsubscribe;

  ngOnInit() {
    // Listen to auth state changes
    this.authSubscription = this.auth.onAuthStateChanged((user) => {
      this.user = user;
      this.checkAdminStatus();
    });
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.authSubscription) {
      this.authSubscription();
    }
  }

  private checkAdminStatus() {
    this.isAdmin = this.user?.displayName === "Sjors";
    this.adminStatusChange.emit(this.isAdmin);
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
