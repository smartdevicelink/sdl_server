const UUID = require("uuid");
const GET = require("lodash.get");

// extend the properties and functionality of the Express.js "res" variable
// use via: app.use(response.extendExpress);
exports.extendExpress = function(req, res, next){
    res.parcel = new Parcel(req, res);
    next();
}

// make the Parcel class retrievable by the module
exports.parcel = function(){
    return Parcel;
}

class Parcel {
    constructor(req, res, init = {}){
        this.start_ts = new Date();
        this.finish_ts = null;
        this.req = req || null;
        this.res = res || null;
        this.ip = GET(req, "ip", null);
        this.path = GET(req, "path", null);
        this.url = GET(req, "originalUrl", null);
        this.method = GET(req, "method", null);
        this.query = GET(req, "query", {});
        this.params = GET(req, "params", {});
        this.status = init.status || 500;
        this.message = init.message || null;
        this.data = init.data || {};
        this.id = init.id || UUID.v4();
        return this;
    }

    setStatus(status){
        this.status = status;
        return this;
    }

    setMessage(message){
        this.message = message;
        return this;
    }

    setData(data){
        this.data = data;
        return this;
    }

    getJSON(){
        return {
            "meta": {
                "request_id": this.id,
                "code": this.status,
                "message": this.message
            },
            "data": this.data // contains either success information or error information depending on the response code
        };
    }

    // method to write the response to the client
    deliver(){
        var response_ts = new Date();
        if(this.res && this.res.app.locals.log) this.res.app.locals.log.info(JSON.stringify(this.getJSON()));

        // send response to client
        this.res
            .status(this.status)
            .json(this.getJSON());
    }
}
