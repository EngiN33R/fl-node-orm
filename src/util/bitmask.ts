export class Bitmask<Flags extends string> {
  private readonly enabled = new Set<Flags>();

  constructor(flags: Flags[], zero: Flags | undefined, value: number = 0) {
    if (value === 0) {
      if (zero) {
        this.enabled.add(zero);
      }
    } else {
      for (let i = 0; i < flags.length; i++) {
        const flag = flags[i];
        if (value & (1 << i)) {
          this.enabled.add(flag);
        }
      }
    }
  }

  has(flag: Flags) {
    return this.enabled.has(flag);
  }

  hasAny(...flags: Flags[]) {
    return flags.some((flag) => this.enabled.has(flag));
  }

  hasAll(...flags: Flags[]) {
    return flags.every((flag) => this.enabled.has(flag));
  }

  static define<Flags extends string>(flags: Flags[], zero?: Flags) {
    return (value: number) => new Bitmask(flags, zero, value);
  }

  get [Symbol.toStringTag]() {
    return [...this.enabled].join("|");
  }

  toString() {
    return `${this.constructor.name}{${this[Symbol.toStringTag]}}`;
  }

  toJSON() {
    return [...this.enabled];
  }
}

export type BitmaskFlags<T> = T extends (v: number) => Bitmask<infer K>
  ? Bitmask<K>
  : never;
