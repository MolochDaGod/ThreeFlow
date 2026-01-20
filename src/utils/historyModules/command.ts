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

  // 可选：用于合并快速连续的相同操作
  update?(command: Command): void;
}
