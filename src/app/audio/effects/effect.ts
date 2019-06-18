import { BehaviorSubject } from 'rxjs';
import { EffectNode } from '@audio/node.interface';

export interface EffectInfo {
  model: string;
  params: {
    active: boolean;
  };
}

export abstract class Effect {
  private activeSub$ = new BehaviorSubject<boolean>(false);
  protected isBypassEnabled = true;
  protected processor: AudioNode[] = [];
  protected sampleRate: number;
  input: GainNode;
  output: GainNode;
  active$ = this.activeSub$.asObservable();

  static connectInOrder(effects: Required<EffectNode>[]) {
    for (let i = effects.length - 1; i > 0; --i) {
      effects[i - 1].connect(effects[i]);
    }
  }

  static disconnectInOrder(effects: Required<EffectNode>[]) {
    for (const effect of effects) {
      effect.disconnect();
    }
  }

  set active(value: boolean) {
    if (this.isBypassEnabled !== !value) {
      this.toggleBypass();
    }
  }

  constructor(context: AudioContext, public model: string) {
    this.sampleRate = context.sampleRate;
    this.input = new GainNode(context);
    this.output = new GainNode(context);
    this.activeSub$.next(false);
  }

  toggleBypass() {
    this.isBypassEnabled = !this.isBypassEnabled;

    if (this.isBypassEnabled) {
      if (this.processor.length) {
        this.processor[this.processor.length - 1].disconnect();
      }

      this.input.disconnect();
      this.input.connect(this.output);
    } else {
      this.input.disconnect();
      this.input.connect(this.processor[0]);
      this.processor[this.processor.length - 1].connect(this.output);
    }

    this.activeSub$.next(!this.isBypassEnabled);
  }

  connect(effect: Effect) {
    this.output.connect(effect.input);
  }

  disconnect() {
    this.output.disconnect();
  }

  dispose() {
    this.disconnect();

    for (const node of this.processor) {
      node.disconnect();
    }

    this.input.disconnect();

    this.processor = [];
    this.input = null;
    this.output = null;
    this.isBypassEnabled = false;
    this.activeSub$.complete();
  }

  takeSnapshot(): EffectInfo {
    return {
      model: this.model,
      params: {
        active: this.activeSub$.value
      }
    };
  }
}
