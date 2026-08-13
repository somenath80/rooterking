app.use((req, res, next) => {
  const host = req.get('host');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;

  const canonicalHost = 'www.rooterking.ca';

  if (host !== canonicalHost || protocol !== 'https') {
    return res.redirect(
      301,
      `https://${canonicalHost}${req.originalUrl}`
    );
  }

  next();
});