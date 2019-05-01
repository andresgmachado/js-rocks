import { Effect, EffectInfo } from './effect';
import { connectNodes, clamp, mapToMinMax } from '../../utils';
import { BehaviorSubject } from 'rxjs';

export interface CabinetInfo extends EffectInfo {
  params: {
    bass: number;
    mid: number;
    treble: number;
    volume: number;
    active: boolean;
  };
}

export class Cabinet extends Effect {
  private makeUpGain: GainNode;
  private convolver: ConvolverNode;
  private bassSub$ = new BehaviorSubject<number>(0);
  private midSub$ = new BehaviorSubject<number>(0);
  private trebleSub$ = new BehaviorSubject<number>(0);
  private bassNode: BiquadFilterNode;
  private midNode: BiquadFilterNode;
  private trebleNode: BiquadFilterNode;

  private defaults: Partial<CabinetInfo['params']> = {
    bass: 0.5,
    mid: 0.5,
    treble: 0.5
  };

  bass$ = this.bassSub$.asObservable();
  mid$ = this.midSub$.asObservable();
  treble$ = this.trebleSub$.asObservable();

  set bass(value: number) {
    const bass = clamp(0, 1, value);
    this.bassSub$.next(bass);
    const bassGain = mapToMinMax(bass, -40, 40);
    this.bassNode.gain.setValueAtTime(bassGain, 0);
  }

  set mid(value: number) {
    const mid = clamp(0, 1, value);
    this.midSub$.next(mid);
    const midGain = mapToMinMax(mid, -40, 40);
    this.midNode.gain.setValueAtTime(midGain, 0);
  }

  set treble(value: number) {
    const treble = clamp(0, 1, value);
    this.trebleSub$.next(treble);
    const trebleGain = mapToMinMax(treble, -40, 40);
    this.trebleNode.gain.setValueAtTime(trebleGain, 0);
  }

  constructor(
    context: AudioContext,
    convolver: ConvolverNode,
    gain: number,
    model: string
  ) {
    super(context, model);

    this.convolver = convolver;

    this.makeUpGain = context.createGain();
    this.makeUpGain.gain.setTargetAtTime(gain, context.currentTime, 0.01);

    this.bassNode = context.createBiquadFilter();
    this.bassNode.type = 'lowshelf';
    this.bassNode.frequency.value = 500;

    this.midNode = context.createBiquadFilter();
    this.midNode.type = 'peaking';
    this.midNode.Q.value = Math.SQRT1_2;
    this.midNode.frequency.value = 1500;

    this.trebleNode = context.createBiquadFilter();
    this.trebleNode.type = 'highshelf';
    this.trebleNode.Q.value = Math.SQRT1_2;
    this.trebleNode.frequency.value = 3000;

    this.processor = [
      this.convolver,
      this.makeUpGain,
      this.bassNode,
      this.midNode,
      this.trebleNode
    ];

    Object.keys(this.defaults).forEach(option => {
      this[option] = this.defaults[option];
    });

    connectNodes(this.processor);

    this.input.connect(this.output);
  }

  updateConvolver(convolver: ConvolverNode, gain: number, model: string) {
    this.model = model;
    this.convolver.disconnect();
    this.convolver.buffer = null;
    this.convolver = null;
    this.convolver = convolver;
    this.processor[0] = this.convolver;
    this.makeUpGain.gain.setTargetAtTime(gain, this.convolver.context.currentTime, 0.01);

    this.toggleBypass();

    this.convolver.connect(this.makeUpGain);

    this.toggleBypass();
  }

  dispose() {
    super.dispose();

    this.convolver = null;
    this.makeUpGain = null;
    this.bassNode = null;
    this.midNode = null;
    this.trebleNode = null;
    this.bassSub$.complete();
    this.midSub$.complete();
    this.trebleSub$.complete();
  }

  takeSnapshot(): CabinetInfo {
    const snapshot = super.takeSnapshot() as CabinetInfo;

    snapshot.params = {
      ...snapshot.params,
      bass: this.bassSub$.value,
      mid: this.midSub$.value,
      treble: this.trebleSub$.value
    };

    return snapshot;
  }
}
