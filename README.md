<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cc67d667-386f-42a6-9529-3b0617bef109

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Vendor Document Storage (Admin Access Anytime)

Vendor registration documents can be stored in S3 so admin links remain available even after server restarts or redeploys.

Set these backend environment variables:

- `VENDOR_DOCUMENT_STORAGE=s3`
- `AWS_REGION=ap-south-1`
- `AWS_ACCESS_KEY_ID=...`
- `AWS_SECRET_ACCESS_KEY=...`
- `AWS_S3_BUCKET=your-bucket-name`
- `AWS_S3_PUBLIC_BASE_URL=https://your-cdn-or-public-bucket-url` (optional)

If `VENDOR_DOCUMENT_STORAGE` is not set to `s3`, the app automatically falls back to local disk storage under `server/uploads/vendor-documents`.
