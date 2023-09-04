// Reference: https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html
// Used github copilot for some type inference
import winston = require('winston');
import middleware = require('../middleware');
import controllerHelpers = require('../controllers/helpers');

interface Helpers {
    setupPageRoute: (
        router: any,
        name: string,
        middleware: any,
        middlewares: any[],
        controller: (req: any, res: any, next: any) => Promise<any> | void) => void;
    setupAdminPageRoute: (
        router: any, name: string, middleware: any, middlewares: any[],
        controller: (req: any, res: any, next: any) => Promise<any> | void) => void;
    setupApiRoute: (router: any, verb: string, name: string, middlewares: any[], controller: any) => void;
    tryRoute: (controller: (req: any, res: any, next: any) => void | Promise<any>,
     handler?: (err: any, res: any) => void) => (req: any, res: any, next: any) => void | Promise<any>;
}
const helpers = {} as Helpers;

// router, name, middleware(deprecated), middlewares(optional), controller
helpers.setupPageRoute = function (...args) {
    // The next line calls router which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [router, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let middlewares: any[] = args.length > 3 ? args[args.length - 2] : [] as any[];

    const controller: (req: any, res: any, next: any) => Promise<any> =
    args[args.length - 1] as (req: any, res: any, next: any) => Promise<any>;

    if (args.length === 5) {
        winston.warn(`[helpers.setupPageRoute(${name})] passing \`middleware\`as the third param is deprecated, it can now be safely removed`);
    }

    middlewares = [
        middleware.authenticateRequest,
        middleware.maintenanceMode,
        middleware.registrationComplete,
        middleware.pluginHooks,
        // The next line calls middlewares which is an array consisting of middleware attributes,
        // and middleware is in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...middlewares,
        middleware.pageView,
    ];

    // The next line calls router.get which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    router.get(
        name,
        middleware.busyCheck,
        middlewares,
        middleware.buildHeader,
        helpers.tryRoute(controller)
    );
    // The next line calls router.get which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    router.get(`/api${name}`, middlewares, helpers.tryRoute(controller));
};

// router, name, middleware(deprecated), middlewares(optional), controller
helpers.setupAdminPageRoute = function (...args) {
    // The next line calls router which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [router, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const middlewares = args.length > 3 ? args[args.length - 2] : [];
    const controller: (req: any, res: any, next: any) => Promise<any> =
    args[args.length - 1] as (req: any, res: any, next: any) => Promise<any>;
    if (args.length === 5) {
        winston.warn(`[helpers.setupAdminPageRoute(${name})] passing \`middleware\` as the third param is deprecated, it can now be safely removed`);
    }
    // The next line calls router.get which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    router.get(name, middleware.admin.buildHeader, middlewares, helpers.tryRoute(controller));
    // The next line calls router.get which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    router.get(`/api${name}`, middlewares, helpers.tryRoute(controller));
};

// router, verb, name, middlewares(optional), controller
helpers.setupApiRoute = function (...args) {
    // The next line calls router which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [router, verb, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let middlewares = args.length > 4 ? args[args.length - 2] : [];
    const controller: (req: any, res: any, next: any) => Promise<any> =
    args[args.length - 1] as (req: any, res: any, next: any) => Promise<any>;

    middlewares = [
        middleware.authenticateRequest,
        middleware.maintenanceMode,
        middleware.registrationComplete,
        middleware.pluginHooks,
        // The next line calls middlewares which is an array consisting of middleware attributes,
        // and middleware is in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ...middlewares,
    ];

    // The next line calls router which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    router[verb](name, middlewares, helpers.tryRoute(controller, (err, res) => {
        // The next line calls controllerHelpers.formatApiResponse
        // which is in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        controllerHelpers.formatApiResponse(400, res, err);
    }));
};

helpers.tryRoute = function (controller, handler?) {
    // `handler` is optional
    if (controller && controller.constructor && controller.constructor.name === 'AsyncFunction') {
        return async function (req, res, next) {
            try {
                await controller(req, res, next);
            } catch (err) {
                if (handler) {
                    return handler(err, res);
                }
                // The next line calls next, an argument of controller
                // which is in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                next(err);
            }
        };
    }
    return controller;
};

export = helpers;
