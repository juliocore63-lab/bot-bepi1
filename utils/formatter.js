function formatMinutes(min) {
  const total = Math.floor(Number(min) || 0);

  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  return `${String(horas).padStart(2, "0")}h ${String(
    minutos
  ).padStart(2, "0")}min`;
}

function formatTempoIndividual(viatura, equipeFinal) {
  if (!equipeFinal.length) {
    return "Nenhum tempo registrado.";
  }

  return equipeFinal
    .map((membroId, index) => {
      const tempo = viatura.tempoIndividual?.[membroId] || 0;
      return `P${index + 1}: <@${membroId}> — ${tempo.toFixed(1)} min`;
    })
    .join("\n");
}

module.exports = {
  formatMinutes,
  formatTempoIndividual,
};