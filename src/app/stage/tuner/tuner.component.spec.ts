import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TunerComponent } from './tuner.component';
import { BitMaskPipe } from '@shared/pipes/bit-mask.pipe';

xdescribe('TunerComponent', () => {
  let component: TunerComponent;
  let fixture: ComponentFixture<TunerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TunerComponent, BitMaskPipe]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TunerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
