import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema
} from "@/modules/addresses/schemas/address.schema.js";
import type { AddressController } from "@/modules/addresses/controllers/address.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateAddressRouterDeps = {
  controller: AddressController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createAddressRouters = (deps: CreateAddressRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Admin router (empty — addresses are user-scoped only) ──
  const adminRouter = Router();

  // ── Public router (authenticated user, own addresses) ──────
  const publicRouter = Router();

  publicRouter.get(
    "/addresses",
    authenticate,
    asyncHandler(deps.controller.list)
  );

  publicRouter.get(
    "/addresses/:id",
    authenticate,
    validateRequest({ params: addressIdParamSchema }),
    asyncHandler(deps.controller.getById)
  );

  publicRouter.post(
    "/addresses",
    authenticate,
    validateRequest({ body: createAddressSchema }),
    asyncHandler(deps.controller.create)
  );

  publicRouter.patch(
    "/addresses/:id",
    authenticate,
    validateRequest({ params: addressIdParamSchema, body: updateAddressSchema }),
    asyncHandler(deps.controller.update)
  );

  publicRouter.delete(
    "/addresses/:id",
    authenticate,
    validateRequest({ params: addressIdParamSchema }),
    asyncHandler(deps.controller.softDelete)
  );

  publicRouter.post(
    "/addresses/:id/default",
    authenticate,
    validateRequest({ params: addressIdParamSchema }),
    asyncHandler(deps.controller.setDefault)
  );

  return { adminRouter, publicRouter };
};
