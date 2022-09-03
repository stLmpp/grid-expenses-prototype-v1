import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import pt from '@angular/common/locales/pt';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GridControlComponent } from './grid-control/grid-control.component';

registerLocaleData(pt, 'pt-BR');

@NgModule({
  declarations: [AppComponent, GridControlComponent],
  imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule, HttpClientModule],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
