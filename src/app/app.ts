import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Sidenav} from './components/sidenav/sidenav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidenav],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('VotingSystem');

}
