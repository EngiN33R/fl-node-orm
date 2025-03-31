export class BiMap<K, V> {
  private map = new Map<K, V>();
  private reverse = new Map<V, K>();

  set(key: K, value: V) {
    this.map.set(key, value);
    this.reverse.set(value, key);
  }

  get(key: K) {
    return this.map.get(key);
  }

  has(key: K) {
    return this.map.has(key);
  }

  getKey(value: V) {
    return this.reverse.get(value);
  }

  hasValue(value: V) {
    return this.reverse.has(value);
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }

  entries() {
    return this.map.entries();
  }

  entriesReverse() {
    return this.reverse.entries();
  }
}

export class BiMapSet<K, V> {
  private map = new Map<K, Set<V>>();
  private reverse = new Map<V, Set<K>>();

  set(key: K, value: V) {
    const set = this.map.get(key) ?? new Set();
    set.add(value);
    this.map.set(key, set);

    const rset = this.reverse.get(value) ?? new Set();
    rset.add(key);
    this.reverse.set(value, rset);
  }

  get(key: K) {
    return this.map.get(key);
  }

  has(key: K) {
    return this.map.has(key);
  }

  hasValue(value: V) {
    return this.reverse.has(value);
  }

  containsForKey(key: K, value: V) {
    return this.map.get(key)?.has(value);
  }

  containsForValue(value: V, key: K) {
    return this.reverse.get(value)?.has(key);
  }

  getReverse(value: V) {
    return this.reverse.get(value);
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.reverse.keys();
  }
}
