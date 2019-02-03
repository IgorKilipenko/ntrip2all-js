import http from 'http';

export default class NtripClient {
    constructor({ host, port, mountpoint, user, password, proxyserver, proxyport, mode = 'NTRIP2' } = {}) {
        console.assert(host && port && mountpoint, 'NtripClient {arg: options} error', arguments[0]);

        this.req = null;
        this._connect = false;
        this.keepAliveAgent = new http.Agent({ keepAlive: true });

        this.options = {
            agent: this.keepAliveAgent,
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
        return this.req && this.req.finished;
    }

    getInfo = () => {
        return new Promise((reslove, reject) => {
            this.req = http.request(this.options);
            this.req.end();

            this.req.once('response', (res) => {
                const { statusCode, headers } = res;
                this.abort();
                setTimeout(() => {
                    reslove({ statusCode, headers });
                }, 1000);
                
            });

            this.req.on('error', e => {
                this.abort();
                reject(e);
            });

            
        });
    };

    connect = () => {
        return new Promise((reslove, reject) => {
            this.req = http.request(this.options);
            this.req.on('connect', res => {
                console.log('!!!CONNECTED');
                reslove(this);
            });
        });
    };

    request = callback => {
        return new Promise((reslove, reject) => {
            console.log('Start req', this.options);
            this.req = http.request(this.options, res => {
                this.req.setNoDelay(true);
                console.log('Connected');

                const { statusCode, headers } = res;
                //res.setEncoding('ascii');

                console.log({ statusCode, headers });

                res.on('data', chunk => {
                    callback(chunk, res);
                });

                res.on('end', () => {
                    this._connect = false;
                    reslove();
                });
            });

            this.req.on('error', e => {
                this.abort();
                reject(e);
            });

            this.req.end();
        });
    };

    abort = () => {
        if (this.isConnected) {
            this.req.abort();
        }
        this.req = null;
    };
}
