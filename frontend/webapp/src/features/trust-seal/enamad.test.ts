import { describe, expect, it } from "vitest";

import { enamadUrls, parseEnamadInput, sealForHost } from "./enamad";

describe("parseEnamadInput", () => {
  it("reads the install code the Enamad panel gives", () => {
    const snippet = `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=7764782&Code=XcQgNRMRzN92gDmZbf8t5GMh1mtctW9d'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=7764782&Code=XcQgNRMRzN92gDmZbf8t5GMh1mtctW9d' alt='' style='cursor:pointer' code='XcQgNRMRzN92gDmZbf8t5GMh1mtctW9d'></a>`;
    expect(parseEnamadInput(snippet)).toEqual({ enamadId: "7764782", enamadCode: "XcQgNRMRzN92gDmZbf8t5GMh1mtctW9d" });
  });

  it("reads HTML-escaped snippets, a bare URL, or 'id code'", () => {
    expect(parseEnamadInput("https://trustseal.enamad.ir/?id=123&amp;Code=abcDEF123456")).toEqual({ enamadId: "123", enamadCode: "abcDEF123456" });
    expect(parseEnamadInput("https://trustseal.enamad.ir/logo.aspx?id=123&Code=abcDEF123456")).toEqual({ enamadId: "123", enamadCode: "abcDEF123456" });
    expect(parseEnamadInput("  123  abcDEF123456 ")).toEqual({ enamadId: "123", enamadCode: "abcDEF123456" });
    expect(parseEnamadInput("123,abcDEF123456")).toEqual({ enamadId: "123", enamadCode: "abcDEF123456" });
  });

  it("rejects text without a valid id and code (and never lets markup through)", () => {
    expect(parseEnamadInput("")).toBeNull();
    expect(parseEnamadInput("hello world")).toBeNull();
    expect(parseEnamadInput("https://trustseal.enamad.ir/?id=123")).toBeNull();
    expect(parseEnamadInput("?id=12a&Code=abcDEF123456")).toBeNull();
    expect(parseEnamadInput(`?id=1&Code=abc"><script>`)).toBeNull();
  });
});

describe("sealForHost", () => {
  const seals = [
    { host: "lsevincare.com", enamadId: "1", enamadCode: "codeForCom1" },
    { host: "lsevin.ir", enamadId: "2", enamadCode: "codeForIr22" },
  ];

  it("shows each domain its own seal, www or not", () => {
    expect(sealForHost(seals, "lsevincare.com")?.enamadId).toBe("1");
    expect(sealForHost(seals, "www.lsevin.ir")?.enamadId).toBe("2");
  });

  it("shows nothing on a domain without a seal (never another domain's)", () => {
    expect(sealForHost(seals, "appmain.lsevin.com")).toBeNull();
    expect(sealForHost(seals, "localhost")).toBeNull();
    expect(sealForHost([], "lsevincare.com")).toBeNull();
  });

  it("builds the seal links Enamad expects", () => {
    expect(enamadUrls(seals[0]!)).toEqual({
      href: "https://trustseal.enamad.ir/?id=1&Code=codeForCom1",
      img: "https://trustseal.enamad.ir/logo.aspx?id=1&Code=codeForCom1",
    });
  });
});
