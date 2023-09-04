// Reference: https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html
// Used github copilot for some type inference
import { RequestHandler, Router } from 'express';
import winston = require('winston');
import middleware = require('../middleware');
import controllerHelpers = require('../controllers/helpers');

// The anys are typed because there is no way of determining the exact types of the arguments
// since other files are not translated to TS yet
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Helpers {
    setupPageRoute: (
        router: Router,
        name: string,
        middleware: any,
        middlewares: any[],
        controller: ((req: any, res: any, next: any) => Promise<any> | void)) => void;
    setupAdminPageRoute: (
        router: Router, name: string, middleware: any, middlewares: any[],
        controller: (req: any, res: any, next: any) => (Promise<any> | void)) => void;
    setupApiRoute: (router: Router, verb: string, name: string, middlewares: any[],
        controller: (req: any, res: any, next: any) => (Promise<any>)) => void;
    tryRoute: (controller: (req: any, res: any, next: any) => void | Promise<any>,
        handler?: (err: any, res: any) => Promise<any>) => (req: any, res: any, next: any) => Promise<any> | void;
}
const helpers = {} as Helpers;

// router, name, middleware(deprecated), middlewares(optional), controller
helpers.setupPageRoute = function (...args) {
    const [router, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let middlewares: any[] = args.length > 3 ? args[args.length - 2] : [] as any[];

    const controller: ((req: any, res: any, next: any) => Promise<any> | void) =
    args[args.length - 1] as ((req: any, res: any, next: any) => Promise<any> | void);

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

    const buildHeader: RequestHandler = middleware.buildHeader as RequestHandler;

    router.get(
        name,
        middleware.busyCheck,
        middlewares,
        buildHeader,
        helpers.tryRoute(controller) as (req: any, res: any, next: any) => void,
    );

    router.get(`/api${name}`, middlewares, helpers.tryRoute(controller) as (req: any, res: any, next: any) => void);
};

// router, name, middleware(deprecated), middlewares(optional), controller
helpers.setupAdminPageRoute = function (...args) {
    const [router, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const middlewares: any[] = args.length > 3 ? args[args.length - 2] : [] as any[];
    const controller: (req: any, res: any, next: any) => Promise<any> | void =
    args[args.length - 1] as (req: any, res: any, next: any) => Promise<any> | void;
    if (args.length === 5) {
        winston.warn(`[helpers.setupAdminPageRoute(${name})] passing \`middleware\` as the third param is deprecated, it can now be safely removed`);
    }

    router.get(
        name,
        // The next line calls middleware which is in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        middleware.admin.buildHeader,
        middlewares,
        helpers.tryRoute(controller) as (req: any, res: any, next: any) => void
    );
    router.get(`/api${name}`, middlewares, helpers.tryRoute(controller) as (req: any, res: any, next: any) => void);
};

// router, verb, name, middlewares(optional), controller
helpers.setupApiRoute = function (...args) {
    const [router, verb, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let middlewares: any[] = args.length > 4 ? args[3] : [] as any[];
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

    // The next line calls router[verb] which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    router[verb](name, middlewares, helpers.tryRoute(controller, async (err, res) => {
        try {
            await controllerHelpers.formatApiResponse(400, res, err);
        } catch (err) {
            // Reference: https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
            let message: string;
            if (err instanceof Error) message = err.message;
            else message = String(err);
            return winston.error(`[helpers.setupApiRoute(${name})] ${message}`);
        }
    }) as (req: any, res: any, next: any) => void);
};

helpers.tryRoute = function (controller, handler?) {
    // `handler` is optional
    if (controller && controller.constructor && controller.constructor.name === 'AsyncFunction') {
        const controllerPromise: (req: any, res: any, next: any) => Promise<any> =
        controller as (req: any, res: any, next: any) => Promise<any>;
        return async function (req, res, next) {
            try {
                await controllerPromise(req, res, next);
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
