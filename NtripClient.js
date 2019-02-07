import http from 'http';
import EventEmitter from 'events';

export default class NtripClient extends EventEmitter {
    constructor({ host, port, mountpoint, user, password, proxyserver, proxyport, GPGGA, mode = 'NTRIP2' } = {}) {
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
            proxyport,
            GPGGA
            //encoding: 'ascii'
        };

        this.options.headers = {
            'User-Agent': 'NTRIP ExampleClient/2.0',
            Connection: 'close',
            Authorization: `Basic ${Buffer.from(this.options.user + ':' + this.options.password, 'ascii').toString('base64')}`,
            Accept: '*/*'
        };

        if (this.options.mode === 'NTRIP2') {
            this.options.headers['Ntrip-Version'] = 'Ntrip/2.0';
        }

        if (this.options.GPGGA){
            this.options.headers["Ntrip-GGA"] = this.options.GPGGA;
        }
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
        return this.req && this.req.connection && !this.req.aborted;
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

    request = () => {
        return new Promise(async (reslove, reject) => {

            this.req = http.request(this.options);
            this.req.end();

            this.req.once('response', res => {
                console.log("Start request", {req:this.req});
                this.req.setNoDelay(true);

                const { statusCode, headers } = res;
                //res.setEncoding('ascii');
                this.emit('response', { statusCode, headers }, res);

                res.on('data', chunk => {
                    this.emit('data', chunk);
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
        });
    };

    requestEx = () => {
        return new Promise(async (reslove, reject) => {
            this.req = http.request(this.options, res => {
                console.log("Start request", {req:this.req});
                this.req.setNoDelay(true);

                //if (this.options.GPGGA) {
                //    this.req.write('\r\n' + this.options.GPGGA + '\r\n');
                //}

                const { statusCode, headers } = res;
                //res.setEncoding('ascii');
                this.emit('response', { statusCode, headers }, res);

                res.on('data', chunk => {
                    this.emit('data', chunk);
                });

                res.on('end', () => {
                    this.emit('end');
                    reslove();
                });
            });
            if (this.options.GPGGA){
                console.log(this.options.GPGGA)
                this.req.end('\r\n'+ this.options.GPGGA + '\r\n', 'ascii');
            }else{
                this.req.end();
            }
            

            this.req.on('error', async err => {
                await this.abort();
                reject(err);
            });
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
class Gpgga {
    constructor() {
        this.Identifier = '$GPGGA';
        this.time = new Data().toTimeString();
    }

    static gpggaReg = () =>
        /^\$GP(\w{3}),(\d{6}([.]\d+)?),(\d{4}[.]\d+,[NS]),(\d{5}[.]\d+,[WE]),([0-8]),(\d{1,2}),(\d{1,3}[.]\d{1,3})?,([-]?\d+([.]\d+)?)?,M?,([-]?\d+([.]\d+)?)?,M?,(\d+([.]\d+)?)?,(\d{4})?,?([ADENS])?\*([0-9A-F]{2})$/;
}
