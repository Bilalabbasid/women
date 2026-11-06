# Prompt 3: Amazon Product Placement

Nov 6, 2026 · @umer

## Start here

Export this as Markdown and paste it into Claude Code or Gemini inside the site's codebase. It's self-contained, and everything below is addressed to the AI.

**Before you paste it:** the Replens link uses a different Amazon tracking ID (`blackxpace05-20`) from the other eight (`buynow01c3-20`). If both IDs belong to your account, it works, but sales are split across two reports. The cleaner fix is to create one tracking ID for this site in Amazon Associates and regenerate all nine links with it. Also add the new site's domain to your Associates account's website list.

## Your task

This is an existing, already-built menopause and perimenopause website for women, focused on evidence-based answers. Add the nine Amazon affiliate products below to it. Put each one on the pages where it genuinely helps the reader, and write or upgrade those articles so women arrive for a real answer and find the product as a natural next step.

Work with what is already in the codebase. Reuse its existing components, content format, URL pattern, design system, disclaimers and affiliate handling wherever they exist. Don't rebuild working features, and don't delete anything without logging why.

**Order of work**

1. **Map the site first.** Before changing anything, find and write down in `AFFILIATE_PLACEMENT_NOTES.md`:
   - The framework, and where articles live (Markdown, MDX, a CMS or a database).
   - The existing articles on each topic in the next two sections, with their URLs.
   - Any existing product, affiliate or recommendation component, and any product data file.
   - Existing disclosure, disclaimer, privacy and legal pages, plus the footer.
   - How links, internal linking, sitemap and structured data are generated.
2. **Add the product data.** If the site already has a product data file or component, add the nine products there. If it doesn't, create one central data file and one reusable product component, so links live in one place and never in article text.
3. **Upgrade and write articles.** Upgrade existing articles first. Create a new one only where no existing page covers that question.
4. **Apply the compliance rules** in the Amazon and FTC section to the product component and site-wide.
5. **Test and report** as described in the last section.

## The nine products

Use each product's full Amazon URL below as the link. Each one is the destination of the owner's short link, and linking straight to amazon.com avoids an extra third-party redirect. Copy every URL exactly, and don't add, remove or change any part of it.

