# PC-002 - Supabase Foundation

## Purpose

PC-002 establishes RADAS V2 data ownership, editorial workflow and access control before live data is connected to the interface.

## Core tables

- `profiles`: application role and subscription entitlement.
- `researches`: product inputs, AI outputs, editorial state and publishing data.
- `research_generation_runs`: addressable history for every AI generation, including model, tokens, cost and failure details.

## Editorial states

`draft -> ai_generated -> in_review -> published -> archived`

Publishing requires a reviewer, publication date, snapshot, verdict and research insight. AI output can never satisfy publication by itself.

## Access model

- Public and free users: published research marked `free`.
- Pro users: published `free` and `pro` research.
- Editor: draft and edit core research, but cannot delete.
- Admin: full editorial and account control.

## Storage

The public `product-images` bucket accepts JPEG, PNG and WebP files up to 5 MB. Only staff roles can write; only admins can delete.