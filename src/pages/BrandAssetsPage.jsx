import React from "react";
import { ArrowUpRight } from "lucide-react";
import LevliLogo from "@/components/LevliLogo";
import SectionNav from "@/components/brand/SectionNav";
import AssetSection from "@/components/brand/AssetSection";
import NameSection from "@/components/brand/NameSection";
import IconSection from "@/components/brand/IconSection";
import ColourSection from "@/components/brand/ColourSection";
import TypeSection from "@/components/brand/TypeSection";
import ScreenshotGallery from "@/components/brand/ScreenshotGallery";
import ListingCopySection from "@/components/brand/ListingCopySection";
import ChecklistSection from "@/components/brand/ChecklistSection";
import { BRAND } from "@/lib/storeAssets";

/**
 * The team's brand and store assets page.
 *
 * It is kept to the App Store release: the icon Apple needs, the eight
 * screenshots at the size Apple asks for, and the copy and answers that go into
 * App Store Connect. Everything here is the shipping artwork, not a redraw of it.
 */
export default function BrandAssetsPage() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-cardline">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <LevliLogo size={26} />
            <span className="font-heading text-[17px] font-semibold tracking-tight">Levli</span>
            <span className="text-sm text-muted-foreground">· Brand &amp; store assets</span>
          </div>
          <a
            href={BRAND.siteUrl}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            Open Levli <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        <div className="pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            App Store release
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Brand &amp; store assets
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Everything needed for the iOS submission: the app icon, the eight screenshots at Apple's required
            size, the listing copy, and the answers App Store Connect asks for. The icon and the store copy are
            downloaded or copied from here; the screenshots are drawn by this page at full size.
          </p>
        </div>

        <SectionNav />

        <div className="space-y-10 pt-8">
          <AssetSection
            id="name"
            title="Name"
            blurb="Levli, written the one way. The store name carries the category; the wordmark on the icon does not."
          >
            <NameSection />
          </AssetSection>

          <AssetSection
            id="icon"
            title="App icon"
            blurb="One mark, drawn flat so iOS can mask it itself. The 1024 file is the one that goes to App Store Connect."
          >
            <IconSection />
          </AssetSection>

          <AssetSection
            id="colours"
            title="Colours"
            blurb="The palette the app is actually built from, so anything made for the store sits beside it without a seam."
          >
            <ColourSection />
          </AssetSection>

          <AssetSection
            id="type"
            title="Type"
            blurb="One system sans throughout. Nothing is loaded and nothing has to be licensed."
          >
            <TypeSection />
          </AssetSection>

          <AssetSection
            id="screenshots"
            title="App Store screenshots"
            blurb="Eight screens at 1290 × 2796. Download each one from under its preview."
          >
            <ScreenshotGallery />
          </AssetSection>

          <AssetSection
            id="listing"
            title="Store listing copy"
            blurb="Paste straight into App Store Connect, within each field's character limit."
          >
            <ListingCopySection />
          </AssetSection>

          <AssetSection
            id="checklist"
            title="Submission checklist"
            blurb="What App Store Connect asks for, and the answer to give it."
          >
            <ChecklistSection />
          </AssetSection>
        </div>

        <footer className="mt-12 border-t border-cardline pt-6 text-xs text-muted-foreground">
          <p>
            Levli is a personal logbook. It does not provide medical advice, diagnosis or treatment — keep that
            line in anything written for the store.
          </p>
        </footer>
      </main>
    </div>
  );
}