```csv
id,product,asin,short_link,amazon_url
replens-moisturiser,Replens Long-Lasting Vaginal Moisturizer (14 count with reusable applicator),B000P9WSMY,https://link.amazon/B0f6pePTZ,https://www.amazon.com/Replens-Long-Lasting-Feminine-Moisturizer-applicator/dp/B000P9WSMY?th=1&linkCode=sl2&tag=blackxpace05-20&linkId=b0817dfa389acbe181d96d17ae24be33&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-64c8a100e02f9c77&btn_type=ss&btn_ref=srctok-64c8a100e02f9c77
revaree-ha,Bonafide Revaree 5 mg Hyaluronic Acid vaginal inserts (1 month),B07GX9NQ65,https://link.amazon/B0ggFj3kh,https://www.amazon.com/Bonafide-Revaree-Hyaluronic-Non-Hormonal-Paraben-Free/dp/B07GX9NQ65?th=1&linkCode=sl2&tag=buynow01c3-20&linkId=911b6f25e4507aac00b0b1bce8269ed4&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-3ec1ac293b3608d8&btn_type=ss&btn_ref=srctok-3ec1ac293b3608d8
uberlube,Uberlube Premium Silicone Lubricant,B00KDHS8PO,https://link.amazon/B06PmUIks,https://www.amazon.com/Uberlube-Silicone-Base-Lube-Lubrification/dp/B00KDHS8PO?th=1&linkCode=sl2&tag=buynow01c3-20&linkId=1670a8c98352df8bc3c0e3340d951a94&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-1397cbe99c079161&btn_type=ss&btn_ref=srctok-1397cbe99c079161
elvie-trainer,Elvie Pelvic Floor Trainer (app-controlled),B018IFNSX4,https://link.amazon/B0iZvT7x7,https://www.amazon.com/Elvie-Exerciser-Strengthen-Biofeedback-Strength/dp/B018IFNSX4?linkCode=sl2&tag=buynow01c3-20&linkId=4abdb48203284a00cb321309a7aa9bce&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-1ef0cebb8e9b1d00&btn_type=ss&btn_ref=srctok-1ef0cebb8e9b1d00
cooljams-pyjamas,Cool-jams Moisture-Wicking Women's Pajama Set,B07FCZD43T,https://link.amazon/B0cUVdZem,https://www.amazon.com/Cool-jams-Moisture-Wicking-Pajama-Sleeves/dp/B07FCZD43T?linkCode=sl2&tag=buynow01c3-20&linkId=8d75a5519da720ceb76e5dfbcdf1b0c6&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-6ea115fa8d1e6ec2&btn_type=ss&btn_ref=srctok-6ea115fa8d1e6ec2
bedjet,BedJet Cooling and Heating Climate Fan for Beds,B01BMCWJ7G,https://link.amazon/B04B4e0xU,https://www.amazon.com/BedJet-Cooling-Heating-Climate-Control/dp/B01BMCWJ7G?th=1&linkCode=sl2&tag=buynow01c3-20&linkId=c50f495940ad93a88cf49410ac99d05e&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-66564ddae5c419b7&btn_type=ss&btn_ref=srctok-66564ddae5c419b7
book-menopause-manifesto,The Menopause Manifesto by Dr Jen Gunter,0806540664,https://link.amazon/B0iOx34Ml,https://www.amazon.com/Menopause-Manifesto-Health-Facts-Feminism/dp/0806540664?linkCode=sl2&tag=buynow01c3-20&linkId=8745d014c44086ab7146433085bf1cd6&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-441dcd465c8484e7&btn_type=ss&btn_ref=srctok-441dcd465c8484e7
book-new-menopause,The New Menopause by Dr Mary Claire Haver,059379625X,https://link.amazon/B0jhQK6G2,https://www.amazon.com/New-Menopause-Navigating-Through-Hormonal/dp/059379625X?linkCode=sl2&tag=buynow01c3-20&linkId=13cea0d268aaac3b9eb0766272ef5b4d&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-231940a5c19ece92&btn_type=ss&btn_ref=srctok-231940a5c19ece92
book-next-level,Next Level by Dr Stacy Sims,B0H94P11XX,https://link.amazon/B0aHj4cGq,https://www.amazon.com/Next-Level-Kicking-Crushing-Menopause/dp/B0H94P11XX?linkCode=sl2&tag=buynow01c3-20&linkId=165eab43ce4419e974c6f2312538b32f&language=en_US&gaOptInStatus=true&ref_=as_li_ss_tl&ascsubtag=srctok-51dee369089913ea&btn_type=ss&btn_ref=srctok-51dee369089913ea
```

### Where each product goes

| Product | Place it on pages about | What you may honestly say | Never place it |
| --- | --- | --- | --- |
| Replens | Vaginal dryness, painful sex, moisturiser vs lubricant | A non-hormonal vaginal moisturiser for ongoing dryness | Bleeding, infection, cancer or urgent sections |
| Revaree | Vaginal dryness, hormone-free options | A hormone-free hyaluronic acid insert that some women try for dryness | As a hot flash or libido treatment |
| Uberlube | Painful sex, vaginal dryness, low libido | A silicone lubricant that can make sex more comfortable | As a dryness treatment or libido booster |
| Elvie Trainer | Bladder leaks, pelvic floor, stress incontinence | A biofeedback device that may help women do pelvic floor exercises correctly | Pelvic pain, prolapse or urgent bladder sections |
| Cool-jams | Night sweats, hot flashes at night, sleep | Moisture-wicking sleepwear for comfort | As a hot flash treatment |
| BedJet | Night sweats, sleeping cooler, bed cooling | A bed cooling system for comfort; a high-price option | As a hot flash treatment |
| The Menopause Manifesto | Books, perimenopause and menopause hubs, myths | An evidence-focused guide by a gynaecologist | Pages it contradicts without context |
| The New Menopause | Books, HRT and symptom hubs | A bestselling doctor-written guide covering symptoms and treatment | As an endorsement of every claim in it |
| Next Level | Exercise, strength training, joint pain, bone health | Training and nutrition guidance for women through menopause | As medical advice |

Don't say any product cures, treats, fixes, reverses or prevents a condition. If the exact claim isn't supported by a source you have opened, leave it out.

## Articles to write or upgrade

For each topic below, search the site for an existing page first. If one exists, upgrade it in place and keep its URL. If none exists, create it using the site's existing URL pattern and article template. Never create a second page that answers the same question.

