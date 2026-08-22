import { Command } from './command';

export default class HistoryModules {
  private undos: Command[] = [];
  private redos: Command[] = [];
  private maxHistorySize: number = 50;
  private lastCommandTime: number = 0;
  private readonly COMMAND_MERGE_INTERVAL = 500; // command merge window(ms)

  constructor() {
    this.clear();
  }

  // run command
  execute(command: Command) {
    const lastCommand = this.undos[this.undos.length - 1];
    const timeDifference = Date.now() - this.lastCommandTime;
    // merge consecutive commands (e.g. drag)
    if (
      lastCommand?.updatable &&
      command.updatable &&
      lastCommand.type === command.type &&
      timeDifference < this.COMMAND_MERGE_INTERVAL
    ) {
      lastCommand.update?.(command);
    } else {
      // push a new command
      this.undos.push(command);

      // cap history size
      if (this.undos.length > this.maxHistorySize) {
        this.undos.shift();
      }
    }

    // clearRedolist
    this.redos = [];

    // run command
    command.execute();
    this.lastCommandTime = Date.now();
  }

  // Undoop
  undo(steps: number = 1) {
    for (let i = 0; i < steps && this.undos.length > 0; i++) {
      const command = this.undos.pop();
      if (command) {
        command.undo();
        this.redos.push(command);
      }
    }
  }

  // Redoop
  redo(steps: number = 1) {
    for (let i = 0; i < steps && this.redos.length > 0; i++) {
      const command = this.redos.pop();
      if (command) {
        command.execute();
        this.undos.push(command);
      }
    }
  }

  // clear history
  clear() {
    this.undos = [];
    this.redos = [];
    this.lastCommandTime = 0;
  }

  // countUndosteps
  getUndoSteps(): number {
    return this.undos.length;
  }

  // countRedosteps
  getRedoSteps(): number {
    return this.redos.length;
  }
}
