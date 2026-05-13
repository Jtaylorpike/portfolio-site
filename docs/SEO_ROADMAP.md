# SEO Roadmap

## Current status

This site is a Vite static app with hash routing, hosted through GitHub Pages. That means it can still have useful baseline metadata, but route-specific SEO is limited because crawlers primarily receive the same `index.html` shell.

## Baseline updates made

- Updated the page description to better describe the current site.
- Added author and robots metadata.
- Updated Open Graph and Twitter descriptions.
- Replaced a stale logo Open Graph image path with an existing portfolio image path.
- Added a basic JSON-LD `Person` schema for Taylor Pike.

## Future SEO priorities

### 1. Decide the final public URL

Once the final domain is known, add stable canonical URLs and absolute Open Graph image URLs.

### 2. Consider non-hash routes later

Hash routes are easy for GitHub Pages, but they are not ideal for SEO. If SEO becomes a serious priority, consider moving to clean routes with static route generation or a host that supports SPA fallback cleanly.

### 3. Add crawlable content sections

The site should eventually include more crawlable copy around:

- climbing photography
- landscape photography
- commercial/product/brand work
- personal/experimental work
- virtual gallery / interactive portfolio
- location context where relevant

### 4. Add structured image and portfolio data

Future structured data could include:

- `ImageObject` records for selected portfolio images
- `CreativeWork` or `CollectionPage` schema for the portfolio index
- project-level metadata for commercial/client work when that content exists

### 5. Image/social preview pass

Choose a dedicated social-preview image and export it at the correct dimensions rather than relying on an existing portfolio image.

## Important caution

Do not over-optimize copy before the site's actual content structure is settled. The site should still sound like Taylor's portfolio, not like a stock SEO landing page.