Before writing, search the web for the current top results on that question. Note what they miss, then make this page clearly more useful. Verify every medical claim against a source you have opened, such as a medical society guideline, a systematic review or the product's own label.

| Article | The reader's real question | Must include | Products |
| --- | --- | --- | --- |
| Vaginal dryness after menopause: what actually helps | Why is this happening, and what can I do? | Causes; moisturiser vs lubricant vs prescription vaginal estrogen; when to see a doctor | Replens, Revaree, Uberlube |
| Vaginal moisturiser vs lubricant: which do you need? | Which one should I buy? | Comparison table: when to use each, how often, what each can't do | Replens, Revaree, Uberlube |
| Painful sex in perimenopause and menopause | Is this normal, and how do I make sex comfortable again? | Causes; comfort steps; prescription options; signs that need a doctor | Uberlube, Replens |
| Bladder leaks in menopause | Why am I leaking, and what helps? | Stress vs urge leaks; pelvic floor training; when to see a doctor or pelvic physio | Elvie Trainer |
| How to do pelvic floor exercises correctly | Am I doing Kegels right? | Plain step-by-step method; common mistakes; how long before results; who should get assessed first | Elvie Trainer |
| Night sweats: how to sleep cooler tonight | How do I stop waking up soaked? | Bedroom temperature, bedding, layers, triggers; treatment options that work; when to see a doctor | Cool-jams, BedJet |
| Best sleepwear for night sweats: how to choose | What should I wear to bed? | How to choose fabric and fit; what sleepwear can and can't do | Cool-jams |
| Cooling your bed: fans, sheets and climate systems compared | Is a bed cooling system worth it? | Comparison by price level, noise, set-up and who each suits | BedJet |
| Menopause books worth reading, chosen by evidence | Which books can I trust? | A short, honest review of each book, who it suits and any limits | All three books |
| Strength training through menopause | What exercise should I do now? | Why strength and impact training matter for muscle and bone; a simple starter plan; safety | Next Level |

Also add a short "Further reading" link to the relevant book on existing hub pages for perimenopause, menopause and HRT, and on exercise pages. Use one book per page, chosen for the topic.

### Internal links

- Every new or upgraded article links to its main hub, two to four closely related articles and one relevant tool if the site has one.
- Add a link from each related existing page to each new article, placed in a sentence where it helps the reader.
- Make sure no new page is orphaned, and update the sitemap and any related-articles lists the site generates.
- Use descriptive anchor text, such as "how moisturisers and lubricants differ", and never "click here".

## Product blocks and copy

The article earns trust first, and the product comes once she knows what she needs. Readers who feel sold to don't come back.

### Placement

- Put the product after the answer and the explanation, at the point where the article reaches that decision. Never put it above the opening answer.
- Use one product block per decision point. A buying or comparison article may list several products; a symptom article should usually show one or two.
- Keep products out of urgent or "see a doctor now" sections, tool results and pages about bleeding, cancer or emergencies.
- Don't use pop-ups, sticky product bars, countdowns or fake urgency.

### What a product block shows

1. Product name.
2. **Best for:** one line naming the reader's situation, such as "daily dryness that isn't only during sex".
3. **Why we included it:** one or two plain sentences based on what the product is and what the evidence shows.
4. **What it won't do:** one honest line, such as "It won't help hot flashes."
5. **Who should check first:** one line where relevant, such as people with a latex or silicone sensitivity, a pelvic condition or bleeding.
6. A clear button: "Check it on Amazon".
7. A label directly next to the block: "Paid link: we may earn a commission. We aren't doctors. Read the product label and ask a doctor or pharmacist if you're unsure it suits you."

Don't show prices, star ratings, review counts, Amazon review text or "bestseller" badges.

### Copy rules

- Write in your own words. Don't copy Amazon's product title, bullets or description as your copy.
- Use direct, warm language: "If dryness bothers you every day, not only during sex, a moisturiser is the better fit."
- Don't claim you tested products. Don't invent reviews, user stories or experts.
- Don't use "cure", "fix", "miracle", "clinically proven", "balance your hormones" or "doctors don't want you to know".
- Don't repeat a brand's health claims unless you have checked the evidence yourself.
- For how to use a product, tell her to follow its label. Don't invent instructions, doses or frequencies.

### Example

