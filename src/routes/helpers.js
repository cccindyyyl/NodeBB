"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const winston = require("winston");
const middleware = require("../middleware");
const controllerHelpers = require("../controllers/helpers");
const helpers = {};
// router, name, middleware(deprecated), middlewares(optional), controller
helpers.setupPageRoute = function (...args) {
    const [router, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let middlewares = args.length > 3 ? args[args.length - 2] : [];
    const controller = args[args.length - 1];
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
    const buildHeader = middleware.buildHeader;
    router.get(name, middleware.busyCheck, middlewares, buildHeader, helpers.tryRoute(controller));
    router.get(`/api${name}`, middlewares, helpers.tryRoute(controller));
};
// router, name, middleware(deprecated), middlewares(optional), controller
helpers.setupAdminPageRoute = function (...args) {
    const [router, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const middlewares = args.length > 3 ? args[args.length - 2] : [];
    const controller = args[args.length - 1];
    if (args.length === 5) {
        winston.warn(`[helpers.setupAdminPageRoute(${name})] passing \`middleware\` as the third param is deprecated, it can now be safely removed`);
    }
    router.get(name, 
    // The next line calls middleware which is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    middleware.admin.buildHeader, middlewares, helpers.tryRoute(controller));
    router.get(`/api${name}`, middlewares, helpers.tryRoute(controller));
};
// router, verb, name, middlewares(optional), controller
helpers.setupApiRoute = function (...args) {
    const [router, verb, name] = args;
    // The next line calls middlewares which is an array consisting of middleware attributes,
    // and middleware is in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let middlewares = args.length > 4 ? args[3] : [];
    const controller = args[args.length - 1];
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
    router[verb](name, middlewares, helpers.tryRoute(controller, (err, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield controllerHelpers.formatApiResponse(400, res, err);
        }
        catch (err) {
            // Reference: https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
            let message;
            if (err instanceof Error)
                message = err.message;
            else
                message = String(err);
            return winston.error(`[helpers.setupApiRoute(${name})] ${message}`);
        }
    })));
};
helpers.tryRoute = function (controller, handler) {
    // `handler` is optional
    if (controller && controller.constructor && controller.constructor.name === 'AsyncFunction') {
        const controllerPromise = controller;
        return function (req, res, next) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield controllerPromise(req, res, next);
                }
                catch (err) {
                    if (handler) {
                        return handler(err, res);
                    }
                    // The next line calls next, an argument of controller
                    // which is in a module that has not been updated to TS yet
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    next(err);
                }
            });
        };
    }
    // const controllerFunction: (req: any, res: any, next: any) => void =
    // controller as (req: any, res: any, next: any) => void;
    return controller;
};
module.exports = helpers;
