export default async function handler(req, res) {
  res.setHeader('location', 'https://medianewbuild.com/file/hh-media-bucket/agents/781e7ba1-700a-427f-9cab-aeb1350fa1dc/feed_sol.xml');
  res.statusCode = 302;
  res.end();
}
