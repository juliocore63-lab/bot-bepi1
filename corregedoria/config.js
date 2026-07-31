function separarIds(valor) {
  return String(valor || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

module.exports = {
  categoriaId: process.env.CORREGEDORIA_CATEGORY_ID || null,
  canalLogsId: process.env.CORREGEDORIA_LOG_CHANNEL_ID || null,
  cargosAutorizados: separarIds(process.env.CORREGEDORIA_ROLE_IDS),
  bannerUrl: process.env.CORREGEDORIA_BANNER_URL || null,
};
