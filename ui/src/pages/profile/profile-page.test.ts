/* @vitest-environment jsdom */

import { ContextProvider } from "@lit/context";
import { LitElement } from "lit";
import { afterEach, beforeEach, expect, it } from "vitest";
import type { RouteId } from "../../app-route-paths.ts";
import {
  applicationContext,
  type ApplicationContext,
  type ApplicationGatewaySnapshot,
} from "../../app/context.ts";
import { i18n, t } from "../../i18n/index.ts";
import { ProfilePage } from "./profile-page.ts";

const PROVIDER_ELEMENT_NAME = "test-profile-page-context-provider";
const PROFILE_PAGE_ELEMENT_NAME = "test-openclaw-profile-page";

class ProfilePageContextProvider extends LitElement {
  private readonly contextProvider = new ContextProvider(this, {
    context: applicationContext,
  });

  setContext(context: ApplicationContext<RouteId>) {
    this.contextProvider.setValue(context);
  }
}

if (!customElements.get(PROVIDER_ELEMENT_NAME)) {
  customElements.define(PROVIDER_ELEMENT_NAME, ProfilePageContextProvider);
}

// Keep the mounted page and i18n manager in one module graph even when an
// earlier non-isolated test registered the production tag before a module reset.
class TestProfilePage extends ProfilePage {}

if (!customElements.get(PROFILE_PAGE_ELEMENT_NAME)) {
  customElements.define(PROFILE_PAGE_ELEMENT_NAME, TestProfilePage);
}

function createContext(): ApplicationContext<RouteId> {
  const snapshot: ApplicationGatewaySnapshot = {
    client: null,
    connected: false,
    reconnecting: false,
    hello: null,
    assistantAgentId: "main",
    sessionKey: "agent:main:main",
    lastError: null,
    lastErrorCode: null,
  };
  const subscribe = () => () => undefined;
  return {
    gateway: { snapshot, subscribe },
    agents: { subscribe },
    agentIdentity: { subscribe },
  } as unknown as ApplicationContext<RouteId>;
}

beforeEach(async () => {
  await i18n.setLocale("en");
});

afterEach(async () => {
  document.body.replaceChildren();
  await i18n.setLocale("en");
});

it("refreshes translated copy when the locale changes while mounted", async () => {
  const provider = document.createElement(PROVIDER_ELEMENT_NAME) as ProfilePageContextProvider;
  const page = document.createElement(PROFILE_PAGE_ELEMENT_NAME) as ProfilePage;
  provider.setContext(createContext());
  provider.append(page);
  document.body.append(provider);
  await page.updateComplete;

  const englishNote = page.querySelector(".profile-note")?.textContent?.trim();

  await i18n.setLocale("de");
  await page.updateComplete;

  const translatedNote = page.querySelector(".profile-note")?.textContent?.trim();
  expect(translatedNote).toBe(t("profilePage.offline"));
  expect(translatedNote).not.toBe(englishNote);
});
