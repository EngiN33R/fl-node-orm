import { DataContext } from "../context";
import { Entity } from "../types";

export class DataContextBuilder {
  private readonly ctx = new DataContext();

  static begin() {
    return new DataContextBuilder();
  }

  ref<K extends keyof Entity>(type: K, nickname: string) {
    return this.ctx.findByNickname<K>(type, nickname);
  }

  with(func: (this: DataContextBuilder, ctx: DataContext) => void) {
    func.call(this, this.ctx);
    return this;
  }

  withEntity<K extends keyof Entity>(type: K, model: Omit<Entity[K], "type">) {
    this.ctx.registerModel({ ...model, type } as Entity[K]);
    return this;
  }

  withEntities<K extends keyof Entity>(models: Entity[K][]) {
    models.forEach((model) => this.ctx.registerModel(model));
    return this;
  }

  withString(key: number, value: string) {
    this.ctx.addString(key, value);
    return this;
  }

  withStrings(strings: Map<number, string>) {
    strings.forEach((value, key) => this.ctx.addString(key, value));
    return this;
  }

  withInfocard(key: number, value: string) {
    this.ctx.addInfocard(key, value);
    return this;
  }

  withInfocards(infocards: Map<number, string>) {
    infocards.forEach((value, key) => this.ctx.addInfocard(key, value));
    return this;
  }

  withBinary(handle: string, data?: ArrayBuffer) {
    this.ctx.registerBinary(handle, data);
    return this;
  }

  build() {
    return this.ctx;
  }
}
