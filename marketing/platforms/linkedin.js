// LinkedIn adapter — posts to organization page using the Marketing Developer Platform.
// Secrets:
//   LINKEDIN_ACCESS_TOKEN   long-lived (60 days, refreshed via OAuth flow)
//   LINKEDIN_ORG_URN        e.g. "urn:li:organization:12345678" (your company page URN)

const API = 'https://api.linkedin.com/v2';

export async function publish(env, { copy, media, productUrl, type, allCopy }) {
  if (!env.LINKEDIN_ACCESS_TOKEN || !env.LINKEDIN_ORG_URN) throw new Error('LinkedIn creds missing');

  // Fall back to IG caption if no LinkedIn-specific copy
  const fallback = (allCopy && (allCopy.instagram || allCopy.facebook)) || {};
  copy = (copy && copy.caption) ? copy : fallback;
  const text = (copy.caption || '').slice(0, 3000); // LinkedIn caps at 3000 chars

  const headers = {
    'Authorization': 'Bearer ' + env.LINKEDIN_ACCESS_TOKEN,
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json',
  };

  let mediaAsset = null;
  const imageUrl = media?.imageUrl || media?.thumbnailUrl;

  // For image posts: register, upload, then post
  if (imageUrl) {
    try {
      // Step 1: register upload
      const reg = await fetch(`${API}/assets?action=registerUpload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: env.LINKEDIN_ORG_URN,
            serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
          },
        }),
      });
      const regData = await reg.json();
      const uploadUrl = regData?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      const asset = regData?.value?.asset;
      if (uploadUrl && asset) {
        // Step 2: fetch + upload image bytes
        const img = await fetch(imageUrl);
        const bytes = await img.arrayBuffer();
        await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + env.LINKEDIN_ACCESS_TOKEN },
          body: bytes,
        });
        mediaAsset = asset;
      }
    } catch (_) {}
  }

  // Build the share content
  const shareContent = mediaAsset
    ? {
        shareCommentary: { text },
        shareMediaCategory: 'IMAGE',
        media: [{
          status: 'READY',
          description: { text: (copy.caption || 'AF Wealth Mindset').slice(0, 200) },
          media: mediaAsset,
          title: { text: (copy.title || 'AF Wealth Mindset').slice(0, 100) },
        }],
      }
    : {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      };

  const post = await fetch(`${API}/ugcPosts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      author: env.LINKEDIN_ORG_URN,
      lifecycleState: 'PUBLISHED',
      specificContent: { 'com.linkedin.ugc.ShareContent': shareContent },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  const data = await post.json();
  if (!post.ok || !data.id) throw new Error('LinkedIn: ' + JSON.stringify(data));

  return {
    externalId: data.id,
    url: `https://www.linkedin.com/feed/update/${data.id}/`,
    caption: text,
  };
}
