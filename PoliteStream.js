import stream from "stream";

export default class PoliteStream extends stream.Readable {
  constructor(size, options) {
    super(options);
    this.size = size;
    this.sentCount = 0;
  }

  _read(n) {
    while (this.sentCount < this.size) {
      this.sentCount++;
      if (!this.push("a")) return;
    }
    this.push(null);
  }
}
