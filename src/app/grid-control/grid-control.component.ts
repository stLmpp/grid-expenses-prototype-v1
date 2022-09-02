import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppService } from '../app.service';

@Component({
  selector: 'app-grid-control',
  templateUrl: './grid-control.component.html',
  styleUrls: ['./grid-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridControlComponent {
  constructor(private readonly appService: AppService) {}

  generateRandomData(): void {
    this.appService.generateRandomData();
  }
}
