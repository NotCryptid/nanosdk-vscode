import { SerialPort } from 'serialport';

/**
 * Client for MicroOS's newline-delimited JSON serial protocol
 * (see MicroOS's src/serial_protocol.ts). One request in flight at a
 * time -- the device's poll loop processes one line per tick, and the
 * protocol has no pipelining.
 */
export class SerialProtocolClient {
    private port: SerialPort | null = null;
    private recvBuffer = '';
    private nextId = 1;
    private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();

    constructor(private readonly path: string, private readonly baudRate = 115200) {}

    async connect(): Promise<void> {
        if (this.port && this.port.isOpen) return;
        await new Promise<void>((resolve, reject) => {
            this.port = new SerialPort({ path: this.path, baudRate: this.baudRate }, (err) => {
                if (err) reject(new Error(`Failed to open serial port '${this.path}': ${err.message}`));
                else resolve();
            });
            this.port!.on('data', (chunk: Buffer) => this.onData(chunk));
            this.port!.on('error', (err) => {
                for (const { reject } of this.pending.values()) reject(err);
                this.pending.clear();
            });
        });
    }

    async disconnect(): Promise<void> {
        if (this.port && this.port.isOpen) {
            await new Promise<void>((resolve) => this.port!.close(() => resolve()));
        }
        this.port = null;
    }

    private onData(chunk: Buffer) {
        this.recvBuffer += chunk.toString('utf8');
        let newlineAt = this.recvBuffer.indexOf('\n');
        while (newlineAt >= 0) {
            const line = this.recvBuffer.slice(0, newlineAt).trim();
            this.recvBuffer = this.recvBuffer.slice(newlineAt + 1);
            if (line) this.onLine(line);
            newlineAt = this.recvBuffer.indexOf('\n');
        }
    }

    private onLine(line: string) {
        let msg: any;
        try {
            msg = JSON.parse(line);
        } catch {
            return;
        }
        const id = msg.id;
        const waiter = this.pending.get(id);
        if (!waiter) return;
        this.pending.delete(id);
        clearTimeout(waiter.timer);
        if (msg.ok) waiter.resolve(msg);
        else waiter.reject(new Error(msg.error || 'device returned an error'));
    }

    /** Sends {cmd, ...params} and resolves with the device's response fields. */
    async request(cmd: string, params: Record<string, any> = {}, timeoutMs = 5000): Promise<any> {
        if (!this.port || !this.port.isOpen) {
            throw new Error('not connected to MicroOS device');
        }
        const id = this.nextId++;
        const payload = JSON.stringify({ id, cmd, ...params }) + '\n';
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`timed out waiting for response to '${cmd}'`));
            }, timeoutMs);
            this.pending.set(id, { resolve, reject, timer });
            this.port!.write(payload, (err) => {
                if (err) {
                    clearTimeout(timer);
                    this.pending.delete(id);
                    reject(err);
                }
            });
        });
    }
}
