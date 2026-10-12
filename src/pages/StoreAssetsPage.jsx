import React from "react";
import ScreenHeader from "@/components/ScreenHeader";
import ReleasePackCard from "@/components/storeAssets/ReleasePackCard";
import StoreAssetsSection from "@/components/storeAssets/StoreAssetsSection";
import IconAssets from "@/components/storeAssets/IconAssets";
import ScreenshotAssets from "@/components/storeAssets/ScreenshotAssets";
import ListingCopy from "@/components/storeAssets/ListingCopy";
import ConnectForms from "@/components/storeAssets/ConnectForms";
import ReleaseChecklist from "@/components/storeAssets/ReleaseChecklist";
import { APP_VERSION } from "@/lib/appInfo";

/**
 * The team's App Store release page: every asset, every word of listing copy and
 * every Connect answer the submission needs, each one downloadable on its own or
 * as a single pack.
 */
export default function StoreAssetsPage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen w-full">
      <ScreenHeader title="Store assets" subtitle={`Levli v${APP_VERSION} · Apple App Store release pack`} />

      <div className="max-w-lg mx-auto pt-4 pb-12">
        <ReleasePackCard appVersion={APP_VERSION} />

        <StoreAssetsSection
          eyebrow="Required images"
          title="App icon"
          hint="One file, used by the Xcode asset catalog and shown by App Store Connect from the build."
        >
          <IconAssets />
        </StoreAssetsSection>

        <StoreAssetsSection
          eyebrow="Required images"
          title="Screenshots"
          hint="Capture the screen, upload it in order. Apple scales the smaller iPhone sizes from the 6.9-inch set."
        >
          <ScreenshotAssets />
        </StoreAssetsSection>

        <StoreAssetsSection
          eyebrow="Text and links"
          title="Listing text and links"
          hint="Copy each field straight into App Store Connect. The character count beside it is Apple's own limit."
        >
          <ListingCopy />
          <p className="mt-3 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-400 dark:border-white/[0.08] dark:text-gray-500">
            Levli's own support screens sit behind the app's sign-in, so the Support URL has to be a page that opens without
            an account. Check https://levli.app/support in a signed-out browser before submitting.
          </p>
        </StoreAssetsSection>

        <StoreAssetsSection
          eyebrow="App Store Connect"
          title="The forms"
          hint="What to answer in each part of the submission. Anything marked for the team is a private detail Apple needs."
        >
          <ConnectForms />
        </StoreAssetsSection>

        <StoreAssetsSection
          eyebrow="Before you submit"
          title="Release checklist"
          hint="Ticks are kept on this device, so the list can be worked through over a few days."
        >
          <ReleaseChecklist />
        </StoreAssetsSection>
      </div>
    </div>
  );
}