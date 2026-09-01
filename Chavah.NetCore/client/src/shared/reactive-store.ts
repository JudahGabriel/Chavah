/**
 * A tiny reactive primitives library that replaces the small subset of RxJS
 * (`BehaviorSubject`, `Subject`, and the operators `map`, `where`/`filter`,
 * `skip`, `distinctUntilChanged`) that the original AngularJS services relied on.
 *
 * It is intentionally minimal and synchronous. Subscribers are invoked
 * immediately (and, for a `BehaviorSubject`, receive the current value on
 * subscribe).
 */

export type Subscriber<T> = (value: T) => void;
export type Unsubscribe = () => void;

/**
 * Base observable. Concrete subjects implement {@link subscribe}; operators are
 * expressed in terms of that single method so we never leak `this`-bound
 * closures into a `super()` call.
 */
export abstract class Observable<T> {
  /** Registers a subscriber. Returns a function that removes it. */
  abstract subscribe(subscriber: Subscriber<T>): Unsubscribe;

  /** Projects each emitted value through `projector`. */
  map<R>(projector: (value: T) => R): Observable<R> {
    return new OperatorObservable<R>((emit) =>
      this.subscribe((value) => emit(projector(value))),
    );
  }

  /** Emits only values that satisfy `predicate`. */
  where(predicate: (value: T) => boolean): Observable<T> {
    return new OperatorObservable<T>((emit) =>
      this.subscribe((value) => {
        if (predicate(value)) {
          emit(value);
        }
      }),
    );
  }

  /** Alias for {@link where}, matching the RxJS `filter` name. */
  filter(predicate: (value: T) => boolean): Observable<T> {
    return this.where(predicate);
  }

  /** Skips the first `count` emitted values. */
  skip(count: number): Observable<T> {
    return new OperatorObservable<T>((emit) => {
      let seen = 0;
      return this.subscribe((value) => {
        if (seen++ >= count) {
          emit(value);
        }
      });
    });
  }

  /** Emits a value only when it differs from the previously emitted value. */
  distinctUntilChanged(comparer?: (a: T, b: T) => boolean): Observable<T> {
    const areEqual = comparer ?? ((a: T, b: T) => a === b);
    return new OperatorObservable<T>((emit) => {
      let hasPrevious = false;
      let previous: T;
      return this.subscribe((value) => {
        if (!hasPrevious || !areEqual(previous, value)) {
          hasPrevious = true;
          previous = value;
          emit(value);
        }
      });
    });
  }
}

/** An observable produced by an operator; wires a subscriber to an upstream source. */
class OperatorObservable<T> extends Observable<T> {
  constructor(private readonly onSubscribe: (emit: Subscriber<T>) => Unsubscribe) {
    super();
  }

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    return this.onSubscribe(subscriber);
  }
}

/** A multicast source with no initial value. Late subscribers only see future emissions. */
export class Subject<T> extends Observable<T> {
  protected readonly subscribers = new Set<Subscriber<T>>();

  subscribe(subscriber: Subscriber<T>): Unsubscribe {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /** Emits a new value to all current subscribers. */
  next(value: T): void {
    for (const subscriber of [...this.subscribers]) {
      subscriber(value);
    }
  }

  /** RxJS-style alias for {@link next}. */
  onNext(value: T): void {
    this.next(value);
  }
}

/** A {@link Subject} that remembers its current value and replays it to new subscribers. */
export class BehaviorSubject<T> extends Subject<T> {
  constructor(private value: T) {
    super();
  }

  /** Returns the most recently emitted value. */
  getValue(): T {
    return this.value;
  }

  override next(value: T): void {
    this.value = value;
    super.next(value);
  }

  override subscribe(subscriber: Subscriber<T>): Unsubscribe {
    const unsubscribe = super.subscribe(subscriber);
    subscriber(this.value);
    return unsubscribe;
  }
}

/**
 * A lightweight event emitter for simple fire-and-forget notifications that
 * don't need value replay or operators.
 */
export class Emitter<T> {
  private readonly handlers = new Set<Subscriber<T>>();

  subscribe(handler: Subscriber<T>): Unsubscribe {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  emit(value: T): void {
    for (const handler of [...this.handlers]) {
      handler(value);
    }
  }
}
