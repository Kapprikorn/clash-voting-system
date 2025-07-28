import {Component, inject} from '@angular/core';
import {LoginComponent} from '../login/login';
import {AsyncPipe, DatePipe} from '@angular/common';
import {SessionService} from '../../services/session.service';

@Component({
  selector: 'app-sidenav',
  imports: [
    LoginComponent,
    AsyncPipe,
    DatePipe
  ],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss'
})
export class Sidenav {
  private sessionService = inject(SessionService);

  protected currentSession$ = this.sessionService.currentSession$;
}
