import {Component, inject} from '@angular/core';
import {LcuService} from '../../services/localhost/lcu.service';
import {AsyncPipe, JsonPipe} from '@angular/common';
import {catchError, map, of, shareReplay, switchMap} from 'rxjs';

@Component({
  selector: 'app-local-client',
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './local-client.html',
  styleUrl: './local-client.scss'
})
export class LocalClient {
  private readonly lcuService = inject(LcuService);

  // First: get the current player's bracket ID
  readonly bracketId$ = this.lcuService.getClashPlayerBracketId().pipe(
    map(res => res.bracket_id),
    shareReplay(1),
    catchError(err => {
      this.errorMessage = 'Failed to fetch player bracket ID';
      console.error(this.errorMessage, err);
      return of(null);
    })
  );

  // Then: fetch the bracket details using the bracket ID
  readonly bracket$ = this.bracketId$.pipe(
    switchMap(id => id ? this.lcuService.getClashBracket(id) : of(null)),
    shareReplay(1),
    catchError(err => {
      this.errorMessage = 'Failed to fetch bracket details';
      console.error(this.errorMessage, err);
      return of(null);
    })
  );

  // Also: fetch the teams for that bracket
  readonly teams$ = this.bracketId$.pipe(
    switchMap(id => id ? this.lcuService.getClashBracketTeamsById(id) : of(null)),
    shareReplay(1),
    catchError(err => {
      this.errorMessage = 'Failed to fetch teams for this bracket';
      console.error(this.errorMessage, err);
      return of(null);
    })
  );

  errorMessage: string | null = null;
}
