export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('text/html')) return response;

  return new HTMLRewriter()
    .on('head', {
      element(element) {
        element.append('<link rel="stylesheet" href="/css/brand-theme.css" data-afwm-brand-theme="true">', { html: true });
      }
    })
    .on('body', {
      element(element) {
        element.append('<script src="/js/catalog-overrides.js" data-afwm-catalog="true"></script>', { html: true });
      }
    })
    .transform(response);
}
