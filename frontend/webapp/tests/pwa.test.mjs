import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MutationCache,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";

import {
  openProfile,
  PROFILE_TTL,
  sealProfile,
} from "../public/pwa/profile-crypto.js";
import { catalogDataLocale } from "../src/lib/pwa/data-locale.ts";
import {
  assertMutationConnection,
  OfflineMutationError,
  offlineMutationOptions,
} from "../src/lib/pwa/mutation-connection.ts";
import { canSavePublicPage } from "../src/lib/pwa/public-snapshot.ts";
import { confirmsSessionChange } from "../src/lib/pwa/session-snapshot.ts";

test("only public landing, provider, staff and service paths may be saved", () => {
  for (const path of [
    "/fa",
    "/en/",
    "/fa/n/app/mobile/home",
    "/en/n/app/mobile/providers",
    "/fa/n/app/mobile/provider/abc-123",
    "/en/n/app/mobile/specialist/abc",
    "/de/n/app/mobile/service/abc",
    "/tr/service-providers/abc",
    "/en/type/abc",
  ])
    assert.equal(canSavePublicPage(path), true, path);
  for (const path of [
    "/",
    "/fa/profile",
    "/en/n/app/mobile/profile",
    "/fa/n/app/mobile/profile/my-results",
    "/en/n/app/mobile/bookings",
    "/fa/n/app/mobile/shop/checkout",
    "/en/admin",
    "/financial",
    "/en/n/app/mobile/provider/abc/checkout",
    "/fa/sign-in",
    "/en/provider-portal",
    "/en/api/auth/session",
    "/xx/n/app/mobile/home",
  ])
    assert.equal(canSavePublicPage(path), false, path);
});

test("offline catalogue requests use the database's regional translation keys", () => {
  assert.equal(catalogDataLocale("fa"), "fa-IR");
  assert.equal(catalogDataLocale("en"), "en-US");
  assert.equal(catalogDataLocale("ar"), "ar-SA");
  assert.equal(catalogDataLocale("zh-CN"), "zh-CN");
});

test("profile persistence is encrypted and restricted to a field projection", async () => {
  const record = await sealProfile(
    {
      name: "Test Person",
      email: "test@example.invalid",
      accessToken: "never-store-token",
      medicalRecord: "never-store-medical",
    },
    "correct horse battery",
    "account-one"
  );
  const serialized = JSON.stringify(record);
  for (const secret of [
    "Test Person",
    "test@example.invalid",
    "never-store-token",
    "never-store-medical",
    "correct horse battery",
  ])
    assert.equal(serialized.includes(secret), false);
  const profile = await openProfile(record, "correct horse battery");
  assert.deepEqual(Object.keys(profile).sort(), ["email", "name", "savedAt"]);
  assert.equal(profile.name, "Test Person");
  assert.equal(profile.email, "test@example.invalid");
});

test("wrong passphrases, swapped accounts and modified ciphertext fail closed", async () => {
  const record = await sealProfile(
    { name: "Person", email: "test@example.invalid" },
    "correct horse battery",
    "account-one"
  );
  await assert.rejects(() => openProfile(record, "incorrect passphrase"));
  await assert.rejects(() =>
    openProfile({ ...record, owner: "account-two" }, "correct horse battery")
  );
  await assert.rejects(() =>
    openProfile(
      { ...record, ciphertext: "AAAA" + record.ciphertext.slice(4) },
      "correct horse battery"
    )
  );
});

test("weak passphrases and expired profiles cannot be used", async () => {
  await assert.rejects(() =>
    sealProfile({ name: "Person", email: "" }, "123456", "account-one")
  );
  const record = await sealProfile(
    { name: "Person", email: "" },
    "correct horse battery",
    "account-one"
  );
  await assert.rejects(
    () =>
      openProfile(
        { ...record, savedAt: Date.now() - PROFILE_TTL - 1000 },
        "correct horse battery"
      ),
    /expired/
  );
  // Changing the expiry metadata cannot extend the encrypted payload's lifetime.
  await assert.rejects(
    () =>
      openProfile(
        { ...record, savedAt: Date.now() + 100000 },
        "correct horse battery"
      ),
    /Invalid/
  );
});

test("session infrastructure failures do not masquerade as sign-out", () => {
  for (const failure of [
    undefined,
    false,
    "",
    [],
    { error: "InfrastructureError" },
    { user: null },
    { user: { id: "" } },
  ])
    assert.equal(confirmsSessionChange(failure, "account-one"), false);
  assert.equal(
    confirmsSessionChange({ user: { id: "account-one" } }, "account-one"),
    false
  );
  assert.equal(
    confirmsSessionChange({ user: { id: "account-two" } }, "account-one"),
    true
  );
  assert.equal(confirmsSessionChange(null, "account-one"), true);
  assert.equal(confirmsSessionChange({}, "account-one"), true);
});

test("offline writes reject immediately, have no optimistic side effects and never replay on reconnection", async () => {
  let connected = false;
  let writes = 0;
  let optimisticUpdates = 0;
  const client = new QueryClient({
    mutationCache: new MutationCache({
      onMutate: () => assertMutationConnection(connected),
    }),
    defaultOptions: { mutations: offlineMutationOptions },
  });
  client.mount();
  onlineManager.setOnline(false);
  try {
    const mutation = client.getMutationCache().build(client, {
      mutationFn: async () => ++writes,
      onMutate: () => {
        optimisticUpdates += 1;
      },
    });
    await assert.rejects(() => mutation.execute(), OfflineMutationError);
    assert.equal(mutation.state.status, "error");
    assert.equal(writes, 0);
    assert.equal(optimisticUpdates, 0);
    connected = true;
    onlineManager.setOnline(true);
    await client.resumePausedMutations();
    assert.equal(writes, 0);
    const retryByUser = client
      .getMutationCache()
      .build(client, { mutationFn: async () => ++writes });
    await retryByUser.execute();
    assert.equal(writes, 1);
  } finally {
    onlineManager.setOnline(true);
    client.unmount();
    client.clear();
  }
});
