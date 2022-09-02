import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AppService } from '../app.service';

@Component({
  selector: 'app-grid-control',
  templateUrl: './grid-control.component.html',
  styleUrls: ['./grid-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridControlComponent {
  private readonly _appService = inject(AppService);

  generateRandomData(): void {
    this._appService.generateRandomData();
  }
}
