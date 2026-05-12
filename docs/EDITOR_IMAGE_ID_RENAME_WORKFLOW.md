# Editor image ID rename workflow

## Purpose

This update adds a controlled image ID rename workflow to the local editor.

Image IDs are not just labels. They are used by:

```text
galleryImages[].id
heroSlides[].imageId
editor hash routes
portfolio rendition filenames
```

Because of that, the normal ID field stays protected. Renaming happens through a dedicated panel that updates references and file paths together.

## New behavior

### New imports

New image imports now default to a title-based ID:

```text
Title: Mountain Mist at Dusk
ID: mountain-mist-at-dusk
```

The import review still lets you manually edit the ID before saving. If the title changes before the ID has been manually edited, the ID updates from the title automatically.

### Existing images

Each image detail page now has an `Image identity` panel.

It shows:

```text
current image ID
suggested title-based ID
future display/thumb/texture/full output paths
Rename ID + Rendition Files button
```

The rename action updates:

```text
src/data/galleryImages.json
src/data/heroSlides.json
public/images/portfolio/display/<id>.webp
public/images/portfolio/thumb/<id>.webp
public/images/portfolio/texture/<id>.webp
public/images/portfolio/full/<id>.webp
```

## Safety

The backend validates before writing and creates a local editor backup before changing JSON.

The file rename uses a copy-first workflow:

```text
copy old rendition files to new ID paths
write updated JSON
remove old rendition files
```

If the target file already exists, the rename is blocked.

## ID rules

IDs must use:

```text
lowercase letters
numbers
hyphens
```

Example:

```text
haycock-winter-boulder
```

Do not use:

```text
spaces
uppercase letters
underscores
special characters
```

## Validation

After applying:

```powershell
npm run build
.\scripts\Validate-PortfolioImageData.ps1
.\scripts\Validate-PortfolioDevBranch.ps1
.\scripts\Run-LocalEditor.ps1
```

Manual test:

```text
1. Open an existing image.
2. Change the title.
3. Click Refresh From Title.
4. Confirm the suggested ID and future paths.
5. Click Rename ID + Rendition Files.
6. Confirm the editor route changes to the new ID.
7. Validate again.
```

## Order of operations

Apply this pack before applying gallery curation control changes, because both touch editor render/collect/controller files.
