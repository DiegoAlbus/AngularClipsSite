import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[app-event-blocker]'
})
export class EvenBlockerDirective {

  @HostListener('drop', ['$event']) // User releases the mouse or escape key
  @HostListener('dragover', ['$event'])
  public handleEvent(event: Event){
    event.preventDefault();
    // event.stopPropagation();
  }

}
