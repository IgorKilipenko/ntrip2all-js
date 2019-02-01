class NtripClient {
    constructor(options) {
        console.assert(options.host && options.port && options.mountpoint, 
            "NtripClient {arg: options} error", options);
        this.options = options;
    }

    connect = () => {
        
    }

}