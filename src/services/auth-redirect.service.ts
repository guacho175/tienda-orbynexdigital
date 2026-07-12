import { accountConfig } from "@/config/account.config";
import { getAdminAccess } from "./admin-access.service";

export async function getPostAuthRedirect(userId: string) {
  const isAdmin = await getAdminAccess(userId).catch(() => false);
  return isAdmin ? accountConfig.routes.admin : accountConfig.routes.account;
}
