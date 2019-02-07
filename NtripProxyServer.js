import NtripClient from './NtripClient';

class NtripProxyServer {
    constructor(){
        this.options = {
            host: 'localhost',
            port: 7045,
        }
    }

    start = (ntripClient) => {
        console.assert(ntripClient, "Client error", {ntripClient});

        ntripClient.request()

    }
}