import http from 'http';
import EventEmitter from 'events';

export default class NtripClient extends EventEmitter {
    constructor({ host, port, mountpoint, user, password, proxyserver, proxyport, mode = 'NTRIP2' } = {}) {
        super();
        console.assert(host && port && mountpoint, 'NtripClient {arg: options} error', arguments[0]);

        this.req = null;
        this._connect = false;
        this.agent = new http.Agent({ keepAlive: false });

        this.options = {
            agent: this.agent,
            method: 'GET',
            headers: {},
            host,
            port,
            mountpoint,
            path: `/${mountpoint}`,
            mode,
            user,
            password,
            proxyserver,
            proxyport
        };

        this.options.headers = {
            'User-Agent': 'NTRIP ExampleClient/2.0',
            Connection: 'close',
            Authorization: `Basic ${Buffer.from(this.options.user + ':' + this.options.password, 'ascii').toString('base64')}`
        };

        if (this.options.mode === 'NTRIP2') {
            this.options.headers['Ntrip-Version'] = 'Ntrip/2.0';
        }

        console.assert(this.options.headers.Authorization === 'Basic c2JyNTAzNzo5NDAxNzI=', 'Password error encoding', this.options.headers.Authorization);
    }

    get host() {
        return this.options.host;
    }

    get port() {
        return this.options.port;
    }

    get mountpoint() {
        return this.options.mountpoint;
    }

    get isConnected() {
        return this.req;
    }

    getInfo = () => {
        return new Promise(async (reslove, reject) => {
            this.req = http.request(this.options);
            this.req.end();

            this.req.on('error', async err => {
                await this.abort();
                reject(err);
            });

            this.req.once('response', async res => {
                const { statusCode, headers } = res;
                console.log(this.req);
                await this.abort();
                reslove({ statusCode, headers });
            });


        });
    };

    request = callback => {
        return new Promise(async (reslove, reject) => {
            this.req = http.request(this.options, res => {
                this.req.setNoDelay(true);

                const { statusCode, headers } = res;
                //res.setEncoding('ascii');
                this.emit('request', {statusCode, headers})

                res.on('data', chunk => {
                    this.emit('data', chunk);
                    //callback(chunk);
                });

                res.on('end', () => {
                    this.emit('end');
                    reslove();
                });
            });

            this.req.on('error', async err => {
                await this.abort();
                reject(err);
            });

            this.req.end();
        });
    };

    abort = (timeout = 1000) => {
        return new Promise((reslove, reject) => {
            if (this.isConnected) {
                this.req.socket.destroy();
                this.req.abort();
                setTimeout(() => {
                    this.req = null;
                    this.emit('abort', true);
                    reslove(true);
                }, timeout);
            } else {
                this.req = null;
                this.emit('abort', false);
                reslove(false);
            }
        });
    };
}
