import "server-only";

import { cookies } from "next/headers";

import sql from "@/config/database/db";

import {
  SIGNUP_REFERRAL_COOKIE,
  SIGNUP_REFERRAL_TTL_SECONDS,
} from "./referral-signup.constants";

/**
 * The invite code typed on the sign-up form.
 *
 * Registration itself goes to the identity API, which knows nothing about the
 * referral programme, and the customer row the reward has to hang off does not
 * exist until the phone number is verified. So the code waits here — same
 * httpOnly cookie treatment as the OTP challenge phone, for the same reason: the
 * browser never needs to read it, and it must not ride along in a URL.
 *
 * The TTL covers registration plus the OTP round trip with room for one resend.
 * Deliberately short: an abandoned sign-up must not staple a stranger's code to
 * whoever registers on this browser next.
 */
export const setPendingReferralCode = async (code: string) => {
  const store = await cookies();
  store.set(SIGNUP_REFERRAL_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SIGNUP_REFERRAL_TTL_SECONDS,
  });
};

export const readPendingReferralCode = async (): Promise<string | null> => {
  const store = await cookies();
  return store.get(SIGNUP_REFERRAL_COOKIE)?.value?.trim() || null;
};

export const clearPendingReferralCode = async () => {
  const store = await cookies();
  store.delete(SIGNUP_REFERRAL_COOKIE);
};

function randomCouponSuffix(length: number) {
  // No O/0/I/1 — these codes get read off a screen and typed at checkout.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
}

/**
 * Turn the parked invite code into the referee's welcome discount.
 *
 * Runs once the OTP is accepted, which is the first moment both facts are true:
 * the account is real, and the person typing the code is the person who owns the
 * number. Everything happens in one transaction so a half-written invitation
 * cannot leave a coupon with nothing behind it.
 *
 * Never throws. A sign-in must not fail because a referral code did not resolve.
 */
export async function redeemPendingSignupReferral(args: {
  phoneNumber: string;
  phoneNumberCountryCode: string;
}): Promise<void> {
  const code = await readPendingReferralCode();
  if (!code) return;

  // One shot. Whatever happens below, this code is spent for this browser.
  await clearPendingReferralCode();

  try {
    await sql.begin(async (tx) => {
      // customer.customers.id is the identity user id, so the phone number that
      // just passed OTP identifies the referee outright.
      const [referee] = await tx<{ id: string }[]>`
        select id
        from identity.asp_net_users
        where phone_number = ${args.phoneNumber}
        -- The country code is a tie-breaker, not a filter: the identity service
        -- owns how it stores that field, and the national number is already
        -- unique in practice. Preferring the exact match keeps the rare
        -- cross-country collision correct without failing when the stored
        -- format differs from what libphonenumber hands back.
        order by (phone_number_country_code = ${args.phoneNumberCountryCode}) desc
        limit 1
      `;
      if (!referee) return;

      const [program] = await tx<{ id: string }[]>`
        select id
        from marketing.referral_programs
        where status = 'active'
        order by is_default desc, create_date desc
        limit 1
      `;
      if (!program) return;

      const [referralCode] = await tx<{ customer_id: string }[]>`
        select customer_id
        from marketing.referral_codes
        where lower(code) = lower(${code})
          and program_id = ${program.id}
          and is_active = true
        limit 1
      `;
      // An unknown code is not an error the visitor needs to see at this point —
      // they are already registered. It simply earns nothing.
      if (!referralCode) return;

      // Nobody invites themselves.
      if (referralCode.customer_id === referee.id) return;

      // A second sign-up cannot re-use the reward; one invitation per referee.
      const [existing] = await tx<{ id: string }[]>`
        select id
        from marketing.referral_invitations
        where referee_customer_id = ${referee.id}::uuid
          and program_id = ${program.id}
        limit 1
      `;
      if (existing) return;

      const [invitation] = await tx<{ id: string }[]>`
        insert into marketing.referral_invitations (
          program_id,
          referrer_customer_id,
          referee_customer_id,
          invited_at,
          signed_up_at
        ) values (
          ${program.id},
          ${referralCode.customer_id}::uuid,
          ${referee.id}::uuid,
          now(),
          now()
        )
        returning id
      `;

      // What the admin configured for "someone signed up with my code". No rule
      // means the programme grants nothing at sign-up, which is a valid setup.
      const [rule] = await tx<{
        discount_type: string;
        discount_value: string;
        title: string;
      }[]>`
        select discount_type, discount_value, title
        from marketing.referral_reward_rules
        where program_id = ${program.id}
          -- quoted: trigger is a SQL keyword
          and "trigger" = 'signup'
          and recipient = 'referee'
          and is_active = true
        order by sort_order asc
        limit 1
      `;
      if (!rule) return;

      const [queue] = await tx<{ next_position: number }[]>`
        select coalesce(max(queue_position), 0) + 1 as next_position
        from marketing.user_discount_coupons
        where customer_id = ${referee.id}::uuid
      `;

      await tx`
        insert into marketing.user_discount_coupons (
          program_id,
          customer_id,
          referral_invitation_id,
          code,
          title,
          discount_type,
          discount_value,
          status,
          queue_position,
          issued_at
        ) values (
          ${program.id},
          ${referee.id}::uuid,
          ${invitation.id},
          ${`WELCOME${randomCouponSuffix(6)}`},
          ${rule.title},
          ${rule.discount_type},
          ${rule.discount_value},
          'issued',
          ${queue?.next_position ?? 1},
          now()
        )
      `;
    });
  } catch (error) {
    // The account is created and the visitor is signed in; the reward is the only
    // thing lost, and it is recoverable by hand from the code in the log.
    console.error("Sign-up referral redemption failed", { code, error });
  }
}
