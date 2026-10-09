# Titan X: website

A static one-page website (HTML, CSS and JavaScript) built on the Titan X Truss identity.
No build step: upload the folder as it is to any static host (Vercel, Netlify, cPanel).

## Files

- `index.html`: the whole page, with the logo inlined as an SVG sprite at the top of `<body>`
- `assets/css/style.css`: styles and colour tokens (Ink, Carbon, Steel, Silver, Cobalt)
- `assets/js/hero.js`: the hero scene, wireframe towers that build floor by floor
- `assets/js/main.js`: intro, cursor, scroll effects, marquee, cards, form
- `assets/img/favicon.svg`: browser tab icon

## Motion

- **Intro**: the Truss mark assembles (beam, then the two braces), the wordmark rises, and the curtain lifts. Click to skip.
- **Hero**: towers build floor by floor with blue cross-bracing. The camera follows the pointer, hovering the main tower lights the floor under the cursor, and a scan line sweeps up every few seconds.
- **Marquee**: speeds up and changes direction with your scrolling.
- **Statement**: words light up as you scroll.
- **Divisions**: the panel on the left redraws its line art for each division as you scroll.
- **Process**: the rail fills and each stage lights up as you scroll.
- **Cards**: spotlight that follows the cursor, with a slight 3D tilt.
- **Footer**: a light sweeps across the giant wordmark and follows your cursor.
- **Buttons**: magnetic on hover.

Visitors who turn off animations in their system settings get a still, fully readable page.

## Before launch

- **Contact details**: replace the email `hello@titanxgroup.com`, the phone `+000 000 000 0000` and "Add your office address" in `index.html` (contact section and footer).
- **Enquiry form**: it checks the fields and shows a confirmation but doesn't send anything yet. Connect it to a form service (for example Formspree or Basin) in `assets/js/main.js`.
- **Social preview**: add an `og:image` once you have a share image, and an `og:url` once the domain is live.
