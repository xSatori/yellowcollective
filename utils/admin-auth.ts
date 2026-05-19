import type { SignedRequestMethod } from "./signature-auth";

export type AdminAuthPayload = {
  adminAddress?: string;
};

export const getAdminSignedRequestAction = (
  method: SignedRequestMethod | string
) => `admin:${method.toLowerCase()}`;

export const getAdminSessionSignedRequestAction = () => "admin:session";
