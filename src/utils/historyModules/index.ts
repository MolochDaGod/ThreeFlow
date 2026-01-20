import { Command } from './command';

export default class HistoryModules {
  private undos: Command[] = [];
  private redos: Command[] = [];
  private maxHistorySize: number = 50;
  private lastCommandTime: number = 0;
  private readonly COMMAND_MERGE_INTERVAL = 500; // 合并命令的时间间隔(ms)

  constructor() {
    this.clear();
  }

  // 执行命令
  execute(command: Command) {
    const lastCommand = this.undos[this.undos.length - 1];
    const timeDifference = Date.now() - this.lastCommandTime;
    // 检查是否可以合并命令（例如：连续的拖拽操作）
    if (
      lastCommand?.updatable &&
      command.updatable &&
      lastCommand.type === command.type &&
      timeDifference < this.COMMAND_MERGE_INTERVAL
    ) {
      lastCommand.update?.(command);
    } else {
      // 添加新命令
      this.undos.push(command);

      // 限制历史记录大小
      if (this.undos.length > this.maxHistorySize) {
        this.undos.shift();
      }
    }

    // 清空重做列表
    this.redos = [];

    // 执行命令
    command.execute();
    this.lastCommandTime = Date.now();
  }

  // 撤销操作
  undo(steps: number = 1) {
    for (let i = 0; i < steps && this.undos.length > 0; i++) {
      const command = this.undos.pop();
      if (command) {
        command.undo();
        this.redos.push(command);
      }
    }
  }

  // 重做操作
  redo(steps: number = 1) {
    for (let i = 0; i < steps && this.redos.length > 0; i++) {
      const command = this.redos.pop();
      if (command) {
        command.execute();
        this.undos.push(command);
      }
    }
  }

  // 清空历史记录
  clear() {
    this.undos = [];
    this.redos = [];
    this.lastCommandTime = 0;
  }

  // 获取可撤销的步数
  getUndoSteps(): number {
    return this.undos.length;
  }

  // 获取可重做的步数
  getRedoSteps(): number {
    return this.redos.length;
  }
}
