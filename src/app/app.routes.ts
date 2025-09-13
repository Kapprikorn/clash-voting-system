import {Routes} from '@angular/router';
import {VotingComponent} from './pages/voting/voting';
import {VotingHistory} from './pages/voting-history/voting-history';
import {LocalClient} from './pages/local-client/local-client';

export const routes: Routes = [
  {path: '', component: VotingComponent},
  {path: 'voting-history', component: VotingHistory},
  {path: 'lcu', component: LocalClient}
];
