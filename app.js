
// Canonical URL
app.use((req, res, next) => {
  const host = (req.get('host') || '').toLowerCase();
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;

  if (host !== 'www.rooterking.ca' || protocol !== 'https') {
    return res.redirect(
      301,
      `https://www.rooterking.ca${req.originalUrl}`
    );
  }

  next();
});

// Your existing routes below
