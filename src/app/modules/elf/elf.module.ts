import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository } from '../../state/cutter.store';



@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [AppRepository]
})
export class ElfModule { }
