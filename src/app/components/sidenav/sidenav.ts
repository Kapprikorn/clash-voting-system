import {Component, inject} from '@angular/core';
import {LoginComponent} from '../login/login';
import {AsyncPipe, DatePipe} from '@angular/common';
import {SessionService} from '../../services/session.service';
import {AdminSection} from '../admin/admin-section/admin-section';

@Component({
  selector: 'app-sidenav',
  imports: [
    LoginComponent,
    AsyncPipe,
    DatePipe,
    AdminSection
  ],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss'
})
export class Sidenav {
  private sessionService = inject(SessionService);

  protected currentSession$ = this.sessionService.currentSession$;
}
