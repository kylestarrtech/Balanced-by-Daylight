# Balanced by Daylight
## The "Items/Addons/Offerings" Update

This update contains **a lot** of stuff. So I'm going to give the fair warning that *I may miss some changes*.

As always, if you notice bugs or issues that are not in the Known Issues section, please report them and create an Issue on the [GitHub](https://github.com/kylestarrtech/DBD-Balance-Checker/issues) page or report them in the [Discord Server](https://discord.gg/E6zfpwvCce).

### Added

* Added Offerings to the loadout system
    * Offerings can be selected from the build menu beside the perks. Offerings operate in the balance as a **whitelist**, so while some tournament leagues may want one or two of a specific offering, BBD only checks to see if it's in the whitelist.
    * Feature added by SHADERSOP. Slight modifications by Floliroy.
* Added Items to the loadout system
    * Items are selected from the build menu beside offerings. Similar to offerings, they operate as a **whitelist**, so please be somewhat aware of your tournament league's rules on this.
    * Feature added by SHADERSOP.
* Added Addons to the loadout system
    * Addons are selected from the build menu beside items. Addons are heavily tied to items and have a few conditions:
        * Addons **cannot** be selected if there is no present item.
        * Dragging and dropping items swaps/removes the corresponding addons as well.
        * Changing the item's type wipes the corresponding addons.
        * There cannot be duplicate addons.
    * This system, just as with Offerings and Items, is a **whitelist**. Be aware of your league's rules on duplicate items. Always *assume* only one of each type can be taken if you aren't sure (avoid the penalty, trust me).
    * Feature added by SHADERSOP.
* Added Image Generation
    * You'll notice a new button to "Generate Image". This button tells the server to make an image of your entire loadout and lets you view/save/download it!
    * Images are all 1280x720.
    * This feature is in early stages, and there will be improvements, so feedback is welcome.
    * If you notice a bug with this feature, **please** report it. It's one of the more complex features added and although I tested it extensively, I want to be 100% sure that it's working to top performance.
    * Feature added by SHADERSOP.
* Added an Auto-Save Loadouts button to the settings (disabled by default)
    * This has been a bit of a favourite of mine while developing. Essentially any changes you make to your builds get saved to local storage and the site automatically reloads where you left off beforehand. Very useful in many situations!
    * Can be erased via the "Clear Settings" button.
    * Feature added by Floliroy.
* Added Davy Jones League Balancing
    * Feature added by Floliroy. Updated further by SHADERSOP.
    * Special thanks to Megalos.
* Added L-Tournament Balancing
    * Feature added by Floliroy. Updated further by SHADERSOP.
    * Special thanks to Megalos.
* Added basic functionality for mobile devices.
    * There's still a lot of work to be done in this area. BBD was meant to be a desktop-only tool, but many of our competitive friends are on other devices where they can only access the tool via their phone. These changes from VivianSanchez should prove to be helpful. Any and all feedback on this is appreciated so we know what direction to take this in next!
    * Feature added by VivianSanchez.
* Added a logo!!!
    * We now have a logo for the site!
    * Huge thanks to WheatDraws for generally being the GOAT and designing such a banger logo.
    * Designed by WheatDraws.
* Added a Discord button to the main homepage and the balance checker.
    * I want to incentivize people to join the Discord and provide feedback/communication. To me, this is a great way to do that!
    * Feature added by SHADERSOP.

### Changed
* Reworked the Import/Export system entirely
    * This system was *very* rushed when the website first launched. This was because I wanted to get that feature out very fast while the iron was hot as I felt it was very important. Now that the dust has settled a bit, Floliroy and I thought of different ways to optimize the system and I think his implementation is a significant improvement, and one that will stand the test of time.
    * Change made by Floliroy. Slight modifications by SHADERSOP.
* When a Killer is selected the menu automatically scrolls to them.
    * Change made by Floliroy.
* Website images are ALL in .webp from .png
    * Both myself and Floliroy noticed that the website was a bit slower than we'd like. This could easily be because I'm using a very simple DigitalOcean droplet to host it, but we figured some performance could be squeezed out. As such, to (hopefully) cut on load times, I converted all images used on the site to .webp, which should be significantly more efficient. Feel free to provide feedback on loading times!
    * Change made by SHADERSOP.
* Error icons are now contextual.
    * All error icons are now related to the specific type of error. Each error type has its own unique icon.
    * **Critical Errors** are errors that are not possible to replicate in *Dead by Daylight* (e.g. Duplicate perks and duplicate addons on the same survivor). These errors are highlighted in a red outline now instead of the previous "Exposed" icon.
    * Change made by SHADERSOP.
* Updated **several** styles on the site.
    * Changes made by SHADERSOP and Floliroy.
* Updated format of primary homepage (mainly to fit the Join Discord button).
    * Change made by SHADERSOP.
* Exit button is now replaced by the Balanced by Daylight logo in the balance checker.
    * Change made by SHADERSOP.


### Fixed
* Removed margin on main document body (Floliroy)
* Fixed Drag and Drop functionality to work on Firefox (S1mmyy)
* Fixed a variety of potential crashes related to imports, custom balance, and perks (SHADERSOP).
* Fixed a bug where you could not export if you had a blank perk, offering, item, or set of addons.


### Known Issues
* Favicon does not show up.
* Potential crashes with image generation. If found, please report these.