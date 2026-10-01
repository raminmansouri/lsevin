"use server";

import { getSession } from "@/lib/auth/session";
import { reserveSpecialPackage } from "../server/checkout";

export async function reservePackageAction(input: { packageId: string; paymentMethod: string }) {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) return { ok: false as const, error: "Please sign in first." };

    try {
        const result = await reserveSpecialPackage({
            packageId: input.packageId,
            userId,
            paymentMethod: input.paymentMethod,
        });
        return { ok: true as const, ...result };
    } catch (error) {
        return {
            ok: false as const,
            error: error instanceof Error ? error.message : "Could not reserve this package.",
        };
    }
}