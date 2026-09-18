# InsteadThis

The rebuilt InsteadThis site: Next.js 16 (App Router), with all 880 published posts from the old WordPress site stored as Markdown files. Every page is generated as static HTML at build time, so the site is fast and needs no database.

## Get it running

You need Node.js 20.9 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

### Add the images

The images are not in this folder yet, because the old uploads folder is several GB and most of it is unused thumbnails. This command copies only the 3,380 files the posts actually use:

```bash
npm run copy-media -- ~/path/to/bitnami/apps/wordpress/htdocs/wp-content/uploads
```

They land in `public/images/uploads/`. Until you run it, pages show tinted placeholder shapes where images go.

### Build and deploy

```bash
npm run build
npm start
```

On Vercel: import the repo and set `NEXT_PUBLIC_SITE_URL` to your live address (see `.env.example`). It's used for canonical URLs, the sitemap, and social previews.

Commit `public/images/uploads` with the rest of the project so the deploy includes the images. A few hundred MB of images in git is workable. If it grows much larger, move them to a storage bucket and update the paths.

## How it's organized

| Path | What it is |
| --- | --- |
| `content/posts/*.md` | One file per story. Edit the text here. |
| `src/lib/topics.ts` | The seven topics: names, descriptions, and colors |
| `src/lib/site.ts` | Site name, description, posts per page |
| `src/app/globals.css` | All styling. Color and type tokens are at the top. |
| `src/app/...` | Pages: home, `/stories`, `/stories/[slug]`, `/topics/[topic]`, `/search` |
| `data/redirects.json` | Old WordPress URLs mapped to new ones |
| `scripts/` | Image copy script, image list, and the topic classifier |

## Topics

Posts were regrouped from the old WordPress categories into seven topics, using each post's old categories, tags, title, and body text:

| Topic | Stories | Mostly from |
| --- | --- | --- |
| Relationships | 277 | Personal, Ask Kiara Q&As, love and dating |
| Style & beauty | 345 | Fashion, Beauty, Girly, product reviews |
| Wellness & growth | 97 | Growth, Motivational, Inspiration, health |
| Food & drink | 65 | Food, coffee, breakfast, drinks |
| Culture & celebrations | 52 | Celebrity, movies, music, books, festivals |
| Travel | 24 | Travel |
| Home & pets | 20 | Plants, pets, interiors |

To move a story, change its `topic:` line. The value must be one of `relationships`, `style`, `wellness`, `food`, `travel`, `culture`, or `home`. The original categories are kept in `legacyCategories` for reference.

## Writing a new story

Add a file to `content/posts/`, named after the slug:

```markdown
---
title: "Your headline"
slug: "your-headline"
date: "2026-10-01T09:00:00"
author: "Your name"
topic: "relationships"
tags: ["love"]
featured: false
description: "One or two sentences for cards and search results."
image: "/images/uploads/2026/10/your-image.jpg"
imageAlt: "What the image shows"
readingTime: 5
---
Your story in Markdown. A YouTube link on its own line becomes an embedded video.
```

Put the image in `public/images/uploads/...` to match the path. Marking a story `featured: true` makes it eligible for the homepage's top spot.

## Old links keep working

- Every old post URL (`/2023/05/12/post-name/`) permanently redirects to `/stories/post-name`.
- Old `/category/`, `/tag/`, and `/author/` pages redirect to `/stories`.
- Old `/wp-content/uploads/...` image links redirect to the new image paths.
- `/sitemap.xml` lists every story. Submit it in Google Search Console after launch.

## Before launch

- **Newsletter:** the signup form isn't connected to an email service yet. Visitors who submit it are told signups aren't open. Connect a provider in `src/components/NewsletterForm.tsx`.
- **Hotlinked images:** 818 images inside posts load from other websites (mostly product shots in reviews). They may break over time.
- **Duplicate titles:** 117 stories are titled "Product reviews" or similar. The homepage skips them, but they're worth retitling.
- **Missing featured images:** 45 stories don't have one, and show a tinted placeholder instead.
- **Author names** come straight from the old site. Edit the `author:` line in any file to change one.
