import AbstractLogger from "./AbstractLogger";

export default class SimpleConsoleLogger extends AbstractLogger {

    debug(message) {
        this.log('DEBUG', message);
    }

    info(message) {
        this.log('INFO', message);
    }

    error(message) {
        this.log('ERROR', message);
    }

    trace(message) {
        this.log('TRACE', message);
    }

    warn(message) {
        this.log('WARN', message);
    }

    log(level, message) {
        const dateString = (new Date()).toISOString();
        console.log(`${dateString} ${level} ${message}`);
    }

}