export abstract class Command {
  type: string;
  name: string;
  updatable: boolean = false;

  constructor(name: string) {
    this.type = this.constructor.name;
    this.name = name;
  }

  abstract execute(): void;
  abstract undo(): void;

  // optional: merge rapid identical ops
  update?(command: Command): void;
}