> **Replens Long-Lasting Vaginal Moisturizer** **Best for:** dryness you notice day to day, not only during sex. **Why we included it:** It's a non-hormonal vaginal moisturiser, which is a common first step for dryness before or alongside prescription options. **What it won't do:** It doesn't treat hot flashes or other menopause symptoms. **Check first:** See a doctor first if you have bleeding, pain or signs of infection. \[Check it on Amazon\] Paid link: we may earn a commission. We aren't doctors. Read the product label and ask a doctor or pharmacist if you're unsure it suits you.

Verify the evidence line in that example before publishing it, as with every claim.

## Amazon and FTC rules

These come from Amazon's Associates policies and FTC guidance. Apply them site-wide, and replace any existing behaviour that breaks them.

**Amazon requirements**

1. **Disclosure:** show "As an Amazon Associate we earn from qualifying purchases." clearly on every page with an Amazon link, near the top of the article, and in the site footer. Add it to the existing affiliate disclosure page too, or create that page if none exists.
2. **Direct links:** link straight to the Amazon URL. Don't send Amazon links through the site's own redirect or link-cloaking routes (such as `/go/` or `/out/`), and don't hide or rewrite them.
3. **Link attributes:** use `rel="sponsored nofollow noopener"` and open in a new tab.
4. **No prices or ratings:** Amazon only allows prices, availability and star ratings that come from its own API. This site doesn't use the API, so show none of them.
5. **No Amazon links offline:** keep Amazon links out of PDFs, printables, downloadable doctor reports and anything meant to be printed. In emails, link to the site's article rather than straight to Amazon.
6. **Images:** don't copy Amazon product photos. Use no image, an original illustration or an image Amazon's own tools provide.
7. **Trademarks:** don't use "Amazon" in page names, URLs or logos beyond the plain button text and disclosure.
8. **Accurate claims:** Amazon prohibits inaccurate or misleading claims about products, and so does the FTC.

**Health and FTC requirements**

- Health claims need competent and reliable scientific evidence. If you can't support a claim, cut it.
- The commission disclosure must be visible next to the link, not hidden behind another link.
- Keep the site's existing medical notice on every medical article. If there isn't one, add this near the top and in the footer: "General information based on published sources. This isn't medical or legal advice, a diagnosis or a treatment plan. We aren't doctors. Please consult a doctor about your own symptoms. If your symptoms are severe or sudden, seek urgent care."
- Never say a product diagnoses, cures, treats or prevents a condition unless the evidence supports that exact claim.
- Keep products out of urgent guidance, bleeding, cancer and crisis content.

**Privacy:** never pass symptoms, page answers or tool inputs to Amazon or analytics. Track only that a product link was clicked, using the product ID.

## Checks and final report

Run these checks on the production build, not only the source files.

- [ ] All nine products are in one data file, and no Amazon URL is typed directly into article text.
- [ ] Every Amazon URL matches the list exactly, and each opens the correct product page.
- [ ] Each product appears only on pages from its placement row, and never in urgent, bleeding, cancer or tool-result sections.
- [ ] Every page with an Amazon link shows the Associates disclosure and the paid-link label beside each block.
- [ ] No Amazon prices, ratings, reviews, badges or copied product photos appear anywhere.
- [ ] Amazon links don't pass through any site redirect, and they carry `rel="sponsored nofollow noopener"`.
- [ ] No Amazon links appear in PDFs, printables or email templates.
- [ ] Banned words such as "cure", "miracle", "clinically proven" and "balance your hormones" don't appear in product copy.
- [ ] Every new article is linked from at least two existing pages, links to its hub and appears in the sitemap.
- [ ] No two pages answer the same question.
- [ ] Pages still pass the site's existing build, lint, accessibility and performance checks.
- [ ] Product blocks look right on a phone and on desktop. Check screenshots of at least three pages.

**Report**

Finish with `AFFILIATE_PLACEMENT_REPORT.md` and a short summary in chat, covering:

1. A table of every placement: page URL, product, section heading and whether the page was new or upgraded.
2. New articles created and existing articles upgraded.
3. Internal links added.
4. Any claim you removed because you couldn't verify it.
5. Any product you didn't place, and why.
6. Check results and screenshots.
7. A note for the owner that the Replens link uses tracking ID `blackxpace05-20` while the others use `buynow01c3-20`.

If something isn't finished or verified, say so plainly.
