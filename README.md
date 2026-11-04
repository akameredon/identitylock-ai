# IdentityLock AI storefront

IdentityLock AI is a prompt catalogue and identity-preserving wardrobe workflow. The primary customer offer is **choose any 10 unique prompts for NGN ₦500**. The original fixed-bundle ZIP purchase remains available separately at `/legacy-bundle.html`.

## Current product configuration

- Primary product: choose any 10 prompts from the published catalogue.
- Permanent one-time price: **NGN ₦500**.
- Currency: **NGN**.
- Server-fixed Paystack amount: **50,000 kobo**.
- Prompt set metadata identifier: `identitylock-prompt-set`.
- Initial catalogue: 16 published prompt choices across five categories.
- No customer account, wallet, credit balance or subscription is required.

## Customer flow

1. The homepage links to `/catalogue.html`.
2. The customer selects exactly ten unique published prompt IDs and enters an email address.
3. `POST /api/prompt-set-checkout` validates the exact-ten selection, snapshots the current prompt versions and initializes a server-fixed ₦500 Paystack checkout.
4. Paystack returns the customer to `/prompt-success.html?reference=...`.
5. `GET /api/prompt-set-verify` verifies the Paystack transaction and atomically marks the matching order paid.
6. `GET /api/prompt-set-delivery` returns only the ten immutable prompt versions saved with that paid order.
7. The delivery page offers per-prompt copy, copy-all and a plain-text download.

The browser never controls the price. Full prompt text is not queried by the public catalogue and is not returned until a paid order is verified.

## Legacy fixed bundle

- `/legacy-bundle.html` retains the original fixed-bundle checkout and ZIP download flow.
- `POST /api/checkout`, `GET /api/verify`, and `GET /api/download` remain unchanged.
- The legacy ZIP remains in `.private-assets/IdentityLock_AI_Complete_Bundle.zip` and must never be moved into the public web root.

## Admin Studio

- `/admin.html` includes Homepage Manager, Media Library, and Prompt Catalogue.
- Admins can create categories, draft/publish prompts, append immutable versions, search and archive.
- Prompt versions are never overwritten or deleted through the Admin Studio.
- Public catalogue reads only listing metadata; full prompt text remains in the admin-only versions table.

## Configuration and security

1. Keep `PAYSTACK_SECRET_KEY` and `SUPABASE_SECRET_KEY` configured as Sensitive production environment variables. Never expose their values in browser code or logs.
2. Keep the Paystack amount fixed at 50,000 kobo and currency NGN in the server-side checkout API.
3. Delivery uses a SECURITY INVOKER database RPC executable only by `service_role`; anon/authenticated cannot execute it.
4. Delivery reads only paid orders with exactly ten saved prompt-version snapshots.
5. Delivery responses are private and non-cacheable.
6. Preserve existing order history and prompt versions. Do not add delete/reset/drop operations.

## Verification

- Core, selection, checkout, verification and delivery Node tests are in `tests/`.
- G05 and G06 implementation notes are in `docs/`.
- Database integration checks use rollback-only transactions; no QA order or prompt rows are retained.
- Keep the old fixed-bundle route available until the new storefront is fully verified.
