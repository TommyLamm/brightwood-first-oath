import type { CommandDraft, GameCommand } from '../contracts/commands.js';

/** The application is the only source of monotonically increasing command sequence numbers. */
export class AppCommandQueue {
  private nextSeq = 1;
  private pending: GameCommand[] = [];

  enqueue(draft: CommandDraft): GameCommand {
    if (!Number.isSafeInteger(this.nextSeq)) throw new RangeError('Command sequence is no longer a safe integer.');
    const command: GameCommand = { ...draft, seq: this.nextSeq };
    this.nextSeq += 1;
    this.pending.push(command);
    return command;
  }

  drain(): GameCommand[] {
    const commands = this.pending;
    this.pending = [];
    return commands;
  }

  discard(types: ReadonlySet<CommandDraft['type']>): void {
    if (types.size === 0) return;
    this.pending = this.pending.filter(({ type }) => !types.has(type));
  }

  get length(): number {
    return this.pending.length;
  }
}
